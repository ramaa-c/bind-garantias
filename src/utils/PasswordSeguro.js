import zxcvbn from "zxcvbn";

const strengthCache = {};

export const getPasswordScore = (password, email = "") => {
  if (!password) return 0;

  if (strengthCache[password] !== undefined) {
    return strengthCache[password];
  }

  const emailPrefix = email.split("@")[0].toLowerCase();
  const userInputs = email ? [email, emailPrefix] : [];

  const result = zxcvbn(password, userInputs);

  strengthCache[password] = result.score;

  return result.score;
};
