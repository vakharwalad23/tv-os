import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeVision — AI Chart Analysis",
  description:
    "Real-time AI chart analysis powered by Overshoot AI vision inference",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scanlines">{children}</body>
      <Analytics />
    </html>
  );
}
