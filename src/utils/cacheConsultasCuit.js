const VIGENCIA_MS = 30 * 60 * 1000;

const cache = new Map();

export const esLimiteDeConsultas = (error) => error?.response?.status === 429;

export const conCacheCuit = (fuente, cuit, consulta) => {
  const clave = `${fuente}:${String(cuit).replace(/\D/g, "")}`;
  const guardado = cache.get(clave);
  if (guardado && guardado.vence > Date.now()) return guardado.promesa;

  const promesa = consulta().catch((error) => {
    cache.delete(clave);
    throw error;
  });
  cache.set(clave, { promesa, vence: Date.now() + VIGENCIA_MS });
  return promesa;
};

export const limpiarCacheConsultasCuit = () => cache.clear();
