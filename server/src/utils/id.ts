import crypto from "crypto";

export const createId = (prefix: string) => {
  const rand = crypto.randomBytes(6).toString("hex");
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
};

export const createGroupId = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const length = 5;
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `GB-${code}`;
};
