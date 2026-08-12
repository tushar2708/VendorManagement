import { useState } from 'react';
import { Toggle } from '../atoms/Toggle.js';
import { Button } from '../ui.js';

interface SlaRuleRowProps {
  readonly stage: string;
  readonly label: string;
  readonly slaDays: number;
  readonly escalateAfterBreach: boolean;
  readonly onSave: (slaDays: number, escalateAfterBreach: boolean) => Promise<void>;
  readonly readonly?: boolean;
}

export function SlaRuleRow({ stage, label, slaDays: initialDays, escalateAfterBreach: initialEscalate, onSave, readonly = false }: SlaRuleRowProps): React.ReactElement {
  const [days, setDays] = useState(initialDays);
  const [escalate, setEscalate] = useState(initialEscalate);
  const [saving, setSaving] = useState(false);
  const dirty = days !== initialDays || escalate !== initialEscalate;

  async function handleSave(): Promise<void> {
    setSaving(true);
    try { await onSave(days, escalate); } finally { setSaving(false); }
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">{label}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))}
            disabled={readonly}
            className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-center outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500" />
          <span className="text-sm text-slate-500">days</span>
        </div>
      </td>
      <td className="px-4 py-3">{!readonly && <Toggle checked={escalate} onChange={setEscalate} />}</td>
      <td className="px-4 py-3 text-right">
        {!readonly && (
          <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </td>
    </tr>
  );
}
