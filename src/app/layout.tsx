import type { Metadata } from "next";
import Slidebar from "../components/Slidebar";
import localFont from "next/font/local";
import "./globals.css";


export const metadata: Metadata = {
  title: "Rag Web",
  description: "Chat with a PDFs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={""}
      >
        <div className="flex h-screen">
          <Slidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
