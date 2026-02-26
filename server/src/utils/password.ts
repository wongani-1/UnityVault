import bcrypt from "bcryptjs";

const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
export const STRONG_PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters and include lowercase, uppercase, number, and symbol.";

export const hashPassword = async (plain: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export const verifyPassword = (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

export const isStrongPassword = (value: string) => {
  return STRONG_PASSWORD_PATTERN.test(value);
};
