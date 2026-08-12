import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAN_REGEX, GSTIN_REGEX } from '@vendor-management/shared';
import { submitPrequal } from '../../lib/vendor-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Button } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export function PrequalPage(): React.ReactElement {
  const navigate = useNavigate();
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [udyam, setUdyam] = useState('');
  const [errors, setErrors] = useState<{ pan?: string; gstin?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const nextErrors: { pan?: string; gstin?: string } = {};
    const panUpper = pan.trim().toUpperCase();
    const gstinUpper = gstin.trim().toUpperCase();
    if (!PAN_REGEX.test(panUpper)) nextErrors.pan = 'PAN must look like AAAAA9999A';
    if (!GSTIN_REGEX.test(gstinUpper)) nextErrors.gstin = 'Invalid GSTIN format';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await submitPrequal({ panNumber: panUpper, gstin: gstinUpper, udyamNumber: udyam.trim() || undefined });
      setSubmitted(true);
    } catch (error: unknown) {
      setFormError(errorMessage(error, 'Could not submit your details. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pre-qualification</h1>
      <p className="mt-1 text-sm text-slate-500">We verify your identity and tax registration before you can access requests.</p>

      <Card className="mt-6 p-6">
        {submitted ? (
          <div className="text-center">
            <div className="flex justify-center gap-2">
              <Badge variant="success">PAN verified</Badge>
              <Badge variant="success">GSTIN verified</Badge>
            </div>
            <p className="mt-4 text-sm text-slate-500">Your details have been submitted and verified.</p>
            <Button className="mt-4" onClick={() => navigate('/vendor/full-pack')}>Continue to documents</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {formError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

            <label className="block text-sm font-medium">
              PAN <span className="text-rose-500">*</span>
              <input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="AAAAA9999A" className={inputClass} />
              {errors.pan && <span className="mt-1 block text-xs text-rose-600">{errors.pan}</span>}
            </label>

            <label className="mt-4 block text-sm font-medium">
              GSTIN <span className="text-rose-500">*</span>
              <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" className={inputClass} />
              {errors.gstin && <span className="mt-1 block text-xs text-rose-600">{errors.gstin}</span>}
            </label>

            <label className="mt-4 block text-sm font-medium">
              UDYAM (optional)
              <input value={udyam} onChange={(e) => setUdyam(e.target.value)} placeholder="UDYAM-XX-00-0000000" className={inputClass} />
            </label>

            <Button type="submit" disabled={submitting} className="mt-6 w-full">
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
