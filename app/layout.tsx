import type { ReactNode } from "react";
import Script from "next/script";
import "../src/theme/expressive.css";

export const metadata = {
  title: "Quarto",
  description: "Telegram Quarto Mini App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-ex-scheme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Source+Sans+3:wght@400;600&display=swap"
          rel="stylesheet"
        />
        {/* beforeInteractive: available before hydration — avoids empty initData race */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
