import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { AuthContext, type AuthContextType } from "@/hooks/use-auth.js";
import { getSession } from "@/lib/auth-client.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const session = await getSession();
      setUser(session?.user ?? null);
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
