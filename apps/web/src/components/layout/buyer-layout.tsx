import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.js";
import { logout } from "@/lib/auth-client.js";

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/requests/new", label: "New Request" },
  { path: "/directory", label: "Vendor Directory" },
  { path: "/approvals", label: "Approvals" },
  { path: "/sla-settings", label: "SLA Settings" },
];

export function BuyerLayout() {
  const { user, refresh } = useAuth();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    await refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-slate-200 bg-white p-4 flex flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">VendorMgmt</h2>
          <p className="text-xs text-slate-500">{user?.name}</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-md px-3 py-2 text-sm ${
                location.pathname.startsWith(item.path)
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 text-left"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
