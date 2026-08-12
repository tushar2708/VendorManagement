import { useEffect, useState, type FormEvent } from 'react';
import {
  updateCandidateSchema,
  PAN_REGEX,
  GSTIN_REGEX,
  type Candidate,
  type UpdateCandidateInput,
  type RequirementDetail,
} from '@vendor-management/shared';
import { updateCandidate } from '../lib/candidates-api.js';
import { errorMessage } from '../lib/auth-api.js';
import { Modal } from './Modal.js';
import { Button, cn } from './ui.js';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

interface EditFormState {
  readonly legalName: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly pan: string;
  readonly gstin: string;
  readonly city: string;
  readonly state: string;
}

export function EditCandidateModal({
  open,
  onClose,
  requirementId,
  candidate,
  onUpdated,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly requirementId: string;
  readonly candidate: Candidate | null;
  readonly onUpdated: (detail: RequirementDetail) => void;
}): React.ReactElement | null {
  const [form, setForm] = useState<EditFormState>({
    legalName: '',
    contactEmail: '',
    contactPhone: '',
    pan: '',
    gstin: '',
    city: '',
    state: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (candidate) {
      setForm({
        legalName: candidate.legalName ?? '',
        contactEmail: candidate.contactEmail ?? '',
        contactPhone: candidate.contactPhone || '',
        pan: candidate.pan || '',
        gstin: candidate.gstin || '',
        city: candidate.city || '',
        state: candidate.state || '',
      });
      setFieldErrors({});
      setFormError(null);
    }
  }, [candidate, open]);

  if (!open || !candidate) return null;

  function set(key: keyof EditFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  }

  const panInvalid = form.pan.trim() !== '' && !PAN_REGEX.test(form.pan.trim().toUpperCase());
  const gstinInvalid = form.gstin.trim() !== '' && !GSTIN_REGEX.test(form.gstin.trim().toUpperCase());

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);

    if (!candidate) return;

    const payload: UpdateCandidateInput = {};

    if (form.legalName !== candidate.legalName) payload.legalName = form.legalName;
    if (form.contactEmail !== candidate.contactEmail) payload.contactEmail = form.contactEmail;
    if (form.contactPhone !== (candidate.contactPhone || '')) payload.contactPhone = form.contactPhone.trim();
    if (form.pan !== (candidate.pan || '')) payload.pan = form.pan.trim();
    if (form.gstin !== (candidate.gstin || '')) payload.gstin = form.gstin.trim();
    if (form.city !== (candidate.city || '')) payload.city = form.city.trim();
    if (form.state !== (candidate.state || '')) payload.state = form.state.trim();

    const parsed = updateCandidateSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const detail = await updateCandidate(requirementId, candidate.id, parsed.data);
      onUpdated(detail);
      onClose();
    } catch (e: unknown) {
      setFormError(errorMessage(e, 'Could not update the candidate.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit candidate" maxWidth="max-w-2xl">
      <form onSubmit={onSubmit}>
        {formError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">
            Vendor name <span className="text-rose-500">*</span>
            <input value={form.legalName} onChange={set('legalName')} className={inputClass} />
            {fieldErrors.legalName && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.legalName[0]}</span>}
          </label>

          <label className="block text-sm font-medium">
            Contact email <span className="text-rose-500">*</span>
            <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className={inputClass} />
            {fieldErrors.contactEmail && (
              <span className="mt-1 block text-xs text-rose-600">{fieldErrors.contactEmail[0]}</span>
            )}
          </label>

          <label className="block text-sm font-medium">
            Phone
            <input value={form.contactPhone} onChange={set('contactPhone')} className={inputClass} />
          </label>

          <label className="block text-sm font-medium">
            PAN
            <input value={form.pan} onChange={set('pan')} placeholder="AAAAA9999A" className={inputClass} />
            {panInvalid && <span className="mt-1 block text-xs text-amber-600">Format looks off (AAAAA9999A)</span>}
          </label>

          <label className="block text-sm font-medium">
            GSTIN
            <input value={form.gstin} onChange={set('gstin')} placeholder="22AAAAA0000A1Z5" className={inputClass} />
            {gstinInvalid && <span className="mt-1 block text-xs text-amber-600">Format looks off</span>}
          </label>

          <label className="block text-sm font-medium">
            City
            <input value={form.city} onChange={set('city')} className={inputClass} />
          </label>

          <label className="block text-sm font-medium">
            State
            <input value={form.state} onChange={set('state')} className={inputClass} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
