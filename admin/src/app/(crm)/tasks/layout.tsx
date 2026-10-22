import type { ReactNode } from "react";

export default function TasksLayout({
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
