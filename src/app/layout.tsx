// Root layout for the whole app (App Router convention: wraps every page).
// Loads the two site fonts as CSS variables, sets the shared HTML shell,
// and renders the persistent Header/Footer around each page's `children`.
// Dark is the CSS default (see globals.css); a `.light` class toggled by
// ThemeToggle swaps to the light palette.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepCompass",
  description: "Personal LeetCode tracker, organized pattern by pattern.",
};

// Applied before hydration so the saved theme (default: dark, see
// globals.css) never flashes the wrong palette on load. Kept inline rather
// than an external script so it runs synchronously, ahead of first paint —
// `suppressHydrationWarning` on <html> below silences the resulting
// server/client class-attribute mismatch this intentionally causes.
const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("theme")==="light"){document.documentElement.classList.add("light")}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
