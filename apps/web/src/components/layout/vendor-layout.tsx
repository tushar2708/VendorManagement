import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth.js';
import { logout } from '@/lib/auth-client.js';
import { NavItem } from '../molecules/NavItem.js';
import { Avatar } from '../atoms/Avatar.js';
import { Badge } from '../atoms/Badge.js';
import { VendraxMark } from '../Brand.js';
import { NotificationBell } from '../molecules/NotificationBell.js';

const navItems = [
  { path: '/vendor/dashboard', label: 'Dashboard', icon: 'grid' as const },
  { path: '/vendor/prequal', label: 'Pre-qualification', icon: 'shield' as const },
  { path: '/vendor/full-pack', label: 'Documents', icon: 'file-text' as const },
  { path: '/vendor/contract', label: 'Contract', icon: 'clipboard-check' as const },
  { path: '/vendor/profile', label: 'Profile', icon: 'users' as const },
  { path: '/vendor/status', label: 'Status', icon: 'clock' as const },
  { path: '/vendor/mobile', label: 'Mobile Verification', icon: 'mail' as const },
];

export function VendorLayout(): React.ReactElement {
  const { user, refresh } = useAuth();

  async function handleLogout(): Promise<void> {
    await logout();
    await refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-forest-700">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <VendraxMark size={28} />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Vendrax</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-sage-300">Vendor View</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => <NavItem key={item.path} path={item.path} label={item.label} icon={item.icon} />)}
        </nav>
        <div className="border-t border-forest-600 px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={user?.name ?? '?'} size="sm" />
            <span className="truncate text-xs text-sage-200">{user?.name}</span>
          </div>
          <button type="button" onClick={handleLogout} className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-xs text-sage-300 hover:bg-forest-600 hover:text-cream-50 transition-colors">
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-forest-100 bg-cream-50 px-6 py-3">
          <Badge variant="success">VENDOR VIEW</Badge>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm text-forest-500 sm:inline">{user?.name}</span>
            <Avatar name={user?.name ?? '?'} size="md" />
          </div>
        </header>
        <main className="flex-1 bg-cream-50 p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
