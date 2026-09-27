// Native features exposed by electron/preload.js.

interface TidderAuthTokens {
  accessToken: string;
  expiresIn: number;
}

interface TidderBridge {
  platform: string;

  window: {
    close(): void;
    minimize(): void;
    maximize(): void;
  };

  openExternal(url: string): void;
  openPopup(url: string, width: number, height: number, title?: string): void;

  // Reddit login in the system browser (see electron/auth.js).
  auth: {
    // Tokens once logged in, null if the user declined or cancelled, or
    // { error } if the login couldn't be completed.
    login(): Promise<TidderAuthTokens | { error: string } | null>;
    cancel(): void;

    // New tokens, null if there's no usable session, or { error } if Reddit
    // couldn't be reached (worth retrying later).
    refresh(): Promise<TidderAuthTokens | { error: string } | null>;

    // Revokes and forgets the stored session.
    logout(): Promise<void>;
  };

  settings: {
    get(key: string): any;
    set(key: string, value: any): void;
    watch(key: string, callback: (value: any) => void): { dispose(): void };
  };
}

interface Window {
  tidder: TidderBridge;
}
