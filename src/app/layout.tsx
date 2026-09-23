import type { Metadata } from "next";
import { Bebas_Neue, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";

const bodyFont = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NHL Office Pool",
  description: "Season-long NHL office pool manager",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AppProviders>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
