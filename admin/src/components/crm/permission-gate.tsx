"use client";

import { useAccount } from "@/lib/auth/provider";
import { canAccess, type Module } from "@/lib/permissions";
import { ShieldAlert } from "lucide-react";

export function PermissionGate({
  module,
  children,
}: {
  module: Module;
  children: React.ReactNode;
}) {
  const { role } = useAccount();
  if (canAccess(role, module)) return <>{children}</>;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
      <p className="max-w-sm text-sm text-gray-500">
        You don't have permission to view this section.
        Contact your administrator for access.
      </p>
    </div>
  );
}
