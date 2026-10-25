# Bank-Logos in Schritt 3 anzeigen

Die Logos sind als Speicherpfad hinterlegt und brauchen einen signierten Link. Die Verifikationen-Seite nutzt dafür den fertigen Baustein `VerificationLogo`, Schritt 3 hat aber `logo_url` direkt als Bildadresse genommen.

## Änderung
- In `RequestVerificationsSection.tsx` das `<img src={v.logo_url}>` durch `<VerificationLogo value={v.logo_url} alt={bank} className="h-full w-full object-contain p-1" fallback={Initialen} />` ersetzen. Dann erscheinen dieselben Logos wie auf /admin/verifikationen; ohne Logo bleiben die Initialen.
