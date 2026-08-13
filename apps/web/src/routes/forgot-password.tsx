import { Link } from "react-router-dom";

export function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-6">:(</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Well, this is awkward</h1>
      <p className="text-base text-slate-600 max-w-md mb-2">
        We never got around to implementing this feature.
      </p>
      <p className="text-base text-slate-600 max-w-md mb-8">
        So now you are locked out. Too bad.
      </p>
      <Link
        to="/login"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Back to login (if you remember your password)
      </Link>
    </div>
  );
}
