const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_PATTERN = /^\+?[0-9\s()-]+$/;

export const isValidEmail = (value: string) => {
  return EMAIL_PATTERN.test(value.trim());
};

export const isValidPhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) return false;
  if (!PHONE_ALLOWED_PATTERN.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};
