export const generateOtp = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const value = Math.floor(min + Math.random() * (max - min));
  return String(value);
};
