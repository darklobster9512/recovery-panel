import { useQueryClient } from "@tanstack/react-query";
import { useAdminTheme } from "@/hooks/useAdminTheme";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield, Users, FileText, LogOut, Sun, Moon, Phone, LayoutDashboard,
  ClipboardCheck, FolderOpen, Mail, Inbox, Settings, Send, Headphones, MessageCircle, CalendarDays, ListChecks,
  MessageSquare, Palette, ChevronsUpDown, Check,
} from "lucide-react";
import { BrandingProvider, useActiveBranding } from "@/contexts/BrandingContext";
import AdminBrandings from "@/components/AdminBrandings";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarSeparator,
} from "@/components/ui/sidebar";
import AdminVics from "@/components/AdminVics";
import AdminVicDetail from "@/components/AdminVicDetail";
import AdminVerifications from "@/components/AdminVerifications";
import AdminPhoneNumbers from "@/components/AdminPhoneNumbers";
import AdminDashboard from "@/components/AdminDashboard";
import AdminReview from "@/components/AdminReview";
import AdminDocuments from "@/components/AdminDocuments";
import AdminEmailTemplates from "@/components/AdminEmailTemplates";
import AdminLeads from "@/components/AdminLeads";
import AdminLeadDetail from "@/components/AdminLeadDetail";
import AdminSettings from "@/components/AdminSettings";
import AdminTelegram from "@/components/AdminTelegram";
import AdminCallers from "@/components/AdminCallers";
import AdminLivechat from "@/components/AdminLivechat";
import AdminAppointments from "@/components/AdminAppointments";
import AdminTodos from "@/components/AdminTodos";
import AdminContactRequests from "@/components/AdminContactRequests";



type NavItem = { label: string; icon: typeof LayoutDashboard; path: string; exact?: boolean; group?: string; adminOnly?: boolean };

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", exact: true },
  { label: "Anfragen", icon: MessageSquare, path: "/admin/anfragen", group: "Vertrieb", adminOnly: true },
  { label: "Leads", icon: Inbox, path: "/admin/leads", group: "Vertrieb", adminOnly: true },
  { label: "Vics", icon: Users, path: "/admin/vics", group: "Vertrieb" },
  { label: "Caller", icon: Headphones, path: "/admin/caller", group: "Vertrieb", adminOnly: true },
  { label: "Livechat", icon: MessageCircle, path: "/admin/livechat", group: "Vertrieb" },
  { label: "Termine", icon: CalendarDays, path: "/admin/termine", group: "Vertrieb" },
  { label: "To Dos", icon: ListChecks, path: "/admin/todos", group: "Vertrieb" },


  { label: "Verifikationen", icon: FileText, path: "/admin/verifikationen", group: "Betrieb" },
  { label: "In Überprüfung", icon: ClipboardCheck, path: "/admin/ueberpruefung", group: "Betrieb" },
  { label: "Dokumente", icon: FolderOpen, path: "/admin/dokumente", group: "Betrieb" },
  { label: "Telefonnummern", icon: Phone, path: "/admin/telefonnummern", group: "Betrieb" },
  { label: "Email Vorlagen", icon: Mail, path: "/admin/emails", group: "System", adminOnly: true },
  { label: "Telegram", icon: Send, path: "/admin/telegram", group: "System", adminOnly: true },
  { label: "Brandings", icon: Palette, path: "/admin/brandings", group: "System", adminOnly: true },
  { label: "Einstellungen", icon: Settings, path: "/admin/einstellungen", group: "System", adminOnly: true },
];

function pageTitle(pathname: string): string {
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return "Nutzer Details";
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) return "Lead Details";
  const map: Record<string, string> = {
    "/admin": "Admin Dashboard",
    "/admin/vics": "Vics",
    "/admin/anfragen": "Anfragen",
    "/admin/leads": "Leads",
    "/admin/caller": "Caller",
    "/admin/livechat": "Livechat",
    "/admin/termine": "Termine",
    "/admin/todos": "To Dos",


    "/admin/verifikationen": "Verifikationen",
    "/admin/ueberpruefung": "In Überprüfung",
    "/admin/dokumente": "Dokumente",
    "/admin/telefonnummern": "Telefonnummern",
    "/admin/emails": "Email Vorlagen",
    "/admin/telegram": "Telegram",
    "/admin/einstellungen": "Einstellungen",
    "/admin/brandings": "Brandings",
  };
  return map[pathname] ?? "Admin";
}

function renderRoute(pathname: string, role: string | null) {
  const isAdmin = role === "admin";
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return <AdminVicDetail />;
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) {
    if (!isAdmin) return <Navigate to="/admin/vics" replace />;
    return <AdminLeadDetail />;
  }
  switch (pathname) {
    case "/admin/vics": return <AdminVics />;
    case "/admin/anfragen": return isAdmin ? <AdminContactRequests /> : <Navigate to="/admin" replace />;
    case "/admin/leads": return isAdmin ? <AdminLeads /> : <Navigate to="/admin/vics" replace />;
    case "/admin/caller": return <AdminCallers />;
    case "/admin/livechat": return <AdminLivechat />;
    case "/admin/termine": return <AdminAppointments />;
    case "/admin/todos": return <AdminTodos />;


    case "/admin/verifikationen": return <AdminVerifications />;
    case "/admin/ueberpruefung": return <AdminReview />;
    case "/admin/dokumente": return <AdminDocuments />;
    case "/admin/telefonnummern": return <AdminPhoneNumbers />;
    case "/admin/emails": return <AdminEmailTemplates />;
    case "/admin/telegram": return <AdminTelegram />;
    case "/admin/einstellungen": return <AdminSettings />;
    case "/admin/brandings": return isAdmin ? <AdminBrandings /> : <Navigate to="/admin" replace />;
    default: return <AdminDashboard />;
  }
}

export default function AdminPanel() {
  const { user } = useAuth();
  return (
    <BrandingProvider key={user?.id ?? "anon"}>
      <AdminPanelInner />
    </BrandingProvider>
  );
}

function BrandMark({ logo, name, color }: { logo?: string | null; name: string; color?: string }) {
  if (logo) return <img src={logo} alt={name} className="h-9 w-9 shrink-0 rounded-md bg-sidebar-foreground object-contain p-0.5" />;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sidebar-foreground/20 bg-sidebar-foreground text-sidebar" style={color ? { background: color } : undefined}>
      <Shield className="h-5 w-5" />
    </div>
  );
}

function AdminPanelInner() {
  const { user, role, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useAdminTheme();
  const { brandings, active, setActive, activeBrandingId, ready } = useActiveBranding();
  const isAdmin = role === "admin";
  const [linked, setLinked] = useState<any[]>([]);
  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    if (role !== "caller") return;
    (supabase as any).rpc("my_linked_callers").then(({ data }: any) => setLinked(data ?? []));
  }, [role, user?.id]);
  const queryClient = useQueryClient();
  const [switchLabel, setSwitchLabel] = useState("");
  const switchTo = async (targetId: string) => {
    if (switching) return;
    const t = linked.find((l) => l.caller_id === targetId);
    setSwitchLabel(`${t?.company_name ?? "Branding"} – ${`${t?.first_name ?? ""} ${t?.last_name ?? ""}`.trim() || t?.email || ""}`);
    setSwitching(true);
    const { data, error } = await supabase.functions.invoke("caller-switch", { body: { target_caller_id: targetId } });
    if (error || !data?.access_token) {
      setSwitching(false);
      toast({ title: "Wechsel fehlgeschlagen", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
    queryClient.clear();
    navigate("/admin", { replace: true });
  };
  const selfLink = linked.find((l) => l.is_self);
  const brandName = active?.company_name || "Korte & Partner";
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const initials = (user?.email ?? "A").slice(0, 2).toUpperCase();
  const title = pageTitle(location.pathname);

  const visibleNav = navItems.filter((n) => !n.adminOnly || role === "admin");

  // group nav items preserving order
  const groups: { label: string | null; items: NavItem[] }[] = [];
  for (const it of visibleNav) {
    const label = it.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.path : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

  return (
    <SidebarProvider>
      {switching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Wechsle zu {switchLabel} …</p>
        </div>
      )}
      <div className="admin-workspace min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border p-0">
            <div className="flex h-20 items-center gap-3 px-5">
              <BrandMark logo={active?.logo_url} name={brandName} />
              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate font-display text-sm font-semibold text-sidebar-foreground">{brandName}</span>
                <span className="truncate text-[10px] font-semibold uppercase text-sidebar-foreground/55" style={{ letterSpacing: "0.08em" }}>Operations</span>
              </div>
            </div>
            {isAdmin && (
              <div className="px-3 pb-3 group-data-[collapsible=icon]:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/70">
                      {active?.logo_url ? (
                        <img src={active.logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain bg-background" />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                          {active?.company_name?.charAt(0) ?? "?"}
                        </span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[9px] font-semibold uppercase text-sidebar-foreground/55" style={{ letterSpacing: "0.08em" }}>Branding</span>
                        <span className="truncate text-sm font-medium text-sidebar-foreground">{active?.company_name ?? (ready ? "Branding wählen" : "Lädt …")}</span>
                      </div>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/55" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Aktives Branding</DropdownMenuLabel>
                    {brandings.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Keine Brandings gefunden</div>
                    )}
                    {brandings.map((b) => (
                      <DropdownMenuItem key={b.id} onClick={() => setActive(b.id)} className="gap-2">
                        {b.logo_url ? <img src={b.logo_url} alt="" className="h-6 w-6 rounded object-contain" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center text-sm font-bold text-primary">{(b.company_name || "?").charAt(0).toUpperCase()}</span>}
                        <span className="flex-1 truncate">{b.company_name}</span>
                        {b.id === activeBrandingId && <Check className="h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/brandings")}>Brandings verwalten</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {!isAdmin && linked.length > 1 && (
              <div className="px-3 pb-3 group-data-[collapsible=icon]:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button disabled={switching} className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/70">
                      {selfLink?.logo_url ? (
                        <img src={selfLink.logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain bg-background" />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">{selfLink?.company_name?.charAt(0) ?? "?"}</span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-sidebar-foreground">{selfLink?.company_name ?? "Branding"}</span>
                        <span className="truncate text-[11px] text-sidebar-foreground/60">{`${selfLink?.first_name ?? ""} ${selfLink?.last_name ?? ""}`.trim() || selfLink?.email}</span>
                      </div>
                      {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/55" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Konto wechseln</DropdownMenuLabel>
                    {linked.map((l) => (
                      <DropdownMenuItem key={l.caller_id} disabled={l.is_self} onClick={() => !l.is_self && switchTo(l.caller_id)} className="gap-2">
                        {l.logo_url ? <img src={l.logo_url} alt="" className="h-6 w-6 rounded object-contain" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center text-sm font-bold text-primary">{(l.company_name || "?").charAt(0).toUpperCase()}</span>}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{l.company_name ?? "Ohne Branding"}</p>
                          <p className="truncate text-xs text-muted-foreground">{`${l.first_name ?? ""} ${l.last_name ?? ""}`.trim() || l.email}</p>
                        </div>
                        {l.is_self && <Check className="h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="scrollbar-none">
            {groups.map((g, gi) => (
              <div key={`${g.label ?? "_"}-${gi}`}>
                {gi > 0 && <div className="h-1" />}
                <SidebarGroup>
                  {g.label ? (
                    <SidebarGroupLabel className="px-3 mt-3 text-[10px] font-bold uppercase text-sidebar-foreground/45 dark:text-sidebar-foreground/60" style={{ letterSpacing: "0.08em" }}>
                      {g.label}
                    </SidebarGroupLabel>
                  ) : (
                    <SidebarGroupLabel className="px-3 mt-3 text-[10px] font-bold uppercase text-sidebar-foreground/45 dark:text-sidebar-foreground/60" style={{ letterSpacing: "0.08em" }}>
                      Übersicht
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {g.items.map((item) => {
                        const active = isActive(item);
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              asChild
                              tooltip={item.label}
                              className={`h-9 rounded-xl px-3 text-[13px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground ${
                                active
                                  ? "bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary hover:text-primary-foreground [&_svg]:text-primary-foreground data-[active=true]:bg-primary dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:shadow-[inset_3px_0_0_hsl(var(--primary))] dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground dark:[&_svg]:text-sidebar-accent-foreground"
                                  : ""
                              }`}
                            >
                              <NavLink to={item.path}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </div>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-2 px-3 py-3">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarFallback className="rounded-full bg-sidebar-foreground text-[11px] font-bold text-sidebar">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">{user?.email}</p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">Administrator</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/65 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Helles Design" : "Dunkles Design"}
                title={theme === "dark" ? "Helles Design" : "Dunkles Design"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/65 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
                onClick={handleSignOut}
                aria-label="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border/60 bg-card/85 backdrop-blur px-5 lg:px-8">
            <SidebarTrigger className="rounded-xl border border-border bg-card shadow-sm" />
            <div className="h-5 w-px bg-border" />
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Administration</p>
              <h1 className="truncate font-display text-xl font-bold tracking-tight text-foreground">{title}</h1>
            </div>
          </header>
          <main className="flex-1 bg-background" style={{ minHeight: "calc(100vh - 5rem)" }}>
            <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-8 xl:p-10">
              {ready ? <div key={activeBrandingId ?? "none"}>{renderRoute(location.pathname, role)}</div> : null}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
