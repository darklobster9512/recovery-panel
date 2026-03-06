import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, FileText, Settings, LogOut, TrendingUp, AlertTriangle, Activity, Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminVics from "@/components/AdminVics";
import AdminVicDetail from "@/components/AdminVicDetail";
import AdminVerifications from "@/components/AdminVerifications";
import AdminPhoneNumbers from "@/components/AdminPhoneNumbers";

export default function AdminPanel() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isVics = location.pathname === "/admin/vics";
  const isVicDetail = location.pathname.startsWith("/admin/vics/");
  const isVerifikationen = location.pathname === "/admin/verifikationen";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const stats = [
    { label: "Gesamt Nutzer", value: "1.247", icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Offene Cases", value: "38", icon: FileText, color: "text-amber-600 bg-amber-50" },
    { label: "Kritische Fälle", value: "5", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
    { label: "System Status", value: "Online", icon: Activity, color: "text-green-600 bg-green-50" },
  ];

  const navItems = [
    { label: "Dashboard", icon: TrendingUp, path: "/admin" },
    { label: "Vics", icon: Users, path: "/admin/vics" },
    { label: "Verifikationen", icon: FileText, path: "/admin/verifikationen" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-[hsl(221,100%,50%)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Admin Panel</span>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const active = item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[hsl(221,100%,97%)] text-[hsl(221,100%,50%)]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </Button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{isVicDetail ? "Nutzer Details" : isVics ? "Vics" : isVerifikationen ? "Verifikationen" : "Admin Dashboard"}</h1>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Admin</span>
          </div>
          <p className="text-gray-500 text-sm mb-8">{user?.email}</p>

          {isVicDetail ? (
            <AdminVicDetail />
          ) : isVics ? (
            <AdminVics />
          ) : isVerifikationen ? (
            <AdminVerifications />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s) => (
                  <Card key={s.label} className="border-gray-200 shadow-none bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-gray-200 shadow-none bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Systemübersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">Alle Systeme laufen normal.</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
