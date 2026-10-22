// Native features exposed by electron/preload.js.

interface TidderAuthTokens {
  accessToken: string
  expiresIn: number
}

// A right-click the main process forwards to the renderer, with what it
// landed on: one in the page, or inside an embed's iframe, which the page
// never sees. A subset of Electron's context-menu params, with x and y as
// Electron reports them.
interface TidderContextMenuParams {
  x: number
  y: number
  isSubframe: boolean
  selectionText: string
  linkURL: string
  linkText: string
  srcURL: string
  mediaType: string
  isEditable: boolean
  editFlags: {
    canUndo: boolean
    canRedo: boolean
    canCut: boolean
    canCopy: boolean
    canPaste: boolean
    canDelete: boolean
    canSelectAll: boolean
    canEditRichly: boolean
  }
}

// What the context menu can do to the focused field
type TidderEditCommand = 'cut' | 'copy' | 'paste' | 'selectAll'

type TidderDownloadResult =
  | { status: 'saved'; fileName: string }
  | { status: 'cancelled' }
  | { status: 'failed' }

interface TidderBridge {
  platform: string

  // Running under the dev server (pnpm run dev)
  isDev: boolean

  window: {
    close(): void
    minimize(): void

    // Restores the window if it's maximized, maximizes it
    // otherwise (see electron/maximize.js)
    toggleMaximize(): void
    isMaximized(): Promise<boolean>

    // Every change of the maximized state, whatever made it
    onMaximizedChange(
      listener: (maximized: boolean) => void
    ): { dispose(): void }
  }

  openExternal(url: string): void
  openPopup(url: string, width: number, height: number, title?: string): void

  // The context menu's native features (see electron/contextMenu.js).
  // x and y are in CSS pixels, relative to the window.
  contextMenu: {
    // Opens DevTools on the element at the point. Only in dev
    inspect(x: number, y: number): void
    copyImage(x: number, y: number): Promise<void>
    writeText(text: string): void

    // Runs the command on the field that has focus
    edit(command: TidderEditCommand): void

    // Asks where to save the URL, starting in Downloads
    download(url: string, suggestedName: string): Promise<TidderDownloadResult>

    // Like download, for a Reddit video with sound: saves one MP4
    // combining the video and audio files its DASH manifest lists
    downloadVideo(
      dashUrl: string,
      suggestedName: string
    ): Promise<TidderDownloadResult>

    onForwarded(
      listener: (params: TidderContextMenuParams) => void
    ): { dispose(): void }
  }

  // Reddit login in the system browser (see electron/auth/).
  auth: {
    // Tokens once logged in, null if the user declined or cancelled, or
    // { error } if the login couldn't be completed.
    login(): Promise<TidderAuthTokens | { error: string } | null>
    cancel(): void

    // New tokens, null if there's no usable session, or { error } if Reddit
    // couldn't be reached (worth retrying later).
    refresh(): Promise<TidderAuthTokens | { error: string } | null>

    // Revokes and forgets the stored session.
    logout(): Promise<void>
  }

  settings: {
    get(key: string): unknown
    set(key: string, value: unknown): void
    watch(
      key: string,
      callback: (value: unknown) => void
    ): { dispose(): void }
  }
}

interface Window {
  tidder: TidderBridge
}
