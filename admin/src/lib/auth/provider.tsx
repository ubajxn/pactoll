"use client";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { authClient } from "./client";
import type { WorkspaceContext } from "./types";

const AccountContext = createContext<WorkspaceContext | null>(null);
export function AccountProvider({
  value,
  children,
}: {
  value: WorkspaceContext;
  children: ReactNode;
}) {
  const { data: session, isPending, error } = authClient.useSession();
  const changed = !isPending && !error && session?.user.id !== value.user.id;
  useEffect(() => {
    if (changed)
      window.location.replace(
        session
          ? "/onboarding"
          : `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
  }, [changed, session]);
  if (changed) return null;
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider is required");
  return value;
}
