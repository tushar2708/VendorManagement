import { Link } from 'react-router-dom';
import { Badge } from '../atoms/Badge.js';
import { Icon } from '../atoms/Icon.js';
import { Card } from '../ui.js';

interface VendorRowProps {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly vendorCode?: string | null;
  readonly isVerified: boolean;
}

export function VendorRow({ id, name, subtitle, vendorCode, isVerified }: VendorRowProps): React.ReactElement {
  return (
    <Link to={`/directory/${id}`}>
      <Card className="flex items-center justify-between p-4 transition-all hover:border-indigo-200 hover:shadow-md">
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {vendorCode && <span className="text-sm text-slate-400">{vendorCode}</span>}
          <Badge variant={isVerified ? 'success' : 'neutral'}>
            {isVerified ? '✓ Verified' : 'Not verified'}
          </Badge>
          <Icon name="chevron-right" size={16} className="text-slate-400" />
        </div>
      </Card>
    </Link>
  );
}
