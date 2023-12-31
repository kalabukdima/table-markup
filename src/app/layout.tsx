import "./globals.css"
import type { Metadata } from "next"
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { StrictMode } from "react";


export const metadata: Metadata = {
  title: "Table Markup",
  description: "Web app that allows editing tables and annotating them for ML models training",
  colorScheme: "normal",
  themeColor: "white",
  manifest: "manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StrictMode>
      <html lang="en">
        <body>{children}</body>
      </html>
    </StrictMode>
  )
}
