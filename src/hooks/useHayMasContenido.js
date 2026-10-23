import { useEffect, useState } from "react";

// true mientras el contenedor scrolleable tenga contenido por debajo de lo
// visible. Se recalcula al scrollear, al cambiar el tamaño del contenedor o
// de sus hijos y cuando cambia el contenido (listas que cargan después, un
// acordeón que se abre, etc.), agrupado en un solo cálculo por frame.
export function useHayMasContenido(ref, umbral = 24) {
  const [hayMas, setHayMas] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let frame = 0;
    const medir = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setHayMas(el.scrollHeight - el.scrollTop - el.clientHeight > umbral);
      });
    };

    const ro = new ResizeObserver(medir);
    const observarHijos = () => Array.from(el.children).forEach((hijo) => ro.observe(hijo));
    ro.observe(el);
    observarHijos();

    const mo = new MutationObserver(() => {
      observarHijos();
      medir();
    });
    mo.observe(el, { childList: true, subtree: true });

    el.addEventListener("scroll", medir, { passive: true });
    medir();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", medir);
      ro.disconnect();
      mo.disconnect();
    };
  }, [ref, umbral]);

  return hayMas;
}
