import type { ReactNode } from "react";

export default function AccountsLayout({
  children,
  record,
}: {
  children: ReactNode;
  record: ReactNode;
}) {
  return (
    <>
      {children}
      {record}
    </>
  );
}
