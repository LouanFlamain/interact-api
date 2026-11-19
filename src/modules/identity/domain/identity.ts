export type SystemRole = 'USER' | 'ADMIN';
export type EmailTokenPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface Identity {
  readonly id: string;
  readonly email: string;
  readonly systemRole: SystemRole;
  readonly emailVerified: boolean;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface TokenProof {
  readonly id: string;
  readonly verifierHash: string;
}

export interface IssuedToken {
  readonly proof: TokenProof;
  readonly secret: string;
}
