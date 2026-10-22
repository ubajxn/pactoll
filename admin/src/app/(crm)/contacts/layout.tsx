import type { ReactNode } from "react";

export default function ContactsLayout({
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
