import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/app/theme-provider";
import { CsprClickProvider } from "@/components/csprclick/csprclick-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Casper GW — proof for every agent payment",
  description:
    "An x402 payment gateway on Casper. Publish paid tools, pay per call with an API key, and verify every settlement on-chain in the public explorer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div id="csprclick-ui" />
        <div id="app">
          <ThemeProvider>
            <CsprClickProvider>
              {children}
              <Toaster position="bottom-right" />
            </CsprClickProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
