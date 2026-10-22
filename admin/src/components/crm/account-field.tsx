import type { ReactNode } from "react";

export function AccountField({
  name,
  value,
}: {
  name: string;
  value: unknown;
}): ReactNode {
  if (value == null || value === "")
    return <span className="text-muted-foreground">—</span>;
  if (
    ["website", "linkedin", "facebook", "instagram", "twitter"].includes(name)
  ) {
    const url = String(value);
    if (!/^https?:\/\//i.test(url)) return url;
    return (
      <a
        className="text-muted-foreground hover:text-foreground hover:underline"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
      </a>
    );
  }
  if (name === "revenue")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(value));
  if (name === "headcount") return Number(value).toLocaleString("en-US");
  if (name === "createdAt")
    return new Date(String(value)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  return String(value);
}
