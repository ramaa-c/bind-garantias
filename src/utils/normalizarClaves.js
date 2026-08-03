// Construye un mapa de las claves de `data` normalizadas a minúsculas.
// Esto permite leer un campo sin importar en qué casing haya llegado
// (camelCase, PascalCase, o todo en minúsculas como devuelve el
// interceptor de axios), evitando tener que adivinar variantes campo por
// campo en cada adapter.
export const normalizarClaves = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const normalizado = {};
  for (const key of Object.keys(data)) {
    normalizado[key.toLowerCase()] = data[key];
  }
  return normalizado;
};
