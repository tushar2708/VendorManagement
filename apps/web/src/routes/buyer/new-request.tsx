import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRequirementSchema, type CreateRequirementInput } from '@vendor-management/shared';
import { createRequirement } from '../../lib/requirements-api.js';
import { getDirectoryFilters } from '../../lib/candidates-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Button, Card, cn } from '../../components/ui.js';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export function NewRequestPage(): React.ReactElement {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [partCategory, setPartCategory] = useState('');
  const [processCategories, setProcessCategories] = useState<string[]>([]);
  const [processOptions, setProcessOptions] = useState<string[]>([]);
  const [process, setProcess] = useState<'RFQ' | 'NOMINATION' | 'DIRECT'>('RFQ');
  const [vendorType, setVendorType] = useState<'PRODUCTION_PART' | 'INDIRECT_SERVICES'>('PRODUCTION_PART');
  const [plantLocation, setPlantLocation] = useState('');
  const [targetAwardDate, setTargetAwardDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDirectoryFilters().then((f) => setProcessOptions(f.processes));
  }, []);

  function toggleProcess(p: string): void {
    setProcessCategories((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const payload: CreateRequirementInput = { title, process, vendorType, processCategories };
    if (partCategory.trim()) payload.partCategory = partCategory.trim();
    if (plantLocation.trim()) payload.plantLocation = plantLocation.trim();
    if (targetAwardDate) payload.targetAwardDate = targetAwardDate;

    const parsed = createRequirementSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const created = await createRequirement(parsed.data);
      navigate(`/requests/${created.id}`);
    } catch (error: unknown) {
      setFormError(errorMessage(error, 'Could not create the requirement. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to requirements
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">New requirement</h1>
      <p className="mt-1 text-sm text-slate-500">Define the part and process, then shortlist vendors.</p>

      <Card className="mt-6 p-6">
        <form onSubmit={onSubmit}>
          {formError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

          <label className="block text-sm font-medium">
            Title <span className="text-rose-500">*</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Forged steering knuckles"
              className={inputClass}
            />
            {fieldErrors.title && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.title[0]}</span>}
          </label>

          <label className="mt-4 block text-sm font-medium">
            Part category
            <input
              value={partCategory}
              onChange={(e) => setPartCategory(e.target.value)}
              placeholder="e.g. Casting"
              className={inputClass}
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            Process
            <select value={process} onChange={(e) => setProcess(e.target.value as 'RFQ' | 'NOMINATION' | 'DIRECT')} className={inputClass}>
              <option value="RFQ">RFQ</option>
              <option value="NOMINATION">Nomination</option>
              <option value="DIRECT">Direct</option>
            </select>
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Vendor type</legend>
            <div className="mt-2 flex gap-4">
              {(['PRODUCTION_PART', 'INDIRECT_SERVICES'] as const).map((vt) => (
                <label key={vt} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="vendorType" value={vt} checked={vendorType === vt} onChange={() => setVendorType(vt)} />
                  {vt === 'PRODUCTION_PART' ? 'Production part' : 'Indirect / services'}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Process categories</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {processOptions.map((p) => {
                const active = processCategories.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProcess(p)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Plant location
              <input
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                placeholder="e.g. Manesar Plant 1"
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Target award date
              <input
                type="date"
                value={targetAwardDate}
                onChange={(e) => setTargetAwardDate(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link to="/dashboard">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create requirement'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
