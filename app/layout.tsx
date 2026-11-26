import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SCHEME_INIT_SCRIPT } from "@/lib/schemes";
import { SchemePicker } from "./SchemePicker";
import { AccountMenu } from "./AccountMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanavisa / Word Quiz",
  description: "Finnish–English word quiz",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline script below may set data-scheme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCHEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="flex items-center justify-end gap-3 px-4 pt-3">
          <SchemePicker />
          <AccountMenu />
        </header>
        {children}
      </body>
    </html>
  );
}
