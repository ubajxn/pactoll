"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PageBreadcrumbs, PageHeader } from "@/components/crm/page-header";
import { CopyRecordLinkButton } from "@/components/crm/record-detail-actions";
import { RecordDetails } from "@/components/crm/record-details";
import { Button } from "@/components/ui/button";
import { crmNavigation } from "@/lib/crm-navigation";
import { DataError, type RecordKind, type Records } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

type DetailState =
  | { status: "loading" }
  | { status: "ready"; record: Records[RecordKind] }
  | { status: "missing" }
  | { status: "error" };

/** Canonical record view for direct links and full-page reloads. */
export function DetailPage({ kind, id }: { kind: RecordKind; id: string }) {
  return (
    <Suspense>
      <DetailPageContent key={`${kind}:${id}`} kind={kind} id={id} />
    </Suspense>
  );
}

function DetailPageContent({ kind, id }: { kind: RecordKind; id: string }) {
  const data = useData();
  const params = useSearchParams();
  const currentIdentity = useRef("");
  currentIdentity.current = `${kind}:${id}`;
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const query = params.toString();
  const backHref = `/${kind}${query ? `?${query}` : ""}`;
  const collection = crmNavigation.find((item) => item.href === `/${kind}`);
  const title =
    state.status === "ready"
      ? "name" in state.record
        ? state.record.name
        : state.record.title
      : state.status === "missing"
        ? "Record not found"
        : state.status === "error"
          ? "Unable to load record"
          : "Loading record…";

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt explicitly retries the request.
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    data.get(kind, id).then(
      (record) => {
        if (!cancelled) setState({ status: "ready", record });
      },
      (error: unknown) => {
        if (!cancelled)
          setState({
            status:
              error instanceof DataError &&
              (error.code === "not_found" || error.code === "validation")
                ? "missing"
                : "error",
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, kind, id, attempt]);

  return (
    <>
      <PageHeader>
        <PageBreadcrumbs
          parent={{ title: collection?.title ?? kind, href: backHref }}
          title={title}
        />
        <CopyRecordLinkButton
          kind={kind}
          id={id}
          disabled={state.status !== "ready"}
        />
      </PageHeader>
      {/* Match the drawer's 42rem width minus its inset, border and content padding. */}
      <div
        data-record-page
        className="mx-auto w-full max-w-[calc(42rem-4rem-0.875rem)] pb-8"
      >
        {state.status === "loading" ? (
          <output className="text-sm text-muted-foreground">
            Loading record…
          </output>
        ) : state.status === "missing" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This record is not available in the current data source.
            </p>
            <Link href={backHref} className="text-sm underline">
              Back to {collection?.title ?? kind}
            </Link>
          </div>
        ) : state.status === "error" ? (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-muted-foreground">
              The data source could not be reached. Try again.
            </p>
            <Button onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </Button>
          </div>
        ) : (
          <RecordDetails
            kind={kind}
            record={state.record}
            onUpdated={(record) => {
              if (currentIdentity.current === `${kind}:${record.id}`)
                setState({ status: "ready", record });
            }}
          />
        )}
      </div>
    </>
  );
}
