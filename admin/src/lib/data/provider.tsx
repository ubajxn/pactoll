"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { createConfiguredAdapter, type DataAdapter } from "./index";

const DataContext = createContext<DataAdapter | null>(null);
export function DataProvider({
  children,
  adapter,
}: {
  children: ReactNode;
  adapter?: DataAdapter;
}) {
  const [data] = useState(() => adapter ?? createConfiguredAdapter());
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error("useData requires DataProvider");
  return data;
}
