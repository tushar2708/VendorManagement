import { cn } from '../ui.js';

interface AvatarProps {
  readonly name: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

const SIZE_CLASSES = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' };

export function Avatar({ name, size = 'md', className }: AvatarProps): React.ReactElement {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-sky-600', 'bg-violet-600'];
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={cn('inline-flex items-center justify-center rounded-full font-semibold text-white', colors[colorIndex], SIZE_CLASSES[size], className)}>
      {initials}
    </div>
  );
}
