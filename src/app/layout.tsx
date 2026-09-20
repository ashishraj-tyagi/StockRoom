import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { getCart } from "@/lib/store";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockRoom",
  description:
    "Inventory and order desk application under test for Playwright UI and API automation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();
  const cartCount = user
    ? getCart(user.id).reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AppHeader user={user} cartCount={cartCount} />
        <main>{children}</main>
      </body>
    </html>
  );
}
