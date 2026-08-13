import { useEffect, useState } from "react";
import { listMyLinks, getLink } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { OnboardingForm } from "../../components/organisms/OnboardingForm.js";
import { VendorTracker } from "../../components/organisms/VendorTracker.js";
import { Card, Spinner } from "../../components/ui.js";
import { Progress } from "../../components/atoms/Progress.js";
import { Checkbox } from "../../components/atoms/Checkbox.js";

export function FullPackPage(): React.ReactElement {
  const [link, setLink] = useState<VendorLinkDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [declarationChecked, setDeclarationChecked] = useState(false);

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

  const documentsUploaded = link?.documents?.length ?? 0;
  const totalDocuments = link?.documents?.length ?? 0;
  const uploadProgress = totalDocuments > 0 ? Math.round((documentsUploaded / totalDocuments) * 100) : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Full pack</h1>
      <VendorTracker state={link.state} tat={link.tat} erpVendorCode={link.erpVendorCode} buyerContact={link.buyerContact} />

      {link.state === "FULL_IN_PROGRESS" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Upload progress</span>
                <span className="text-sm text-slate-600">{documentsUploaded} of {totalDocuments}</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </Card>

          <OnboardingForm linkId={link.id} stage="FULL" processCategories={link.processCategories ?? []} fields={link.fields} documents={link.documents} onRefresh={load} />

          <Card className="p-6">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={declarationChecked}
                onChange={() => setDeclarationChecked(!declarationChecked)}
              />
              <span className="text-sm text-slate-700">
                I declare that all information provided is accurate and complete to the best of my knowledge.
              </span>
            </label>
            {!declarationChecked && (
              <p className="mt-2 text-xs text-slate-500">
                Check this box to enable submission.
              </p>
            )}
          </Card>
        </div>
      )}
      {link.state !== "FULL_IN_PROGRESS" && (
        <Card className="mt-6 p-6"><p className="text-sm text-slate-500">Full pack is {link.state === "FULL_SUBMITTED" ? "submitted and under review" : "complete"}.</p></Card>
      )}
    </div>
  );
}

export default FullPackPage;
