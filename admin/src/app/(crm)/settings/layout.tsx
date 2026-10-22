export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-3xl py-6">{children}</div>;
}
