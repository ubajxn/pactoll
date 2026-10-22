import type { ReactNode } from "react";

export default function OpportunitiesLayout({
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
