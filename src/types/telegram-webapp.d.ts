export {};

type TelegramSafeAreaInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: { id?: number; language_code?: string };
        };
        ready?: () => void;
        expand?: () => void;
        colorScheme?: "light" | "dark";
        switchInlineQuery?: (query: string, chooseChatTypes?: string[]) => void;
        /** Bot API 8.0+ device safe area (also mirrored as --tg-safe-area-inset-*). */
        safeAreaInset?: TelegramSafeAreaInset;
        /** Bot API 8.0+ Telegram UI content safe area (--tg-content-safe-area-inset-*). */
        contentSafeAreaInset?: TelegramSafeAreaInset;
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
      };
    };
  }
}
