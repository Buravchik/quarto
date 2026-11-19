import type { ReactNode } from "react";

export const metadata = {
  title: "Quarto",
  description: "Telegram Quarto Mini App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
