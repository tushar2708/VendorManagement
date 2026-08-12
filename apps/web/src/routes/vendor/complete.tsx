import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyLinks, getLink } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { Card, Button, Spinner } from "../../components/ui.js";
import { Icon } from "../../components/atoms/Icon.js";

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

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mt-12 grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
          <Icon name="check-circle" size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">You are onboarded!</h1>
        <p className="mt-2 text-sm text-slate-500">Your vendor profile is active and ready to receive purchase orders.</p>
      </div>
      <Card className="mt-8 p-6 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Vendor code</span>
          <span className="font-medium text-slate-900">{link.erpVendorCode || "—"}</span>
        </div>
      </Card>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate("/vendor/profile")}>View my profile</Button>
        <Button disabled>Download signed contract</Button>
      </div>
    </div>
  );
}

export default VendorCompletePage;
