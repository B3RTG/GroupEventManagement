// ── Google Identity Services (GIS) ────────────────────────
// https://developers.google.com/identity/gsi/web/reference/js-reference

interface GoogleCredentialResponse {
  /** JWT id_token */
  credential: string;
  select_by: string;
  clientId: string;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}

interface GoogleAccounts {
  id: {
    initialize(config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      error_callback?: (error: { type: string }) => void;
      nonce?: string;
      auto_select?: boolean;
      use_fedcm_for_prompt?: boolean;
    }): void;
    renderButton(parent: HTMLElement, config: GoogleButtonConfig): void;
    prompt(momentListener?: (notification: unknown) => void): void;
  };
}

// ── Apple Sign In JS ──────────────────────────────────────
// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js

interface AppleSignInResponse {
  authorization: {
    code: string;
    /** JWT id_token */
    id_token: string;
    state?: string;
  };
  /** Only present on first sign-in */
  user?: {
    email: string;
    name: { firstName: string; lastName: string };
  };
}

interface AppleIDAuth {
  init(config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    state?: string;
    nonce?: string;
    usePopup?: boolean;
  }): void;
  signIn(): Promise<AppleSignInResponse>;
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
    AppleID?: { auth: AppleIDAuth };
  }
}

export {};
