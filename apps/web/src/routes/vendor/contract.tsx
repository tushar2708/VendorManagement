import { Card, Button } from '../../components/ui.js';
import { Icon } from '../../components/atoms/Icon.js';

export function VendorContractPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contract</h1>
      <p className="mt-1 text-sm text-slate-500">Review and sign your contract once it is ready.</p>

      <Card className="mt-6 grid place-items-center gap-3 p-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Icon name="file-text" size={24} />
        </div>
        <p className="text-base font-semibold text-slate-900">No contract available yet</p>
        <p className="max-w-sm text-sm text-slate-500">
          Your buyer will share the contract for review once your documents have been verified.
        </p>
        <Button disabled className="mt-1">Agree &amp; sign</Button>
      </Card>
    </div>
  );
}
