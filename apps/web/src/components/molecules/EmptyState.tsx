import { Icon } from '../atoms/Icon.js';
import { Card } from '../ui.js';

interface EmptyStateProps {
  readonly icon: Parameters<typeof Icon>[0]['name'];
  readonly title: string;
  readonly description: string;
  readonly children?: React.ReactNode;
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps): React.ReactElement {
  return (
    <Card className="grid place-items-center gap-3 p-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-500">
        <Icon name={icon} size={24} />
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      {children}
    </Card>
  );
}
