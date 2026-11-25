export {};

type TelegramSafeAreaInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

type TelegramThemeParams = Partial<
  Record<
    | "bg_color"
    | "text_color"
    | "hint_color"
    | "link_color"
    | "button_color"
    | "button_text_color"
    | "secondary_bg_color"
    | "header_bg_color"
    | "bottom_bar_bg_color"
    | "accent_text_color"
    | "section_bg_color"
    | "section_header_text_color"
    | "section_separator_color"
    | "subtitle_text_color"
    | "destructive_text_color",
    string
  >
>;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: { id?: number; language_code?: string };
          start_param?: string;
        };
        /** Bot API version supported by the client, e.g. "8.0". */
        version?: string;
        platform?: string;
        isVersionAtLeast?: (version: string) => boolean;
        ready?: () => void;
        expand?: () => void;
        colorScheme?: "light" | "dark";
        themeParams?: TelegramThemeParams;
        switchInlineQuery?: (
          query: string,
          chooseChatTypes?: Array<"users" | "bots" | "groups" | "channels">,
        ) => void;
        /** Bot API 8.0: share a message prepared with savePreparedInlineMessage. */
        shareMessage?: (msgId: string, callback?: (sent: boolean) => void) => void;
        openTelegramLink?: (url: string) => void;
        /** Bot API 7.7: keep vertical swipes from collapsing the Mini App mid-game. */
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        setBottomBarColor?: (color: string) => void;
        BackButton?: {
          isVisible?: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        /** Bot API 8.0 device safe area (also mirrored as --tg-safe-area-inset-*). */
        safeAreaInset?: TelegramSafeAreaInset;
        /** Bot API 8.0 Telegram UI content safe area (--tg-content-safe-area-inset-*). */
        contentSafeAreaInset?: TelegramSafeAreaInset;
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
      };
    };
  }
}
