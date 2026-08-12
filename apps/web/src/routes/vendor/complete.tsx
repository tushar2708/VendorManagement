import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/ui.js';
import { Icon } from '../../components/atoms/Icon.js';

export function VendorCompletePage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mt-12 grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
          <Icon name="check-circle" size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">You're onboarded!</h1>
        <p className="mt-2 text-sm text-slate-500">Your vendor profile is active and ready to receive purchase orders.</p>
      </div>
      <Card className="mt-8 p-6 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Vendor code</span>
          <span className="font-medium text-slate-900">—</span>
        </div>
      </Card>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/vendor/profile"><Button variant="secondary">View my profile</Button></Link>
        <Button disabled>Download signed contract</Button>
      </div>
    </div>
  );
}
