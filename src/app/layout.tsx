import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/app/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Proof-Print type voices: Space Grotesk (display) · Inter (UI + tabular figures)
// · JetBrains Mono (the "proof voice" — hashes, addresses, x402 headers).
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <div id="app">{children}</div>
          <div id="csprclick-ui" />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
