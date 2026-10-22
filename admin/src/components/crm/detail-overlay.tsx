"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DetailSurface } from "@/components/crm/detail-surface";
import { RecordPanelActions } from "@/components/crm/record-detail-actions";
import { RecordDetails } from "@/components/crm/record-details";
import { Button } from "@/components/ui/button";
import type { Records } from "@/lib/data/contracts";
import { DataError, type RecordKind } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

const DetailOverlayContext = createContext<HTMLElement | null>(null);
const DetailOverlayTargetContext = createContext<
  (target: HTMLDivElement | null) => void
>(() => {});

export function DetailOverlayProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <DetailOverlayContext.Provider value={target}>
      <DetailOverlayTargetContext.Provider value={setTarget}>
        {children}
      </DetailOverlayTargetContext.Provider>
    </DetailOverlayContext.Provider>
  );
}

export function DetailOverlaySlot() {
  const setTarget = useContext(DetailOverlayTargetContext);
  return (
    <div
      ref={setTarget}
      className="pointer-events-none absolute inset-0 z-20"
    />
  );
}

type DetailState =
  | { status: "loading" }
  | { status: "ready"; record: Records[RecordKind] }
  | { status: "missing" }
  | { status: "error" };

export function DetailOverlay({
  children,
  onClose,
  label = "Record details",
  returnHref,
}: {
  children: ReactNode;
  onClose: () => void;
  label?: string;
  returnHref?: string;
}) {
  const target = useContext(DetailOverlayContext);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!target) return;
    const previous = document.activeElement;
    const previousHref =
      previous instanceof HTMLElement && previous.tagName === "A"
        ? previous.getAttribute("href")
        : null;
    panel.current
      ?.querySelector<HTMLButtonElement>(
        'button[data-detail-close], button[aria-label="Close record details"]',
      )
      ?.focus({ preventScroll: true });
    return () => {
      const restore = () => {
        if (
          document.activeElement !== document.body &&
          !panel.current?.contains(document.activeElement)
        )
          return;
        const href = previousHref ?? returnHref;
        const fallback = href
          ? Array.from(
              document.querySelectorAll<HTMLAnchorElement>("a[href]"),
            ).find((link) => {
              const linkHref = link.getAttribute("href");
              return linkHref === href || linkHref?.startsWith(`${href}?`);
            })
          : null;
        const destination =
          previous instanceof HTMLElement && previous.isConnected
            ? previous
            : fallback;
        destination?.focus({ preventScroll: true });
      };
      restore();
      requestAnimationFrame(restore);
    };
  }, [target, returnHref]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing)
        return;
      if (
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [role="menu"]',
        )
      )
        return;

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!target) return null;
  return createPortal(
    <aside
      ref={panel}
      aria-label={label}
      data-record-detail
      className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-transparent p-1.5 sm:w-[min(100%,42rem)] lg:w-(--detail-overlay-width)"
    >
      {children}
    </aside>,
    target,
  );
}

export function RecordDetailPanel({
  kind,
  id,
  onClose,
  readOnly = false,
}: {
  kind: RecordKind;
  id: string;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const data = useData();
  const currentIdentity = useRef("");
  currentIdentity.current = `${kind}:${id}`;
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

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

  const record = state.status === "ready" ? state.record : null;
  const title = record
    ? "name" in record
      ? record.name
      : record.title
    : "Record";

  return (
    <DetailOverlay
      onClose={onClose}
      returnHref={`/${kind}/${encodeURIComponent(id)}`}
    >
      <DetailSurface
        className="rounded-[10px]"
        toolbar={
          <>
            <h2 className="truncate text-[13px] font-medium">{title}</h2>
            <RecordPanelActions
              record={{ kind, id }}
              disabled={state.status !== "ready"}
              onClose={onClose}
            />
          </>
        }
      >
        {state.status === "loading" ? (
          <output className="text-sm text-muted-foreground">
            Loading record…
          </output>
        ) : state.status === "missing" ? (
          <p className="text-sm text-muted-foreground">
            This record is not available in the current data source.
          </p>
        ) : state.status === "error" ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The data source could not be reached. Try again.
            </p>
            <Button onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </Button>
          </div>
        ) : (
          <RecordDetails
            onUpdated={(record) => {
              if (currentIdentity.current === `${kind}:${record.id}`)
                setState({ status: "ready", record });
            }}
            key={id}
            kind={kind}
            record={state.record}
            readOnly={readOnly}
          />
        )}
      </DetailSurface>
    </DetailOverlay>
  );
}
