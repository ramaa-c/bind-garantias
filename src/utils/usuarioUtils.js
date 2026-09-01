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
