import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import ThemeInitializer from "@/components/ThemeInitializer";
import { LanguageProvider } from "@/components/LanguageContext";
import AppShell from "@/components/layout/AppShell";
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
  title: "Sift AI Back Office",
  description: "ระบบคัดแยกปัญหาแชตลูกค้าวิเคราะห์ด้วย AI (Sift AI)",
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
      <body className="font-sans h-screen overflow-hidden antialiased">
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
