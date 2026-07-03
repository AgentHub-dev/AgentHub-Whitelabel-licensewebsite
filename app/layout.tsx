import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentHub-OS — Werde White-Label KI-Partner",
  description:
    "Biete AgentHub-OS als eigene KI-Middleware an — für Coaches, KI/IT-Berater, Systemhäuser und Server-Infrastrukturanbieter. Dein Brand, deine Preise, automatischer Revenue-Split.",
  openGraph: {
    title: "AgentHub-OS — Werde White-Label KI-Partner",
    description:
      "White-Label KI-Plattform für Coaches, IT-Berater, Systemhäuser und Server-Anbieter. Dein Brand. Deine Preise. Deine Kunden.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
