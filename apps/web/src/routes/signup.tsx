import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.js";
import { signup } from "@/lib/auth-client.js";
import { cn } from "@/components/ui.js";

type Tier = 'EXECUTIVE' | 'LEADERSHIP';

export function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<Tier>('EXECUTIVE');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password, tier);
      await refresh();
      navigate("/dashboard");
    } catch {
      setError("Signup failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
      <p className="text-sm text-slate-600 mb-6">Set up your buyer organisation</p>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Role Toggle */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">I am a</legend>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-indigo-600 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600"
              disabled
            >
              Buyer
            </button>
            <div className="relative group">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
                disabled
              >
                Vendor
              </button>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Vendors register via invite link
              </div>
            </div>
          </div>
        </fieldset>

        {/* Tier Selector */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">My role</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['EXECUTIVE', 'LEADERSHIP'] as const).map((tierOption) => (
              <button
                key={tierOption}
                type="button"
                onClick={() => setTier(tierOption)}
                className={cn(
                  'rounded-lg border-2 px-4 py-3 text-left transition-colors',
                  tier === tierOption
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                )}
              >
                <div className="font-medium text-sm text-slate-900">
                  {tierOption === 'EXECUTIVE' ? 'Executive' : 'Leadership'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {tierOption === 'EXECUTIVE'
                    ? 'Day-to-day operations — manage vendors, approvals, and onboarding'
                    : 'Strategic oversight — dashboards, reports, and high-level decisions'}
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Form Fields */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
      </p>
    </>
  );
}
