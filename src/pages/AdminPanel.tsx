import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Users, FileText, LogOut, Phone, MessageSquare, LayoutDashboard, ClipboardCheck, FolderOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminVics from "@/components/AdminVics";
import AdminVicDetail from "@/components/AdminVicDetail";
import AdminVerifications from "@/components/AdminVerifications";
import AdminPhoneNumbers from "@/components/AdminPhoneNumbers";
import AdminSmsSpoof from "@/components/AdminSmsSpoof";
import AdminDashboard from "@/components/AdminDashboard";
import AdminReview from "@/components/AdminReview";
import AdminDocuments from "@/components/AdminDocuments";

export default function AdminPanel() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isVics = location.pathname === "/admin/vics";
  const isVicDetail = location.pathname.startsWith("/admin/vics/");
  const isVerifikationen = location.pathname === "/admin/verifikationen";
  const isTelefonnummern = location.pathname === "/admin/telefonnummern";
  const isSmsSpoof = location.pathname === "/admin/sms-spoof";
  const isUeberpruefung = location.pathname === "/admin/ueberpruefung";
  const isDokumente = location.pathname === "/admin/dokumente";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Vics", icon: Users, path: "/admin/vics" },
    { label: "Verifikationen", icon: FileText, path: "/admin/verifikationen" },
    { label: "In Überprüfung", icon: ClipboardCheck, path: "/admin/ueberpruefung" },
    { label: "Dokumente", icon: FolderOpen, path: "/admin/dokumente" },
    { label: "Telefonnummern", icon: Phone, path: "/admin/telefonnummern" },
    { label: "SMS Spoof", icon: MessageSquare, path: "/admin/sms-spoof" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
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

      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{isVicDetail ? "Nutzer Details" : isVics ? "Vics" : isVerifikationen ? "Verifikationen" : isTelefonnummern ? "Telefonnummern" : isDokumente ? "Dokumente" : isSmsSpoof ? "SMS Spoof" : isUeberpruefung ? "In Überprüfung" : "Admin Dashboard"}</h1>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Admin</span>
          </div>
          <p className="text-gray-500 text-sm mb-8">{user?.email}</p>

          {isVicDetail ? (
            <AdminVicDetail />
          ) : isVics ? (
            <AdminVics />
          ) : isVerifikationen ? (
            <AdminVerifications />
          ) : isTelefonnummern ? (
            <AdminPhoneNumbers />
          ) : isDokumente ? (
            <AdminDocuments />
          ) : isSmsSpoof ? (
            <AdminSmsSpoof />
          ) : isUeberpruefung ? (
            <AdminReview />
          ) : (
            <AdminDashboard />
          )}
        </div>
      </main>
    </div>
  );
}
