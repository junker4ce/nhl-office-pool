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
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
