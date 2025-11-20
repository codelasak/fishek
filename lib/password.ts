import crypto from 'crypto';

const DEFAULT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

// Hash password using Node's built-in scrypt. Format:
// scrypt$N$r$p$saltHex$hashHex
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const { N, r, p, keylen } = DEFAULT_PARAMS;

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N, r, p }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf as Buffer);
    });
  });

  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, NStr, rStr, pStr, saltHex, hashHex] = parts;
  const N = Number(NStr);
  const r = Number(rStr);
  const p = Number(pStr);
  const salt = Buffer.from(saltHex, 'hex');
  const storedHash = Buffer.from(hashHex, 'hex');
  const keylen = storedHash.length;

  try {
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, keylen, { N, r, p }, (err, buf) => {
        if (err) reject(err);
        else resolve(buf as Buffer);
      });
    });

    return crypto.timingSafeEqual(storedHash, derivedKey);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
