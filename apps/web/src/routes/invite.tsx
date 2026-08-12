import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { http } from '../lib/http.js';
import { errorMessage } from '../lib/auth-api.js';
import { Card, Spinner, Button } from '../components/ui.js';

interface InviteInfo {
  vendor: { id: string; name: string; contactEmail: string };
  requirementId: string;
}

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly info: InviteInfo };

export function InviteLandingPage(): React.ReactElement {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    setState({ kind: 'loading' });
    http
      .post(`/api/invite/${token}/register`)
      .then((response) => setState({ kind: 'ready', info: response.data as InviteInfo }))
      .catch((e: unknown) =>
        setState({
          kind: 'error',
          message: errorMessage(e, 'This invite link is invalid or has expired.'),
        }),
      );
  }, [token]);

  function handleStart(): void {
    navigate('/vendor/prequal');
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-8 text-center">
        {state.kind === 'loading' && <Spinner className="mx-auto h-6 w-6" />}
        {state.kind === 'error' && (
          <>
            <p className="text-sm text-rose-600">{state.message}</p>
          </>
        )}
        {state.kind === 'ready' && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Welcome, {state.info.vendor.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              You've been invited to register as a vendor. Start your onboarding below.
            </p>
            <Button className="mt-6 w-full" onClick={handleStart}>
              Start registration
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
