// Las respuestas de GET usuario/{id}/pornombre no tienen forma consistente
// según el backend haya matcheado por id, por nombre o por email - a veces
// viene el registro plano, a veces envuelto en {items:[...]} o {data:[...]}.
export const extraerRegistroUsuario = (db) => {
  if (!db) return null;
  if (Array.isArray(db)) return db[0] || null;
  if (db.items) return db.items[0] || null;
  if (db.data) return db.data[0] || null;
  return db;
};

// Nombre de usuario legible a partir del email, para precargar Denominacion
// al dar de alta la cuenta (el usuario puede cambiarlo después desde "Mi
// cuenta") - toma la parte antes del @ y reemplaza separadores comunes por
// espacios: "ramiro_gabriel@..." -> "ramiro gabriel".
export const denominacionDesdeEmail = (email) => {
  const local = String(email || "").split("@")[0] || "";
  return local
    .replace(/[._\-+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};
