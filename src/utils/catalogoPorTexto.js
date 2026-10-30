export const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();

// Busca en `opciones` ({ value, label }, catalogo ya filtrado, ej. ciudades de
// una sola provincia) la entrada cuyo label matchea `texto` - exacto primero, y
// si no hay, por inclusion en cualquier direccion (nombres de AFIP/Nosis/LUFE a
// veces vienen truncados o con variantes menores).
export const buscarPorTexto = (texto, opciones) => {
  const normTexto = normalizarTexto(texto);
  if (!normTexto) return undefined;
  const exacto = opciones.find((o) => normalizarTexto(o.label) === normTexto);
  if (exacto) return exacto;
  return opciones.find(
    (o) =>
      normalizarTexto(o.label).includes(normTexto) ||
      normTexto.includes(normalizarTexto(o.label)),
  );
};
