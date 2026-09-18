import bcrypt from "bcryptjs";

// Password hashing (Node-only: imported by server actions, NEVER middleware).
// bcrypt is slow on purpose — stolen hashes are expensive to crack.
// Cost 10 = ~100ms per login: safe yet snappy for a demo.
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    if (!plain || !hash) return false;
    return await bcrypt.compare(plain, hash);
  } catch {
    return false; // broken/empty hash counts as "wrong password"
  }
}
