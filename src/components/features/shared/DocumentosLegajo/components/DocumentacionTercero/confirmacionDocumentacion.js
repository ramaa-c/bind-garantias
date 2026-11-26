// Confirmación de guardado cuando falta documentación obligatoria (modales
// de terceros con pestañas). En vez de sumar un paso, reemplaza al "¿Estás
// seguro?" que esas modales ya mostraban antes de guardar: no se bloquea el
// guardado (los datos se pueden cargar ahora y la documentación después, o
// la puede subir otra persona), pero queda claro qué falta y se ofrece
// cargarla en ese momento sin perder lo escrito.
const unir = (lista) =>
  lista.length <= 1 ? lista.join("") : `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`;

export const propsConfirmacionSinDocumentacion = ({ faltantes, onCargarAhora }) => ({
  titulo: "Falta documentación",
  mensaje: `Se van a guardar los datos, pero falta cargar: ${unir(faltantes)}. Podés hacerlo ahora o más tarde desde Editar.`,
  tone: "warning",
  confirmText: "Guardar sin documentación",
  cancelText: "Cargar ahora",
  onClose: onCargarAhora,
  // Más ancha que la confirmación de siempre (420px): con los dos textos
  // largos el segundo botón bajaba a otra fila.
  maxWidth: "31rem",
});
