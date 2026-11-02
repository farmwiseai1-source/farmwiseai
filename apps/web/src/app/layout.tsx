import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmWiseAI | Practical guidance for every growing season",
  description:
    "FarmWiseAI helps farmers plan crops, water and farm resources with clear, explainable guidance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
