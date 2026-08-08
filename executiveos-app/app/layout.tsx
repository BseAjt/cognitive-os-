import type { Metadata, Viewport } from "next";
import { HistoryControls } from "@/components/history-controls";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ExecutiveOS", template: "%s · ExecutiveOS" },
  description: "Le système d’exploitation cognitif qui transforme le contexte en décisions traçables et en exécution mesurable.",
  applicationName: "ExecutiveOS",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f3ee"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <HistoryControls />
      </body>
    </html>
  );
}
