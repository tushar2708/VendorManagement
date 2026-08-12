import { Card, cn } from '../ui.js';

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly className?: string;
}

export function StatCard({ label, value, className }: StatCardProps): React.ReactElement {
  return (
    <Card className={cn('p-4', className)}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
