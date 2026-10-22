export function safeReturnTo(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/home";
  try {
    const url = new URL(value, "https://crm.invalid");
    return url.origin === "https://crm.invalid" &&
      !/^\/(api|login|onboarding)(\/|$)/.test(url.pathname)
      ? `${url.pathname}${url.search}`
      : "/home";
  } catch {
    return "/home";
  }
}
