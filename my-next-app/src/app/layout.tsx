import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

/**
 * MakeItSo Finance - Root Layout
 * 
 * Enhanced root layout with authentication provider, security headers,
 * and financial application specific metadata and configurations.
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
  title: "MakeItSo Finance",
  description: "Simple budgeting and expense tracking app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  let effectiveTheme = theme;
                  
                  if (theme === 'system') {
                    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(effectiveTheme);
                  
                  if (effectiveTheme === 'dark') {
                    document.documentElement.style.setProperty('--background', '#0a0a0a');
                    document.documentElement.style.setProperty('--foreground', '#ededed');
                  } else {
                    document.documentElement.style.setProperty('--background', '#ffffff');
                    document.documentElement.style.setProperty('--foreground', '#171717');
                  }
                } catch (e) {
                  // Fallback to light theme
                  document.documentElement.classList.add('light');
                }
              })();
            `
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`} suppressHydrationWarning>
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
