const CLAVE = "bInD-sGr+ApI";

const USUARIO_CODIFICADO = "NzoLNnI1NR1FNQ==";
const CLAVE_CODIFICADA = "NnxZbmdbMhwdc1M5";

const decodificar = (valor) =>
  Array.from(atob(valor), (caracter, indice) =>
    String.fromCharCode(
      caracter.charCodeAt(0) ^ CLAVE.charCodeAt(indice % CLAVE.length),
    ),
  ).join("");

export const obtenerCredencialesApi = () => ({
  usuario: decodificar(USUARIO_CODIFICADO),
  clave: decodificar(CLAVE_CODIFICADA),
});
