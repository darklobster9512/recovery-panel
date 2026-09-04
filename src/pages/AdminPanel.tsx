import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield, Users, FileText, LogOut, Phone, LayoutDashboard,
  ClipboardCheck, FolderOpen, Mail, Inbox, Settings, Send, Headphones, MessageCircle, CalendarDays, ListChecks,


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
import AdminTelegram from "@/components/AdminTelegram";
import AdminCallers from "@/components/AdminCallers";
import AdminLivechat from "@/components/AdminLivechat";
import AdminAppointments from "@/components/AdminAppointments";
import AdminTodos from "@/components/AdminTodos";



type NavItem = { label: string; icon: typeof LayoutDashboard; path: string; exact?: boolean; group?: string; adminOnly?: boolean };

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", exact: true },
  { label: "Leads", icon: Inbox, path: "/admin/leads", group: "Vertrieb" },
  { label: "Vics", icon: Users, path: "/admin/vics", group: "Vertrieb" },
  { label: "Caller", icon: Headphones, path: "/admin/caller", group: "Vertrieb", adminOnly: true },
  { label: "Livechat", icon: MessageCircle, path: "/admin/livechat", group: "Vertrieb" },
  { label: "Termine", icon: CalendarDays, path: "/admin/termine", group: "Vertrieb" },
  { label: "To Dos", icon: ListChecks, path: "/admin/todos", group: "Vertrieb" },


  { label: "Verifikationen", icon: FileText, path: "/admin/verifikationen", group: "Betrieb" },
  { label: "In Überprüfung", icon: ClipboardCheck, path: "/admin/ueberpruefung", group: "Betrieb" },
  { label: "Dokumente", icon: FolderOpen, path: "/admin/dokumente", group: "Betrieb" },
  { label: "Telefonnummern", icon: Phone, path: "/admin/telefonnummern", group: "Betrieb" },
  { label: "Email Vorlagen", icon: Mail, path: "/admin/emails", group: "System" },
  { label: "Telegram", icon: Send, path: "/admin/telegram", group: "System" },
  { label: "Einstellungen", icon: Settings, path: "/admin/einstellungen", group: "System" },
];

function pageTitle(pathname: string): string {
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return "Nutzer Details";
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) return "Lead Details";
  const map: Record<string, string> = {
    "/admin": "Admin Dashboard",
    "/admin/vics": "Vics",
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
  };
  return map[pathname] ?? "Admin";
}

function renderRoute(pathname: string) {
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return <AdminVicDetail />;
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) return <AdminLeadDetail />;
  switch (pathname) {
    case "/admin/vics": return <AdminVics />;
    case "/admin/leads": return <AdminLeads />;
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
    default: return <AdminDashboard />;
  }
}

export default function AdminPanel() {
  const { user, role, signOut } = useAuth();
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
      <div className="admin-workspace min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border p-0">
            <div className="flex h-20 items-center gap-3 px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sidebar-foreground/20 bg-sidebar-foreground text-sidebar">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate font-display text-sm font-semibold text-sidebar-foreground">Korte &amp; Partner</span>
                <span className="truncate text-[10px] font-semibold uppercase text-sidebar-foreground/55" style={{ letterSpacing: "0.08em" }}>Operations</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {groups.map((g, gi) => (
              <div key={`${g.label ?? "_"}-${gi}`}>
                {gi > 0 && <SidebarSeparator />}
                <SidebarGroup>
                  {g.label ? (
                    <SidebarGroupLabel className="px-3 mt-3 text-[10px] font-bold uppercase text-sidebar-foreground/45" style={{ letterSpacing: "0.08em" }}>
                      {g.label}
                    </SidebarGroupLabel>
                  ) : (
                    <SidebarGroupLabel className="px-3 mt-3 text-[10px] font-bold uppercase text-sidebar-foreground/45" style={{ letterSpacing: "0.08em" }}>
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
                              className={`h-9 rounded-md border-l-2 border-transparent px-3 text-[13px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground ${
                                active
                                  ? "border-sidebar-foreground bg-sidebar-accent text-sidebar-foreground shadow-sm hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarFallback className="rounded-md bg-sidebar-foreground text-[11px] font-bold text-sidebar">
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
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-card px-5 lg:px-8">
            <SidebarTrigger className="border border-border bg-card shadow-sm" />
            <div className="h-5 w-px bg-border" />
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Administration</p>
              <h1 className="truncate font-display text-lg font-semibold text-foreground">{title}</h1>
            </div>
          </header>
          <main className="flex-1 bg-background" style={{ minHeight: "calc(100vh - 5rem)" }}>
            <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-8 xl:p-10">
              {renderRoute(location.pathname)}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
