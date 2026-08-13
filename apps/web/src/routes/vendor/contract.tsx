import { useEffect, useState } from "react";
import { listMyLinks, getLink } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { ContractSetView } from "../../components/organisms/ContractSetView.js";
import { Card, Spinner } from "../../components/ui.js";

export function VendorContractPage(): React.ReactElement {
  const [link, setLink] = useState<VendorLinkDTO | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const links = await listMyLinks();
    if (links.length > 0) {
      const detail = await getLink(links[0].id);
      setLink(detail);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (!link) return <Card className="mt-8 p-8 text-center"><p className="text-sm text-slate-500">No active engagement found.</p></Card>;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contract</h1>
      {link.contracts && link.contracts.length > 0 && (
        <ContractSetView vendorId={link.id} side="VENDOR" onRefresh={load} />
      )}
      {(!link.contracts || link.contracts.length === 0) && (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-slate-500">No contract available yet.</p>
        </Card>
      )}
    </div>
  );
}
