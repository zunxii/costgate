import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CostGate | Agentic Cloud Cost Governance for Pull Requests",
  description:
    "Automated PR cloud-cost analysis pipeline that catches database performance regressions, explains EXPLAIN ANALYZE diffs, and calculates attributed monthly AWS RDS impact before code merges.",
  keywords: [
    "cloud cost",
    "postgresql",
    "aws rds",
    "github actions",
    "database performance",
    "explain analyze",
    "pull request review",
    "finops",
  ],
  openGraph: {
    title: "CostGate | Agentic Cloud Cost Governance",
    description: "The future isn't writing queries. It's guarding cloud spend.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} light h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafafa] text-[#0f172a] selection:bg-[#ff9900]/20 selection:text-[#c2410c]">
        <TooltipProvider>
          <AnnouncementBanner />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
