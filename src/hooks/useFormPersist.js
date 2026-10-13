import { useState, useEffect } from "react";

// Lo guardado en sessionStorage puede venir corrupto (escritura cortada, una
// versión vieja de la app, edición manual). Como estas lecturas corren en
// tiempo de render, un JSON.parse suelto tira la pantalla entera: ante
// cualquier basura se descarta la clave y se sigue con los valores por defecto.
const leerJsonGuardado = (clave, porDefecto) => {
  const guardado = sessionStorage.getItem(clave);
  if (!guardado) return porDefecto;
  try {
    const parsed = JSON.parse(guardado);
    return parsed ?? porDefecto;
  } catch {
    sessionStorage.removeItem(clave);
    return porDefecto;
  }
};

/**
 * Helper síncrono para inicializar React Hook Form sin que salten validaciones prematuras.
 * Se usa directamente en la propiedad `defaultValues` de `useForm`.
 */
export const getPersistedFormData = (storageKey, defaultValues) =>
  leerJsonGuardado(`${storageKey}_data`, defaultValues);

/**
 * Custom Hook para manejar la persistencia del paso, listas extra (como socios)
 * y la suscripción en tiempo real de React Hook Form.
 */
export const useFormPersist = ({ storageKey, watch }) => {
  const [pasoActual, setPasoActual] = useState(() => {
    const saved = Number(sessionStorage.getItem(`${storageKey}_paso`));
    return Number.isFinite(saved) && saved > 0 ? saved : 1;
  });

  const [listaExtra, setListaExtra] = useState(() => {
    const guardada = leerJsonGuardado(`${storageKey}_lista`, []);
    return Array.isArray(guardada) ? guardada : [];
  });

  useEffect(() => {
    sessionStorage.setItem(`${storageKey}_paso`, pasoActual.toString());
  }, [pasoActual, storageKey]);

  useEffect(() => {
    sessionStorage.setItem(`${storageKey}_lista`, JSON.stringify(listaExtra));
  }, [listaExtra, storageKey]);

  useEffect(() => {
    if (!watch) return;
    const subscription = watch((value) => {
      sessionStorage.setItem(`${storageKey}_data`, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch, storageKey]);

  const clearStorage = () => {
    sessionStorage.removeItem(`${storageKey}_data`);
    sessionStorage.removeItem(`${storageKey}_paso`);
    sessionStorage.removeItem(`${storageKey}_lista`);
  };

  return {
    pasoActual,
    setPasoActual,
    listaExtra,
    setListaExtra,
    clearStorage,
  };
};
