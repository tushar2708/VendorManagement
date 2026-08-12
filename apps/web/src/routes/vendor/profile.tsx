import { useEffect, useState } from "react";
import { listMyLinks, getLink } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { Card, Spinner } from "../../components/ui.js";

export function VendorProfilePage(): React.ReactElement {
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
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vendor profile</h1>
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Vendor information</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            ["Requirement", link.requirementTitle],
            ["ERP code", link.erpVendorCode],
            ["State", link.state],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{value || "—"}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default VendorProfilePage;
