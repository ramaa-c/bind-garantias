import { useCallback, useEffect, useRef, useState } from "react";

const RANGO_2 = "(max-width: 1440px), (max-height: 716px)";
const MARGEN_SEGURIDAD_PX = 2;

export function useFilasPorPagina(
  contenedorRef,
  listaRef,
  { porDefecto = 8, minimo = 4, maximo = 30 } = {},
) {
  const [filas, setFilas] = useState(porDefecto);
  const rango2Ref = useRef(null);

  const calcular = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!rango2Ref.current) rango2Ref.current = window.matchMedia(RANGO_2);
    if (rango2Ref.current.matches) {
      setFilas(porDefecto);
      return;
    }

    const contenedor = contenedorRef.current;
    const lista = listaRef.current;
    if (!contenedor || !lista) return;

    const items = lista.querySelectorAll("[data-fila]");
    if (items.length === 0) return;

    const primera = items[0].getBoundingClientRect();
    const ultima = items[items.length - 1].getBoundingClientRect();
    const paso =
      items.length >= 2 ? items[1].getBoundingClientRect().top - primera.top : primera.height;
    if (paso <= 0) return;

    const estiloContenedor = getComputedStyle(contenedor);
    const fondoContenedor =
      contenedor.getBoundingClientRect().bottom -
      parseFloat(estiloContenedor.paddingBottom) -
      parseFloat(estiloContenedor.borderBottomWidth);
    let fondoContenido = 0;
    for (const hijo of contenedor.children) {
      const estilo = getComputedStyle(hijo);
      if (estilo.position === "fixed" || estilo.position === "absolute") continue;
      fondoContenido = Math.max(
        fondoContenido,
        hijo.getBoundingClientRect().bottom + parseFloat(estilo.marginBottom || 0),
      );
    }
    const libre = Math.max(0, fondoContenedor - fondoContenido);

    const disponible = lista.clientHeight + libre - MARGEN_SEGURIDAD_PX;
    const sobrante = lista.scrollHeight - (ultima.bottom - primera.top);
    const entran = Math.floor((disponible - sobrante - primera.height) / paso) + 1;

    setFilas(Math.min(maximo, Math.max(minimo, entran)));
  }, [contenedorRef, listaRef, porDefecto, minimo, maximo]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    const lista = listaRef.current;
    if (!contenedor || !lista || typeof window === "undefined") return;

    const observadorTamano = new ResizeObserver(() => calcular());
    observadorTamano.observe(contenedor);
    observadorTamano.observe(lista);

    const observadorFilas = new MutationObserver(() => calcular());
    observadorFilas.observe(lista, { childList: true, subtree: true });

    const rango2 = window.matchMedia(RANGO_2);
    rango2.addEventListener("change", calcular);
    contenedor.addEventListener("transitionend", calcular);
    window.addEventListener("resize", calcular);

    return () => {
      observadorTamano.disconnect();
      observadorFilas.disconnect();
      rango2.removeEventListener("change", calcular);
      contenedor.removeEventListener("transitionend", calcular);
      window.removeEventListener("resize", calcular);
    };
  }, [calcular, contenedorRef, listaRef]);

  return filas;
}
