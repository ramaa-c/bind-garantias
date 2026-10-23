import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiBriefcase, FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";
import styles from "./VendorSidebar.module.css";

// Identidad del vendor: solo informativa (la cuenta se maneja desde el menú
// del usuario en el navbar).
export function TarjetaVendor({ nombre, canal, compacto }) {
  return (
    <div className={`${styles.tarjeta} ${compacto ? styles.compacto : ""}`} title={nombre}>
      <span className={styles.tarjetaAvatar} aria-hidden="true">
        {obtenerInicialesEmpresa(nombre.split("@")[0])}
      </span>
      <div className={styles.tarjetaTexto}>
        <p className={styles.tarjetaNombre} title={nombre}>{nombre}</p>
        <p className={styles.tarjetaRol}>Vendor{canal ? ` · ${canal}` : ""}</p>
      </div>
    </div>
  );
}

const MINIMO_PARA_BUSCAR = 6;
const soloDigitos = (s) => String(s || "").replace(/\D/g, "");

// Selector de empresa siempre visible. Se despliega dentro del propio sidebar
// (no flota): así no lo recorta el scroll del cuerpo ni el zoom del marco en
// Rango 2, y en mobile funciona igual dentro del drawer.
// En el sidebar compacto (rail) no entra la lista: el primer click lo
// expande (onExpandir) y abre el selector.
export function SelectorEmpresaVendor({ empresas, socioIdActivo, empresaActiva, onElegir, compacto, onExpandir }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const alClickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    const alEscape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClickAfuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("mousedown", alClickAfuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const ordenadas = [...empresas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    if (!texto) return ordenadas;
    const digitos = soloDigitos(texto);
    return ordenadas.filter(
      (e) => e.nombre.toLowerCase().includes(texto) || (digitos && soloDigitos(e.cuit).includes(digitos)),
    );
  }, [empresas, busqueda]);

  const elegir = (socioId) => {
    setAbierto(false);
    setBusqueda("");
    onElegir(socioId);
  };

  const hayActiva = !!socioIdActivo && !!empresaActiva?.nombre;

  return (
    <div className={`${styles.selector} ${compacto ? styles.compacto : ""}`} ref={contenedorRef}>
      <button
        type="button"
        className={`${styles.disparador} ${hayActiva ? styles.disparadorEmpresa : ""} ${abierto ? styles.disparadorAbierto : ""}`}
        onClick={() => {
          if (compacto) {
            onExpandir?.();
            setAbierto(true);
            return;
          }
          setAbierto((a) => !a);
        }}
        aria-expanded={abierto}
        aria-label={hayActiva ? `Empresa: ${empresaActiva.nombre}. Cambiar de empresa` : "Elegir empresa"}
        title={hayActiva ? empresaActiva.nombre : "Todas mis empresas"}
      >
        {hayActiva ? (
          <>
            <span className={styles.avatar} aria-hidden="true">
              {obtenerInicialesEmpresa(empresaActiva.nombre)}
            </span>
            <span className={styles.disparadorTexto}>
              <span className={styles.disparadorNombre}>{empresaActiva.nombre}</span>
              {empresaActiva.cuit && <span className={styles.disparadorCuit}>CUIT {empresaActiva.cuit}</span>}
            </span>
            <span className={styles.cambiar}>
              Cambiar de empresa <FiChevronDown aria-hidden="true" />
            </span>
          </>
        ) : (
          <>
            <FiBriefcase className={styles.iconoTodas} aria-hidden="true" />
            <span className={styles.disparadorTexto}>
              <span className={styles.disparadorFila}>
                <span className={styles.etiqueta}>Empresa:</span> Todas
              </span>
            </span>
            <FiChevronDown className={styles.chevron} aria-hidden="true" />
          </>
        )}
      </button>

      {abierto && (
        <div className={styles.panel}>
          {empresas.length >= MINIMO_PARA_BUSCAR && (
            <label className={styles.buscador}>
              <FiSearch aria-hidden="true" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Razón social o CUIT"
                aria-label="Buscar empresa"
                autoFocus
              />
            </label>
          )}
          <ul className={`${styles.lista} scroll-visible`} role="listbox" aria-label="Empresas">
            {!busqueda && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!socioIdActivo}
                  className={`${styles.opcion} ${!socioIdActivo ? styles.opcionActiva : ""}`}
                  onClick={() => elegir(null)}
                >
                  <span className={`${styles.avatar} ${styles.avatarTodas}`} aria-hidden="true">
                    <FiBriefcase />
                  </span>
                  <span className={styles.opcionTexto}>
                    <span className={styles.opcionNombre}>Todas mis empresas</span>
                    <span className={styles.opcionCuit}>
                      {empresas.length} {empresas.length === 1 ? "vinculada" : "vinculadas"}
                    </span>
                  </span>
                  {!socioIdActivo && <FiCheck className={styles.check} aria-hidden="true" />}
                </button>
              </li>
            )}
            {filtradas.map((e) => {
              const activa = String(e.socioId) === String(socioIdActivo);
              return (
                <li key={e.socioId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activa}
                    className={`${styles.opcion} ${activa ? styles.opcionActiva : ""}`}
                    onClick={() => elegir(e.socioId)}
                  >
                    <span className={styles.avatar} aria-hidden="true">
                      {obtenerInicialesEmpresa(e.nombre || "?")}
                    </span>
                    <span className={styles.opcionTexto}>
                      <span className={styles.opcionNombre}>{e.nombre || "Cargando…"}</span>
                      {e.cuit && <span className={styles.opcionCuit}>CUIT {e.cuit}</span>}
                    </span>
                    {activa && <FiCheck className={styles.check} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
            {filtradas.length === 0 && <li className={styles.sinResultados}>No encontramos esa empresa.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
