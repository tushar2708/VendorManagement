import { Badge } from './Badge.js';
import { Icon } from './Icon.js';

type Court = 'BUYER' | 'VENDOR' | 'PLATFORM' | 'DONE';

interface CourtBadgeProps {
  readonly court: Court;
  readonly className?: string;
}

const courtConfig: Record<Court, { icon: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string; description: string }> = {
  BUYER: {
    icon: 'building',
    variant: 'info',
    label: 'Buyer',
    description: 'Waiting for buyer action',
  },
  VENDOR: {
    icon: 'cog',
    variant: 'warning',
    label: 'Vendor',
    description: 'Waiting for vendor action',
  },
  PLATFORM: {
    icon: 'shield',
    variant: 'neutral',
    label: 'Platform',
    description: 'Platform review in progress',
  },
  DONE: {
    icon: 'check-circle',
    variant: 'success',
    label: 'Complete',
    description: 'Step completed',
  },
};

export function CourtBadge({ court, className }: CourtBadgeProps): React.ReactElement {
  const config = courtConfig[court];

  return (
    <Badge variant={config.variant} className={className}>
      <Icon name={config.icon as any} size={14} aria-hidden />
      <span className="sr-only">{config.description}: </span>
      {config.label}
    </Badge>
  );
}
