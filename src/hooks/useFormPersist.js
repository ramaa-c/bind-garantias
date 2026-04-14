import { useState, useEffect } from "react";

/**
 * Helper síncrono para inicializar React Hook Form sin que salten validaciones prematuras.
 * Se usa directamente en la propiedad `defaultValues` de `useForm`.
 */
export const getPersistedFormData = (storageKey, defaultValues) => {
  const saved = sessionStorage.getItem(`${storageKey}_data`);
  return saved ? JSON.parse(saved) : defaultValues;
};

/**
 * Custom Hook para manejar la persistencia del paso, listas extra (como socios)
 * y la suscripción en tiempo real de React Hook Form.
 */
export const useFormPersist = ({ storageKey, watch }) => {
  const [pasoActual, setPasoActual] = useState(() => {
    const saved = sessionStorage.getItem(`${storageKey}_paso`);
    return saved ? Number(saved) : 1;
  });

  const [listaExtra, setListaExtra] = useState(() => {
    const saved = sessionStorage.getItem(`${storageKey}_lista`);
    return saved ? JSON.parse(saved) : [];
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
