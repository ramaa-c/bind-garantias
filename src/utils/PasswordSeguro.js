const strengthCache = {};

let zxcvbnFn = null;
let promesaZxcvbn = null;

export const precargarZxcvbn = () => {
  if (!promesaZxcvbn) {
    promesaZxcvbn = import("zxcvbn").then((modulo) => {
      zxcvbnFn = modulo.default;
      return zxcvbnFn;
    });
  }
  return promesaZxcvbn;
};

export const getPasswordScore = (password, email = "") => {
  if (!password) return 0;

  if (strengthCache[password] !== undefined) {
    return strengthCache[password];
  }

  if (!zxcvbnFn) {
    precargarZxcvbn();
    return 0;
  }

  const emailPrefix = email.split("@")[0].toLowerCase();
  const userInputs = email ? [email, emailPrefix] : [];

  const result = zxcvbnFn(password, userInputs);

  strengthCache[password] = result.score;

  return result.score;
};
