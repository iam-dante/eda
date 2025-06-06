import type { Metadata } from "next";
// import Slidebar from "../components/Slidebar";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eda - Your AI Learning Assistant",
  description: "Eda - Chat with a PDFs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={""}>
        <div className="flex h-screen bg-white">
          {/* <Slidebar /> */}
          <main className="flex-1 overflow-auto">{children}</main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
