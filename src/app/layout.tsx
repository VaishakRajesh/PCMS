import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// App-wide font (self-hosted by Next.js, no Google request at runtime).
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "PortfolioCMS", template: "%s | PortfolioCMS" },
  description:
    "Create, customize and publish professional portfolios without writing code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
