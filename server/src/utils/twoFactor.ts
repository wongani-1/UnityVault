import crypto from "crypto";

// Simple TOTP implementation using crypto
export const generateTOTPSecret = (): string => {
  // Generate a random 32-byte secret and base32 encode it
  const secret = crypto.randomBytes(20);
  return base32Encode(secret);
};

export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
};

export const verifyTOTPToken = (secret: string, token: string): boolean => {
  // This is a simplified implementation
  // For production, use a library like 'speakeasy' or 'otplib'
  const timeWindow = 1;
  const time = Math.floor(Date.now() / 30000);

  for (let i = -timeWindow; i <= timeWindow; i++) {
    if (generateTOTPToken(secret, time + i) === token) {
      return true;
    }
  }

  return false;
};

// Generate TOTP token for a given time
const generateTOTPToken = (secret: string, time: number): string => {
  const decodedSecret = base32Decode(secret);
  const buffer = Buffer.alloc(8);

  for (let i = 7; i >= 0; i--) {
    buffer[i] = time & 0xff;
    time = time >> 8;
  }

  const hmac = crypto.createHmac("sha1", decodedSecret);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    (digest.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, 6);

  return code.toString().padStart(6, "0");
};

// Base32 encoding/decoding (RFC 4648)
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (buffer: Buffer): string => {
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += base32Alphabet[(value << (5 - bits)) & 31];
  }

  while (result.length % 8) {
    result += "=";
  }

  return result;
};

const base32Decode = (str: string): Buffer => {
  let bits = 0;
  let value = 0;
  const result: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const index = base32Alphabet.indexOf(str[i].toUpperCase());

    if (index === -1) {
      if (str[i] === "=") {
        break;
      }
      throw new Error(`Invalid base32 character: ${str[i]}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(result);
};

export const generateQRCode = (secret: string, email: string, appName: string = "UnityVault"): string => {
  // Generate otpauth URL for QR code
  const encoded = encodeURIComponent(`${appName} (${email})`);
  return `otpauth://totp/${encoded}?secret=${secret}&issuer=${appName}`;
};
