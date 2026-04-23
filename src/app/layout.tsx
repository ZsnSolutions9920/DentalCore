import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { FeedbackProvider } from "@/lib/feedback-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DentaCore Dental Clinic",
  description: "DentaCore — Dental Clinic Management System",
  manifest: "/manifest.json",
  themeColor: "#0284C7",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DentaCore" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-[#FAFAF9] text-stone-900">
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}` }} />
        <QueryProvider>
          <AuthProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
