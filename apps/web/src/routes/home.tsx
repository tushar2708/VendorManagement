import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.js";

export function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center p-8">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  if (user && user.role) {
    if (user.role === "VENDOR") return <Navigate to="/vendor/dashboard" replace />;
    if (user.role === "BUYER" || user.role === "ADMIN") return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center p-8">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase mb-3">
          Vendor Management
        </p>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Onboard vendors with clarity
        </h1>
        <p className="text-slate-600 mb-8">
          Track requests, verify documents, manage approvals, and push to ERP — all in one place.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/signup"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
