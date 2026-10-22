import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "Overview | PTP Operations Suite", template: "%s | PTP Operations Suite" },
  description: "Pacific Toll Processing — CRM, pipeline management, and client operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", inter.variable, dmSerif.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
