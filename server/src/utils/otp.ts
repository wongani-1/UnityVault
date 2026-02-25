import crypto from "crypto";

export const generateOtp = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  const value = crypto.randomInt(min, max);
  return String(value);
};
