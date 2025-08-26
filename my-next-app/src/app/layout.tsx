// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

/**
 * Captain's Ledger (MakeItSo Finance) — Root Layout
 * - Brandable header with logo (top-left)
 * - Preserves ThemeProvider/Providers
 * - Neutral light/dark surfaces; colors can be themed via Tailwind tokens
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Captain's Ledger",
  description: "Simple budgeting and expense tracking app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Ensure no theme flash on first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                let effectiveTheme = theme;
                if (theme === 'system') {
                  effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.remove('federation','borg');
                document.documentElement.classList.add(effectiveTheme === 'light' ? 'federation' : 'borg');
              } catch (_) { document.documentElement.classList.add('light'); }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased
                    bg-[#F8FAFC] text-[#1A1D23] 
                    dark:bg-[#0F1115] dark:text-[#EAECEF]`}
      >
        <ThemeProvider>
          {/* Top Navigation / Brand Header */}
          <header
            className="sticky top-0 z-40 border-b border-[#E6E8EC] bg-white/85 backdrop-blur
                       dark:border-[#2A2E37] dark:bg-[#1C1F24]/85"
          >
            <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Brand: replace /brand/logo.png with your file */}
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/brand/logo.png"
                  width={28}
                  height={28}
                  alt="Captain's Ledger"
                  priority
                />
                <span className="sr-only">Captain's Ledger</span>
              </Link>

              {/* Right-side actions (theme toggle placeholder / user menu, etc.) */}
              <div className="flex items-center gap-2">
                {/* Example ghost button style; hook up your real toggle if you have one */}
                <button
                  type="button"
                  aria-label="Toggle theme"
                  className="rounded-xl border border-[#E6E8EC] bg-white px-3 py-1.5 text-sm text-[#1A1D23]
                             hover:bg-[#F3F4F6]
                             dark:border-[#2A2E37] dark:bg-[#1C1F24] dark:text-[#EAECEF]
                             dark:hover:bg-white/5"
                  onClick={() => {
                    const root = document.documentElement;
                    const isBorg = root.classList.contains("borg");
                    const next = isBorg ? "federation" : "borg";
                    root.classList.remove("federation", "borg");
                    root.classList.add(next);
                    try { localStorage.setItem("theme", next); } catch {}
                  }}
                >
                  Theme
                </button>
              </div>
            </div>
          </header>

          {/* Page container */}
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            <Providers>{children}</Providers>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
