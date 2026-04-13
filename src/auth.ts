import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import * as jose from "jose";

const TOKEN_LIFETIME_SECONDS = 20 * 60; // 20 minutes (Apple max)
const REFRESH_BUFFER_SECONDS = 60; // Refresh 1 minute before expiry

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Generate a JWT for App Store Connect API authentication.
 * Uses ES256 algorithm with the developer's .p8 private key.
 * Tokens are cached and auto-refreshed before expiry.
 */
export async function getToken(
  keyId: string,
  issuerId: string,
  privateKeyPath: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && now < tokenExpiresAt - REFRESH_BUFFER_SECONDS) {
    return cachedToken;
  }

  const resolvedPath = privateKeyPath.startsWith("~")
    ? resolve(homedir(), privateKeyPath.slice(2))
    : resolve(privateKeyPath);

  const privateKeyPem = readFileSync(resolvedPath, "utf-8");
  const privateKey = await jose.importPKCS8(privateKeyPem, "ES256");

  const exp = now + TOKEN_LIFETIME_SECONDS;

  // Individual API keys use `sub: "user"` instead of `iss: issuerId`.
  // Detect by empty/missing issuer ID.
  const builder = new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience("appstoreconnect-v1");

  if (issuerId) {
    builder.setIssuer(issuerId);
  } else {
    builder.setSubject("user");
  }

  const jwt = await builder.sign(privateKey);

  cachedToken = jwt;
  tokenExpiresAt = exp;

  return jwt;
}

/** Clear the cached token (useful for tests or forced refresh). */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}
