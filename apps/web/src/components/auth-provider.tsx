import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthContext, type AuthContextType } from "@/hooks/use-auth.js";
import { getSession } from "@/lib/auth-client.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const session = await getSession();
      setUser(session?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
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
