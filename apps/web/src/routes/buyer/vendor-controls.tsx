import { useParams, Link } from 'react-router-dom';
import { Button } from '../../components/ui.js';
import { GovernancePanel } from '../../components/organisms/GovernancePanel.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';

export function VendorControlsPage(): React.ReactElement {
  const { id = '', vendorId = '' } = useParams();
  const headingRef = useTextReveal<HTMLHeadingElement>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">
            Vendor controls
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor governance controls and compliance status.
          </p>
        </div>
        <Link to={`/requests/${id}`}>
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      <div className="mt-6">
        <GovernancePanel vendorId={vendorId} linkId={id} />
      </div>
    </div>
  );
}
