import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.js";
import { logout } from "@/lib/auth-client.js";

const navItems = [
  { path: "/vendor/dashboard", label: "Dashboard" },
  { path: "/vendor/prequal", label: "Verification" },
  { path: "/vendor/full-pack", label: "Documents" },
  { path: "/vendor/contract", label: "Contract" },
  { path: "/vendor/profile", label: "Profile" },
];

export function VendorLayout() {
  const { user, refresh } = useAuth();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold text-slate-900">VendorMgmt</h2>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    location.pathname.startsWith(item.path)
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
