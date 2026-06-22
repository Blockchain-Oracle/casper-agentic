import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casper Agent Commerce Gateway",
  description:
    "Provider tools, Casper agent wallet policy, paid tool console, and public x402 receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
