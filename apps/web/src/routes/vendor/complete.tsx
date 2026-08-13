import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyLinks, getLink } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { Card, Button, Spinner } from "../../components/ui.js";
import { Icon } from "../../components/atoms/Icon.js";

interface OnboardingManifest {
  vendorCode: string;
  completedAt: string;
  turnaroundDays: number;
  contractCount: number;
  contracts?: Array<{ id: string; name: string }>;
}

export function VendorCompletePage(): React.ReactElement {
  const [link, setLink] = useState<VendorLinkDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listMyLinks()
      .then(async (links) => {
        if (links.length > 0) {
          const detail = await getLink(links[0].id);
          if (detail.state === "ONBOARDED") {
            setLink(detail);
          } else {
            navigate("/vendor/dashboard");
          }
        } else {
          navigate("/vendor/dashboard");
        }
      })
      .catch(() => navigate("/vendor/dashboard"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (!link) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;

  function downloadPackManifest(): void {
    if (!link) return;
    const manifest: OnboardingManifest = {
      vendorCode: link.erpVendorCode || "",
      completedAt: new Date().toISOString(),
      turnaroundDays: calculateTurnaroundDays(link),
      contractCount: link.contracts?.length ?? 0,
      contracts: link.contracts?.map((c) => ({ id: c.id, name: c.contractType })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-manifest-${link.erpVendorCode}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function calculateTurnaroundDays(linkData: VendorLinkDTO): number {
    if (!linkData.createdAt) return 0;
    const created = new Date(linkData.createdAt);
    const now = new Date();
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  const turnaroundDays = calculateTurnaroundDays(link);
  const contractCount = link.contracts?.length ?? 0;

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mt-12 grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
          <Icon name="check-circle" size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">You are onboarded!</h1>
        <p className="mt-2 text-sm text-slate-500">Your vendor profile is active and ready to receive purchase orders.</p>
      </div>
      <Card className="mt-8 space-y-4 p-6 text-left">
        <div className="flex justify-between border-b border-slate-200 pb-4">
          <span className="text-slate-500">Vendor code</span>
          <span className="font-medium text-slate-900">{link.erpVendorCode || "—"}</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-4">
          <span className="text-slate-500">Turnaround time</span>
          <span className="font-medium text-slate-900">
            {turnaroundDays} day{turnaroundDays !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Active contracts</span>
          <span className="font-medium text-slate-900">
            {contractCount} contract{contractCount !== 1 ? "s" : ""}
          </span>
        </div>
      </Card>
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="secondary" onClick={() => navigate("/vendor/profile")}>
          View my profile
        </Button>
        <Button onClick={downloadPackManifest}>Download pack manifest</Button>
      </div>
    </div>
  );
}

export default VendorCompletePage;
