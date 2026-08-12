import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { http } from '../lib/http.js';
import { errorMessage } from '../lib/auth-api.js';
import { useAuth } from '../hooks/use-auth.js';
import { Card, Spinner, Button } from '../components/ui.js';

interface InviteInfo {
  vendor: { id: string; name: string; contactEmail: string };
  requirementId: string;
  alreadyRegistered: boolean;
}

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly info: InviteInfo };

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export function InviteLandingPage(): React.ReactElement {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setState({ kind: 'loading' });
    http
      .get(`/api/invite/${token}`)
      .then((response) => setState({ kind: 'ready', info: response.data as InviteInfo }))
      .catch((e: unknown) =>
        setState({
          kind: 'error',
          message: errorMessage(e, 'This invite link is invalid or has expired.'),
        }),
      );
  }, [token]);

  async function handleSubmit(event: FormEvent, info: InviteInfo): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Enter your name.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await http.post(`/api/invite/${token}/register`, {
        name: name.trim(),
        email: info.vendor.contactEmail,
        password,
      });
      await refresh();
      navigate('/vendor/prequal');
    } catch (e: unknown) {
      setFormError(errorMessage(e, 'Could not create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-8">
        {state.kind === 'loading' && <Spinner className="mx-auto h-6 w-6" />}
        {state.kind === 'error' && (
          <p className="text-center text-sm text-rose-600">{state.message}</p>
        )}
        {state.kind === 'ready' && state.info.alreadyRegistered && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">You've already registered</h1>
            <p className="mt-2 text-sm text-slate-500">
              An account already exists for {state.info.vendor.contactEmail}.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Go to login
            </Button>
          </div>
        )}
        {state.kind === 'ready' && !state.info.alreadyRegistered && (
          <>
            <h1 className="text-xl font-bold text-slate-900 text-center">Welcome, {state.info.vendor.name}</h1>
            <p className="mt-2 text-sm text-slate-500 text-center">
              You've been invited to register as a vendor. Set up your login below.
            </p>
            <form className="mt-6" onSubmit={(e) => void handleSubmit(e, state.info)}>
              {formError && (
                <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
              )}
              <label className="block text-sm font-medium">
                Your name
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </label>
              <label className="mt-4 block text-sm font-medium">
                Email
                <input value={state.info.vendor.contactEmail} disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
              </label>
              <label className="mt-4 block text-sm font-medium">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
              </label>
              <Button type="submit" disabled={submitting} className="mt-6 w-full">
                {submitting ? 'Creating your account…' : 'Create account & start registration'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
