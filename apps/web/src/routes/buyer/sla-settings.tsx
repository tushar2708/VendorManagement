import { useEffect, useState } from 'react';
import { getSlaRules, updateSlaRule } from '../../lib/requirements-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { SlaRuleRow } from '../../components/molecules/SlaRuleRow.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';

interface SlaRule { id: string; stage: string; slaDays: number; escalateAfterBreach: boolean; }

const STAGE_LABELS: Record<string, string> = {
  FINANCIAL_CRIME: 'Financial Crime',
  COMPLIANCE: 'Compliance',
  LEGAL: 'Legal',
  IT_INFOSEC: 'IT / InfoSec',
  TAX: 'Tax',
  PROCUREMENT: 'Procurement',
  DATA_PRIVACY: 'Data Privacy',
  BUSINESS_OWNER: 'Business Owner',
};

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly rules: SlaRule[] };

export function SlaSettingsPage(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const headingRef = useTextReveal<HTMLHeadingElement>();

  function load(): void {
    setState({ kind: 'loading' });
    getSlaRules()
      .then((rules) => setState({ kind: 'ready', rules }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load SLA settings.') }));
  }

  useEffect(load, []);

  async function handleSave(id: string, slaDays: number, escalateAfterBreach: boolean): Promise<void> {
    await updateSlaRule(id, { slaDays, escalateAfterBreach });
    load();
  }

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">SLA Settings</h1>
      <p className="mt-1 text-sm text-slate-500">How long each control function has before it is chased.</p>

      {state.kind === 'loading' && <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>}
      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
        </Card>
      )}
      {state.kind === 'ready' && (
        <Card className="mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold">Targets per control function</h2>
            <p className="mt-1 text-sm text-slate-500">A control turns at risk once it has used 80% of its target, and overdue past it. A control with no target is never chased.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Control function</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Escalate after breach</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {state.rules.map((rule) => (
                <SlaRuleRow
                  key={rule.id}
                  stage={rule.stage}
                  label={STAGE_LABELS[rule.stage] ?? rule.stage}
                  slaDays={rule.slaDays}
                  escalateAfterBreach={rule.escalateAfterBreach}
                  onSave={(days, esc) => handleSave(rule.id, days, esc)}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
