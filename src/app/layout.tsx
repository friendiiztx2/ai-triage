import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import ThemeInitializer from "@/components/ThemeInitializer";
import { LanguageProvider } from "@/components/LanguageContext";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sift AI Back Office",
  description: "ระบบคัดแยกปัญหาแชตลูกค้าวิเคราะห์ด้วย AI (Sift AI)",
  icons: {
    icon: [
      { url: "/sift-ai-icon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/sift-ai-icon.png",
    apple: "/sift-ai-icon.png",
  },
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
      className={`${inter.variable} ${ibmPlexSansThai.variable} font-sans h-screen overflow-hidden antialiased`}
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
