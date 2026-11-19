import type { ReactNode } from "react";
import Script from "next/script";

export const metadata = {
  title: "Quarto",
  description: "Telegram Quarto Mini App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* beforeInteractive: available before hydration — avoids empty initData race */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
