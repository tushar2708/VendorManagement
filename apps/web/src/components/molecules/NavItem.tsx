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
          ? 'bg-forest-600/50 text-cream-50'
          : 'text-sage-300 hover:bg-forest-600 hover:text-cream-50',
      )}
    >
      <Icon name={icon} size={18} className={active ? 'text-cream-50' : 'text-sage-400'} />
      {label}
    </Link>
  );
}
