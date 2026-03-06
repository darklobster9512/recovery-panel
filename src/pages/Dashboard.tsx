import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, FileText, Settings, LogOut, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const stats = [
    { label: "Aktive Cases", value: "3", icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Abgeschlossen", value: "12", icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "In Bearbeitung", value: "2", icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Erfolgsrate", value: "94%", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-[hsl(221,100%,50%)] flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Dashboard</span>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { label: "Übersicht", icon: LayoutDashboard, active: true },
            { label: "Meine Cases", icon: FileText },
            { label: "Einstellungen", icon: Settings },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-[hsl(221,100%,97%)] text-[hsl(221,100%,50%)]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
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
          <h1 className="text-2xl font-bold mb-1">Willkommen zurück</h1>
          <p className="text-gray-500 text-sm mb-8">{user?.email}</p>

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
              <CardTitle className="text-lg">Letzte Aktivität</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">Noch keine Aktivitäten vorhanden.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
