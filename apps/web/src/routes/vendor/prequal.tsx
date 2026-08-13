import { useEffect, useState, useRef } from "react";
import { listMyLinks, getLink, saveFields } from "../../lib/links-api.js";
import type { VendorLinkDTO } from "@vendor-management/shared";
import { OnboardingForm } from "../../components/organisms/OnboardingForm.js";
import { VendorTracker } from "../../components/organisms/VendorTracker.js";
import { Card, Spinner } from "../../components/ui.js";
import { ChipGroup } from "../../components/molecules/ChipGroup.js";
import { PROCESS_OPTIONS, CERTIFICATION_OPTIONS } from "../../lib/prequal-client.js";

export function PrequalPage(): React.ReactElement {
  const [link, setLink] = useState<VendorLinkDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [processes, setProcesses] = useState<string[]>([]);
  const [annualCapacityTons, setAnnualCapacityTons] = useState("");
  const [shifts, setShifts] = useState<"1" | "2" | "3">("1");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [customerReferences, setCustomerReferences] = useState<Array<{ name: string; contactEmail: string }>>([]);
  const hasCapabilityChanged = useRef(false);

  async function load() {
    const links = await listMyLinks();
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("linkId");
    const target = targetId
      ? links.find((l) => l.id === targetId)
      : links.find((l) => l.state === "PREQUAL_IN_PROGRESS" || l.state === "INVITED") ?? links[0];
    if (target) {
      const detail = await getLink(target.id);
      setLink(detail);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!link) return;
    try {
      if (link.fields.processes) setProcesses(JSON.parse(link.fields.processes));
      if (link.fields.certifications) setCertifications(JSON.parse(link.fields.certifications));
      if (link.fields.annualCapacityTons) setAnnualCapacityTons(link.fields.annualCapacityTons);
      if (link.fields.shifts) setShifts(link.fields.shifts as "1" | "2" | "3");
      if (link.fields.customerReferences) setCustomerReferences(JSON.parse(link.fields.customerReferences));
    } catch (e) {
      // Ignore parse errors from old data
    }
  }, [link?.id]);

  useEffect(() => {
    if (!hasCapabilityChanged.current || !link) return;
    const timer = setTimeout(async () => {
      try {
        await saveFields(link.id, {
          processes: JSON.stringify(processes),
          certifications: JSON.stringify(certifications),
          annualCapacityTons: annualCapacityTons || "",
          shifts: shifts || "",
          customerReferences: JSON.stringify(customerReferences),
        });
        hasCapabilityChanged.current = false;
      } catch (e) {
        console.error("Failed to save capability fields:", e);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [processes, certifications, annualCapacityTons, shifts, customerReferences, link]);

  if (loading) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (!link) return <Card className="mt-8 p-8 text-center"><p className="text-sm text-slate-500">No active engagement found.</p></Card>;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pre-qualification</h1>
      <VendorTracker state={link.state} tat={link.tat} erpVendorCode={link.erpVendorCode} buyerContact={link.buyerContact} />
      {(link.state === "PREQUAL_IN_PROGRESS" || link.state === "INVITED") && (
        <div className="space-y-6">
          <OnboardingForm linkId={link.id} stage="PREQUAL" processCategories={link.processCategories ?? []} fields={link.fields} documents={link.documents} onRefresh={load} />

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Capability</h2>

            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Processes
                </label>
                <ChipGroup
                  options={Array.from(PROCESS_OPTIONS)}
                  selected={processes}
                  onChange={(value) => {
                    hasCapabilityChanged.current = true;
                    setProcesses(value);
                  }}
                  tone="brand"
                  allowCustom
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Annual capacity (tons)
                </label>
                <input
                  type="number"
                  value={annualCapacityTons}
                  onChange={(e) => {
                    hasCapabilityChanged.current = true;
                    setAnnualCapacityTons(e.target.value);
                  }}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Number of shifts
                </label>
                <div className="flex gap-2">
                  {(["1", "2", "3"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        hasCapabilityChanged.current = true;
                        setShifts(s);
                      }}
                      type="button"
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        shifts === s
                          ? "border-indigo-500/60 bg-indigo-50 text-indigo-700"
                          : "border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {s === "1" ? "Single" : s === "2" ? "Double" : "Triple"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Certifications
                </label>
                <ChipGroup
                  options={Array.from(CERTIFICATION_OPTIONS)}
                  selected={certifications}
                  onChange={(value) => {
                    hasCapabilityChanged.current = true;
                    setCertifications(value);
                  }}
                  tone="brand"
                  allowCustom
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Customer references (up to 5)
                </label>
                <div className="space-y-3">
                  {customerReferences.map((ref, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => {
                          hasCapabilityChanged.current = true;
                          const updated = [...customerReferences];
                          updated[idx].name = e.target.value;
                          setCustomerReferences(updated);
                        }}
                        placeholder="Company name"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="email"
                        value={ref.contactEmail}
                        onChange={(e) => {
                          hasCapabilityChanged.current = true;
                          const updated = [...customerReferences];
                          updated[idx].contactEmail = e.target.value;
                          setCustomerReferences(updated);
                        }}
                        placeholder="Contact email"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => {
                          hasCapabilityChanged.current = true;
                          setCustomerReferences(customerReferences.filter((_, i) => i !== idx));
                        }}
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {customerReferences.length < 5 && (
                    <button
                      onClick={() => {
                        hasCapabilityChanged.current = true;
                        setCustomerReferences([...customerReferences, { name: "", contactEmail: "" }]);
                      }}
                      type="button"
                      className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                    >
                      + Add reference
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      {link.state !== "PREQUAL_IN_PROGRESS" && link.state !== "INVITED" && (
        <Card className="mt-6 p-6"><p className="text-sm text-slate-500">Pre-qualification is {link.state === "PREQUAL_SUBMITTED" ? "submitted and under review" : "complete"}.</p></Card>
      )}
    </div>
  );
}

export default PrequalPage;
