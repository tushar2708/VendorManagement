import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { AuthContext, type AuthContextType } from "@/hooks/use-auth.js";
import { getSession } from "@/lib/auth-client.js";
import { identifyUser, resetAnalytics } from "@/lib/analytics.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const session = await getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        identifyUser({ id: u.id, email: u.email, name: u.name, role: u.role, tier: u.tier });
      } else {
        resetAnalytics();
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext value={{ user, loading, refresh }}>
      {children}
    </AuthContext>
  );
}
