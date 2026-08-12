import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../atoms/Icon.js';
import { cn } from '../ui.js';

type IconName = Parameters<typeof Icon>[0]['name'];

interface NavItemProps {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
}

export function NavItem({ path, label, icon }: NavItemProps): React.ReactElement {
  const location = useLocation();
  const active = location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Link
      to={path}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white',
      )}
    >
      <Icon name={icon} size={18} className={active ? 'text-white' : 'text-slate-400'} />
      {label}
    </Link>
  );
}
