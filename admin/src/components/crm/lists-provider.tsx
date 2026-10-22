"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { CrmList } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

export function notifyListsChanged() {
  window.dispatchEvent(new Event("crm:lists-changed"));
}

const ListsContext = createContext<{
  lists: CrmList[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
  announce: (message: string) => void;
} | null>(null);
const RecordListContext = createContext<CrmList | null>(null);
export const RecordListProvider = RecordListContext.Provider;
export const useRecordList = () => useContext(RecordListContext);

export function ListsProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const [lists, setLists] = useState<CrmList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notice, announce] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => announce(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const events = [
      "crm:lists-changed",
      "crm:accounts-changed",
      "crm:contacts-changed",
      "crm:opportunities-changed",
    ];
    for (const event of events) window.addEventListener(event, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      for (const event of events) window.removeEventListener(event, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision explicitly refreshes the list directory.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    data.listLists().then(
      (next) => {
        if (cancelled) return;
        setLists(next);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, revision]);
  return (
    <ListsContext.Provider value={{ lists, loading, error, refresh, announce }}>
      {children}
      <output
        className={
          notice
            ? "fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-lg border bg-popover px-4 py-3 text-sm shadow-lg"
            : "sr-only"
        }
      >
        {notice}
      </output>
    </ListsContext.Provider>
  );
}

export function useLists() {
  const value = useContext(ListsContext);
  if (!value) throw new Error("useLists requires ListsProvider");
  return value;
}
