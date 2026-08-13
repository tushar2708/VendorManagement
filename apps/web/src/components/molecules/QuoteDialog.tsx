import { useState } from 'react';
import { Modal } from '../Modal.js';
import { Button } from '../ui.js';

interface QuoteDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly vendorName: string;
  readonly onSave: (data: {
    readonly unitPrice: number;
    readonly toolingPerUnit: number;
    readonly freightPerUnit: number;
    readonly leadTimeDays: number;
    readonly location?: string;
    readonly capacityNote?: string;
  }) => void;
}

export function QuoteDialog({
  open,
  onClose,
  vendorName,
  onSave,
}: QuoteDialogProps): React.ReactElement | null {
  const [unitPrice, setUnitPrice] = useState('');
  const [toolingPerUnit, setToolingPerUnit] = useState('0');
  const [freightPerUnit, setFreightPerUnit] = useState('0');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [location, setLocation] = useState('');
  const [capacityNote, setCapacityNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!unitPrice || Number(unitPrice) <= 0) {
      newErrors.unitPrice = 'Unit price is required and must be greater than 0';
    }
    if (!leadTimeDays || Number(leadTimeDays) <= 0) {
      newErrors.leadTimeDays = 'Lead time is required and must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(): void {
    if (!validate()) return;

    onSave({
      unitPrice: Number(unitPrice),
      toolingPerUnit: Number(toolingPerUnit) || 0,
      freightPerUnit: Number(freightPerUnit) || 0,
      leadTimeDays: Number(leadTimeDays),
      location: location.trim() || undefined,
      capacityNote: capacityNote.trim() || undefined,
    });

    // Reset form
    setUnitPrice('');
    setToolingPerUnit('0');
    setFreightPerUnit('0');
    setLeadTimeDays('');
    setLocation('');
    setCapacityNote('');
    setErrors({});
    onClose();
  }

  function handleClose(): void {
    setErrors({});
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Quote from ${vendorName}`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-900">
            Unit Price
          </label>
          <input
            id="unitPrice"
            type="number"
            step={0.01}
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
              errors.unitPrice ? 'border-rose-300' : 'border-slate-300'
            }`}
          />
          {errors.unitPrice && (
            <p className="mt-1 text-xs text-rose-600">{errors.unitPrice}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tooling" className="block text-sm font-medium text-slate-900">
              Tooling per Unit
            </label>
            <input
              id="tooling"
              type="number"
              step={0.01}
              min={0}
              value={toolingPerUnit}
              onChange={(e) => setToolingPerUnit(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            />
          </div>

          <div>
            <label htmlFor="freight" className="block text-sm font-medium text-slate-900">
              Freight per Unit
            </label>
            <input
              id="freight"
              type="number"
              step={0.01}
              min={0}
              value={freightPerUnit}
              onChange={(e) => setFreightPerUnit(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            />
          </div>
        </div>

        <div>
          <label htmlFor="leadTime" className="block text-sm font-medium text-slate-900">
            Lead Time (days)
          </label>
          <input
            id="leadTime"
            type="number"
            min={1}
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
            placeholder="30"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
              errors.leadTimeDays ? 'border-rose-300' : 'border-slate-300'
            }`}
          />
          {errors.leadTimeDays && (
            <p className="mt-1 text-xs text-rose-600">{errors.leadTimeDays}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-900">
            Location (optional)
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Dallas, TX"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          />
        </div>

        <div>
          <label htmlFor="capacityNote" className="block text-sm font-medium text-slate-900">
            Capacity Note (optional)
          </label>
          <textarea
            id="capacityNote"
            value={capacityNote}
            onChange={(e) => setCapacityNote(e.target.value)}
            placeholder="e.g., Current availability and any constraints"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Quote
          </Button>
        </div>
      </div>
    </Modal>
  );
}
