import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velmora — Medieval RPG",
  description: "Um RPG Dark Medieval imersivo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
