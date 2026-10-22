"use client";

import { useEffect, useState } from "react";
import {
  type RecordKind,
  type RecordReference,
  type Records,
  recordKinds,
} from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

export type ContextRecord = {
  reference: RecordReference;
  name: string;
  record: Records[RecordKind];
};
export function useContextRecords() {
  const data = useData();
  const [records, setRecords] = useState<ContextRecord[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: explicit retry.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all(
      recordKinds.map(async (type) =>
        (await data.list(type)).map((record) => ({
          reference: { type, id: record.id },
          name: "name" in record ? record.name : record.title,
          record,
        })),
      ),
    )
      .then(
        (groups) => {
          if (!cancelled) setRecords(groups.flat());
        },
        () => {
          if (!cancelled) setError(true);
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data, attempt]);
  return { records, error, loading, retry: () => setAttempt((n) => n + 1) };
}
