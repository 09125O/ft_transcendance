export const TECHNICAL_SCORE_EMAIL_PREFIX = "ws-smoke-";

export function isTechnicalScoreEmail(email: string): boolean {
  return email.trim().toLowerCase().startsWith(TECHNICAL_SCORE_EMAIL_PREFIX);
}
