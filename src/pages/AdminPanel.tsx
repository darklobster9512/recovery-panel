import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield, Users, FileText, LogOut, Phone, LayoutDashboard,
  ClipboardCheck, FolderOpen, Mail, Inbox, Settings,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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

type NavItem = { label: string; icon: typeof LayoutDashboard; path: string; exact?: boolean; group?: string };

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", exact: true },
  { label: "Leads", icon: Inbox, path: "/admin/leads", group: "Vertrieb" },
  { label: "Vics", icon: Users, path: "/admin/vics", group: "Vertrieb" },
  { label: "Verifikationen", icon: FileText, path: "/admin/verifikationen", group: "Betrieb" },
  { label: "In Überprüfung", icon: ClipboardCheck, path: "/admin/ueberpruefung", group: "Betrieb" },
  { label: "Dokumente", icon: FolderOpen, path: "/admin/dokumente", group: "Betrieb" },
  { label: "Telefonnummern", icon: Phone, path: "/admin/telefonnummern", group: "Betrieb" },
  { label: "Email Vorlagen", icon: Mail, path: "/admin/emails", group: "System" },
  { label: "Einstellungen", icon: Settings, path: "/admin/einstellungen", group: "System" },
];

function pageTitle(pathname: string): string {
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return "Nutzer Details";
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) return "Lead Details";
  const map: Record<string, string> = {
    "/admin": "Admin Dashboard",
    "/admin/vics": "Vics",
    "/admin/leads": "Leads",
    "/admin/verifikationen": "Verifikationen",
    "/admin/ueberpruefung": "In Überprüfung",
    "/admin/dokumente": "Dokumente",
    "/admin/telefonnummern": "Telefonnummern",
    "/admin/emails": "Email Vorlagen",
    "/admin/einstellungen": "Einstellungen",
  };
  return map[pathname] ?? "Admin";
}

function renderRoute(pathname: string) {
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return <AdminVicDetail />;
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) return <AdminLeadDetail />;
  switch (pathname) {
    case "/admin/vics": return <AdminVics />;
    case "/admin/leads": return <AdminLeads />;
    case "/admin/verifikationen": return <AdminVerifications />;
    case "/admin/ueberpruefung": return <AdminReview />;
    case "/admin/dokumente": return <AdminDocuments />;
    case "/admin/telefonnummern": return <AdminPhoneNumbers />;
    case "/admin/emails": return <AdminEmailTemplates />;
    case "/admin/einstellungen": return <AdminSettings />;
    default: return <AdminDashboard />;
  }
}

export default function AdminPanel() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const initials = (user?.email ?? "A").slice(0, 2).toUpperCase();
  const title = pageTitle(location.pathname);

  // group nav items preserving order
  const groups: { label: string | null; items: NavItem[] }[] = [];
  for (const it of navItems) {
    const label = it.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.path : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon" className="[&>div[data-sidebar=sidebar]]:bg-gradient-to-b [&>div[data-sidebar=sidebar]]:from-[hsl(221,100%,50%)] [&>div[data-sidebar=sidebar]]:to-[hsl(221,100%,35%)]">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate text-base font-bold text-sidebar-foreground">Admin Panel</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Korte &amp; Partner</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {groups.map((g, gi) => (
              <div key={`${g.label ?? "_"}-${gi}`}>
                {gi > 0 && <SidebarSeparator />}
                <SidebarGroup>
                  {g.label ? (
                    <SidebarGroupLabel className="px-3 mt-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                      {g.label}
                    </SidebarGroupLabel>
                  ) : (
                    <SidebarGroupLabel className="px-3 mt-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                      Overview
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
                              className={`h-10 rounded-lg text-sidebar-foreground/90 hover:bg-white/10 hover:text-sidebar-foreground ${
                                active
                                  ? "bg-white text-primary font-medium shadow-sm hover:bg-white hover:text-primary"
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

          <SidebarFooter className="border-t border-white/15">
            <div className="flex items-center gap-2 px-2 py-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-white text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-medium text-sidebar-foreground">{user?.email}</p>
                <p className="truncate text-[10px] capitalize text-sidebar-foreground/70">Administrator</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/90 hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:hidden"
                onClick={handleSignOut}
                aria-label="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-5">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full uppercase tracking-wide">
                Admin
              </span>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8 bg-background" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
            {renderRoute(location.pathname)}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
