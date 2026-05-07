import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentHub-OS — Die KI-Plattform für deine Agentur",
  description:
    "Das vollständige White-Label KI-System für Agenturen. Fertig deployed in 5 Minuten. Unter deinem Brand.",
  openGraph: {
    title: "AgentHub-OS — Die KI-Plattform für deine Agentur",
    description:
      "White-Label KI für Agenturen. Dein Brand. Deine Preise. Deine Kunden.",
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
