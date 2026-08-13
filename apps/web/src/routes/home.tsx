import { Navigate } from "react-router-dom";
import { LandingPage } from "./landing.js";
import { useAuth } from "@/hooks/use-auth.js";

export function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-cream-50 grid place-items-center p-8">
        <p className="text-forest-500">Loading...</p>
      </main>
    );
  }

  if (user && user.role) {
    if (user.role === "VENDOR") return <Navigate to="/vendor/dashboard" replace />;
    if (user.role === "BUYER" || user.role === "ADMIN") return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
