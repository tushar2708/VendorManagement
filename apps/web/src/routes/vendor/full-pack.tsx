import { useEffect, useState } from "react";
import { listMyLinks, getLink } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { OnboardingForm } from "../../components/organisms/OnboardingForm.js";
import { VendorTracker } from "../../components/organisms/VendorTracker.js";
import { Card, Spinner } from "../../components/ui.js";

export function FullPackPage(): React.ReactElement {
  const [link, setLink] = useState<VendorLinkDTO | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const links = await listMyLinks();
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("linkId");
    const target = targetId
      ? links.find((l) => l.id === targetId)
      : links.find((l) => l.state === "FULL_IN_PROGRESS" || l.state === "AWARDED") ?? links[0];
    if (target) {
      const detail = await getLink(target.id);
      setLink(detail);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (!link) return <Card className="mt-8 p-8 text-center"><p className="text-sm text-slate-500">No active engagement found.</p></Card>;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Full pack</h1>
      <VendorTracker state={link.state} tat={link.tat} erpVendorCode={link.erpVendorCode} buyerContact={link.buyerContact} />
      {link.state === "FULL_IN_PROGRESS" && (
        <OnboardingForm linkId={link.id} stage="FULL" processCategories={link.processCategories ?? []} fields={link.fields} documents={link.documents} onRefresh={load} />
      )}
      {link.state !== "FULL_IN_PROGRESS" && (
        <Card className="mt-6 p-6"><p className="text-sm text-slate-500">Full pack is {link.state === "FULL_SUBMITTED" ? "submitted and under review" : "complete"}.</p></Card>
      )}
    </div>
  );
}

export default FullPackPage;
