import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import GlobalNotifier from "@/components/GlobalNotifier";
import ThemeInitializer from "@/components/ThemeInitializer";
import { LanguageProvider } from "@/components/LanguageContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "AI Triage Back Office",
  description: "ระบบคัดแยกปัญหาแชตลูกค้าวิเคราะห์ด้วย AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${inter.variable} ${sarabun.variable} h-screen overflow-hidden antialiased`}
    >
      <head>
        <ThemeInitializer />
      </head>
      <body className="font-sans h-screen overflow-hidden flex bg-slate-50 dark:bg-slate-955 text-slate-805 dark:text-slate-100 transition-colors duration-250">
        <LanguageProvider>
          {/* Sidebar Navigation */}
          <Sidebar />
          
          {/* Global Realtime Notifier */}
          <GlobalNotifier />
          
          {/* Main Content Area */}
          <div className="flex-1 h-screen overflow-y-auto">
            <main className="p-8 md:p-10 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
