import { Badge } from './Badge.js';
import { Icon } from './Icon.js';

interface StatusBadgeProps {
  readonly status: string;
  readonly className?: string;
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const lowerStatus = status.toLowerCase();

  // Success states
  if (lowerStatus.includes('onboarded') || lowerStatus.includes('completed')) {
    return 'success';
  }

  // Danger states
  if (lowerStatus.includes('rejected') || lowerStatus.includes('failed')) {
    return 'danger';
  }

  // Warning states (vendor-turn)
  if (lowerStatus.includes('vendor')) {
    return 'warning';
  }

  // Info states (buyer-turn)
  if (lowerStatus.includes('buyer') || lowerStatus.includes('platform')) {
    return 'info';
  }

  // Neutral (pending/default)
  return 'neutral';
}

function getStatusIcon(status: string): string | null {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('completed')) {
    return 'check-circle';
  }

  if (lowerStatus.includes('rejected') || lowerStatus.includes('failed')) {
    return 'x-circle';
  }

  if (lowerStatus.includes('pending') || lowerStatus.includes('review')) {
    return 'clock';
  }

  return null;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  const variant = getStatusVariant(status);
  const icon = getStatusIcon(status);

  return (
    <Badge variant={variant} className={className}>
      {icon && <Icon name={icon as any} size={14} aria-hidden />}
      <span>{status}</span>
    </Badge>
  );
}
