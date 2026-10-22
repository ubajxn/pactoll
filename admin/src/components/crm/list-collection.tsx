"use client";

import Link from "next/link";
import { RecordListProvider, useLists } from "@/components/crm/lists-provider";
import { OpportunityCollection } from "@/components/crm/opportunity-collection";
import { PageHeader } from "@/components/crm/page-header";
import { RecordCollection } from "@/components/crm/record-collection";
import { Button } from "@/components/ui/button";

export function ListCollection({ id }: { id: string }) {
  const { lists, loading, error, refresh } = useLists();
  const list = lists.find((list) => list.id === id);
  if (error || !list)
    return (
      <>
        <PageHeader title="Lists" />
        <div className="m-auto space-y-3 text-center">
          {loading ? (
            <output>Loading list…</output>
          ) : error ? (
            <>
              <p role="alert">Could not load this list.</p>
              <Button variant="outline" onClick={refresh}>
                Retry
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-lg font-medium">List not found</h1>
              <p className="text-sm text-muted-foreground">
                This list may have been deleted.
              </p>
              <Button render={<Link href="/accounts" />} variant="outline">
                Go to accounts
              </Button>
            </>
          )}
        </div>
      </>
    );
  return (
    <RecordListProvider value={list}>
      {list.recordType === "opportunities" ? (
        <OpportunityCollection key={id} />
      ) : (
        <RecordCollection key={id} kind={list.recordType} title={list.name} />
      )}
    </RecordListProvider>
  );
}
