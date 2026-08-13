import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth.js';
import { logout } from '@/lib/auth-client.js';
import { NavItem } from '../molecules/NavItem.js';
import { Avatar } from '../atoms/Avatar.js';
import { Badge } from '../atoms/Badge.js';
import logoSvg from '@/assets/logo.svg';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid' as const },
  { path: '/requests/new', label: 'New Request', icon: 'plus-circle' as const },
  { path: '/directory', label: 'Vendor Directory', icon: 'building' as const },
  { path: '/approvals', label: 'Approvals', icon: 'clipboard-check' as const },
  { path: '/sla-settings', label: 'SLA Settings', icon: 'cog' as const },
  { path: '/activity', label: 'Activity', icon: 'clock' as const },
  { path: '/team', label: 'Team', icon: 'users' as const },
];

export function BuyerLayout() {
  const { user, refresh } = useAuth();

  async function handleLogout() {
    await logout();
    await refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-slate-800">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <img src={logoSvg} alt="VM" className="h-8 w-8 rounded-lg" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Vendor Management</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">Buyer View</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => (
            <NavItem key={item.path} path={item.path} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="border-t border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={user?.name ?? '?'} size="sm" />
            <span className="truncate text-xs text-slate-300">{user?.name}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <Badge variant="info">BUYER VIEW</Badge>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
            <Avatar name={user?.name ?? '?'} size="md" />
          </div>
        </header>
        <main className="flex-1 bg-slate-50 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
