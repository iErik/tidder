// Native features exposed by electron/preload.js.

interface TidderBridge {
  platform: string;

  window: {
    close(): void;
    minimize(): void;
    maximize(): void;
  };

  openExternal(url: string): void;
  openPopup(url: string, width: number, height: number, title?: string): void;

  // Resolves with the OAuth hash fragment (including the leading '#'), or null
  // if the login window was closed.
  login(url: string): Promise<string | null>;

  settings: {
    get(key: string): any;
    set(key: string, value: any): void;
    watch(key: string, callback: (value: any) => void): { dispose(): void };
  };
}

interface Window {
  tidder: TidderBridge;
}
