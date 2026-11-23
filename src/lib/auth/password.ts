import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Minimum policy: 12+ characters with letters and a number or symbol. */
export function passwordProblem(plain: string): string | null {
  if (plain.length < 12) return "Password must be at least 12 characters.";
  if (plain.length > 200) return "Password is too long.";
  if (!/[A-Za-z]/.test(plain) || !/[^A-Za-z]/.test(plain))
    return "Use letters plus at least one number or symbol.";
  return null;
}
