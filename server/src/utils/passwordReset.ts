import crypto from "crypto";

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const createPasswordResetUrl = (token: string, frontendUrl: string): string => {
  return `${frontendUrl}/reset-password?token=${token}`;
};

export const getPasswordResetExpiryTime = (minutesFromNow: number = 60): Date => {
  const now = new Date();
  return new Date(now.getTime() + minutesFromNow * 60000);
};
