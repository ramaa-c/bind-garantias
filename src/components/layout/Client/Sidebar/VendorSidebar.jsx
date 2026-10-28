import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiBriefcase, FiCheck, FiChevronDown, FiChevronRight, FiFileText, FiSearch, FiUsers } from "react-icons/fi";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useSolicitudesVendor } from "../../../../hooks/useEmpresasVendor";
import { ESTADO_PENDIENTE, esEstadoEnCurso } from "../../../../utils/estadoLimiteSocio";
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

const CANTIDAD_RECIENTES = 3;
const soloDigitos = (s) => String(s || "").replace(/\D/g, "");
const ES_ESCRITORIO = "(min-width: 64rem)";

// Recientes: las últimas empresas elegidas por este usuario, en este
// navegador (es solo un atajo: si no hay, se muestran las primeras A–Z).
const claveRecientes = (email) => `bind_vendor_recientes_${email || ""}`;
const leerRecientes = (email) => {
  try {
    const lista = JSON.parse(localStorage.getItem(claveRecientes(email)) || "[]");
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch {
    return [];
  }
};
const guardarReciente = (email, socioId) => {
  try {
    const lista = [String(socioId), ...leerRecientes(email).filter((id) => id !== String(socioId))].slice(0, 10);
    localStorage.setItem(claveRecientes(email), JSON.stringify(lista));
  } catch {
    // sin storage no hay recientes; no es un error
  }
};

const coincide = (empresa, texto) => {
  if (!texto) return true;
  const digitos = soloDigitos(texto);
  return empresa.nombre.toLowerCase().includes(texto) || (!!digitos && soloDigitos(empresa.cuit).includes(digitos));
};

function OpcionEmpresa({ empresa, activa, enCurso, mostrarCuit = true, onElegir }) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={activa}
        className={`${styles.opcion} ${activa ? styles.opcionActiva : ""}`}
        onClick={() => onElegir(empresa.socioId)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {obtenerInicialesEmpresa(empresa.nombre || "?")}
        </span>
        <span className={styles.opcionTexto}>
          <span className={styles.opcionNombre}>{empresa.nombre || "Cargando…"}</span>
          {mostrarCuit && empresa.cuit && <span className={styles.opcionCuit}>CUIT {empresa.cuit}</span>}
        </span>
        {enCurso && <span className={styles.enCurso}>En curso</span>}
        {activa && <FiCheck className={styles.check} aria-hidden="true" />}
      </button>
    </li>
  );
}

function Buscador({ valor, onCambiar }) {
  return (
    <label className={styles.buscador}>
      <FiSearch aria-hidden="true" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder="Buscar razón social o CUIT"
        aria-label="Buscar empresa"
        autoFocus
      />
    </label>
  );
}

// Selector de empresa del vendor, en dos modos según el contexto:
// - Sin empresa elegida (panel del vendor): "acotado". Se despliega dentro
//   del bloque pero siempre con el mismo alto (buscador + 3 empresas +
//   "Ver las N en Mis empresas"), haya 4 o 400.
// - Con una empresa elegida: "flotante". "Cambiar de empresa" abre un panel
//   que flota al lado del sidebar (en mobile, una hoja desde abajo) con
//   buscador y una sola lista (las recientes primero) con scroll propio: el sidebar
//   nunca se mueve.
// En el sidebar compacto (rail) el primer click lo expande (onExpandir).
export function SelectorEmpresaVendor({ empresas, socioIdActivo, empresaActiva, onElegir, compacto, onExpandir, onVerTodas }) {
  const email = useAuthStore((state) => state.user?.email);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [recientes, setRecientes] = useState([]);
  const [posicion, setPosicion] = useState(null);
  const contenedorRef = useRef(null);
  const disparadorRef = useRef(null);
  const flotanteRef = useRef(null);

  const hayActiva = !!socioIdActivo && !!empresaActiva?.nombre;
  const modo = hayActiva ? "flotante" : "acotado";

  // "En curso" solo se consulta con el selector abierto (comparte caché con
  // el panel del vendor).
  const { porEmpresa } = useSolicitudesVendor(abierto ? empresas : []);
  const conCurso = useMemo(() => {
    const ids = new Set();
    porEmpresa.forEach(({ empresa, solicitudes }) => {
      if (solicitudes.some((s) => esEstadoEnCurso(Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE)))) {
        ids.add(String(empresa.socioId));
      }
    });
    return ids;
  }, [porEmpresa]);

  const ordenadas = useMemo(() => {
    const posicionReciente = (e) => {
      const i = recientes.indexOf(String(e.socioId));
      return i === -1 ? Infinity : i;
    };
    return [...empresas].sort(
      (a, b) => posicionReciente(a) - posicionReciente(b) || a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [empresas, recientes]);
  const texto = busqueda.trim().toLowerCase();
  const filtradas = useMemo(() => ordenadas.filter((e) => coincide(e, texto)), [ordenadas, texto]);
  const hayRecientes = useMemo(
    () => empresas.some((e) => recientes.includes(String(e.socioId))),
    [recientes, empresas],
  );

  const cerrar = () => {
    setAbierto(false);
    setBusqueda("");
  };

  const ubicarFlotante = () => {
    const disparador = disparadorRef.current;
    if (!disparador || !window.matchMedia(ES_ESCRITORIO).matches) {
      setPosicion(null);
      return;
    }
    const r = disparador.getBoundingClientRect();
    // Al lado del sidebar (no del botón), para no taparlo.
    const borde = disparador.closest("aside")?.getBoundingClientRect().right ?? r.right;
    const alto = Math.min(30 * 16, window.innerHeight - 24);
    setPosicion({
      left: borde + 10,
      top: Math.max(12, Math.min(r.top - 8, window.innerHeight - alto - 12)),
      maxHeight: alto,
    });
  };

  const abrir = () => {
    setRecientes(leerRecientes(email));
    if (modo === "flotante") ubicarFlotante();
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return undefined;
    const alClickAfuera = (e) => {
      const dentro =
        contenedorRef.current?.contains(e.target) || flotanteRef.current?.contains(e.target);
      if (!dentro) cerrar();
    };
    const alEscape = (e) => e.key === "Escape" && cerrar();
    document.addEventListener("mousedown", alClickAfuera);
    document.addEventListener("keydown", alEscape);
    // El flotante se ubica respecto del disparador: si cambia el tamaño de
    // la ventana se cierra en vez de quedar desfasado.
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", alClickAfuera);
      document.removeEventListener("keydown", alEscape);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto]);

  const elegir = (socioId) => {
    if (socioId) guardarReciente(email, socioId);
    cerrar();
    onElegir(socioId);
  };

  const alClickDisparador = () => {
    if (compacto) {
      onExpandir?.();
      setRecientes(leerRecientes(email));
      setAbierto(true);
      return;
    }
    if (abierto) cerrar();
    else abrir();
  };

  /* — modo acotado: siempre 3 lugares — */
  const acotadas = filtradas.slice(0, CANTIDAD_RECIENTES);
  const tituloAcotado = texto
    ? `${filtradas.length} ${filtradas.length === 1 ? "resultado" : "resultados"}`
    : hayRecientes
      ? "Recientes"
      : "Empresas";

  /* — modo flotante — */

  const contenidoFlotante = (
    <>
      {!posicion && <strong className={styles.hojaTitulo}>Cambiar de empresa</strong>}
      <Buscador valor={busqueda} onCambiar={setBusqueda} />
      <div className={`${styles.flotanteLista} scroll-visible`}>
        <p className={styles.cap}>
          {texto ? `Resultados (${filtradas.length})` : hayRecientes ? "Más recientes primero" : `Todas (${empresas.length})`}
        </p>
        <ul className={styles.lista} role="listbox" aria-label="Empresas">
          {filtradas.map((e) => (
            <OpcionEmpresa
              key={e.socioId}
              empresa={e}
              activa={String(e.socioId) === String(socioIdActivo)}
              enCurso={conCurso.has(String(e.socioId))}
              onElegir={elegir}
            />
          ))}
          {filtradas.length === 0 && <li className={styles.sinResultados}>No encontramos esa empresa.</li>}
        </ul>
      </div>
      <div className={styles.flotantePie}>
        <button type="button" className={styles.link} onClick={() => elegir(null)}>
          <FiBriefcase aria-hidden="true" /> Todas mis empresas
        </button>
        <span>{empresas.length} en total</span>
      </div>
    </>
  );

  return (
    <div className={`${styles.selector} ${compacto ? styles.compacto : ""}`} ref={contenedorRef}>
      <button
        ref={disparadorRef}
        type="button"
        className={`${styles.disparador} ${hayActiva ? styles.disparadorEmpresa : ""} ${abierto ? styles.disparadorAbierto : ""}`}
        onClick={alClickDisparador}
        aria-expanded={abierto}
        aria-haspopup="listbox"
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
              Cambiar de empresa <FiChevronRight aria-hidden="true" />
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

      {abierto && modo === "acotado" && (
        <div className={styles.acotado}>
          {empresas.length > CANTIDAD_RECIENTES && <Buscador valor={busqueda} onCambiar={setBusqueda} />}
          <p className={styles.cap}>{tituloAcotado}</p>
          <ul className={styles.lista} role="listbox" aria-label="Empresas">
            {acotadas.map((e) => (
              <OpcionEmpresa
                key={e.socioId}
                empresa={e}
                activa={false}
                enCurso={conCurso.has(String(e.socioId))}
                mostrarCuit={false}
                onElegir={elegir}
              />
            ))}
            {acotadas.length === 0 && <li className={styles.sinResultados}>No encontramos esa empresa.</li>}
          </ul>
          {onVerTodas && empresas.length > CANTIDAD_RECIENTES && (
            <button
              type="button"
              className={styles.verTodas}
              onClick={() => {
                cerrar();
                onVerTodas();
              }}
            >
              Ver las {empresas.length} en Mis empresas <FiChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {abierto &&
        modo === "flotante" &&
        createPortal(
          <>
            {!posicion && <div className={styles.hojaFondo} onClick={cerrar} aria-hidden="true" />}
            <div
              ref={flotanteRef}
              className={posicion ? styles.flotante : styles.hoja}
              style={posicion ? { left: posicion.left, top: posicion.top, maxHeight: posicion.maxHeight } : undefined}
              role="dialog"
              aria-label="Cambiar de empresa"
            >
              {contenidoFlotante}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

const VISTAS_VENDOR = [
  { clave: "solicitudes", label: "Todas las solicitudes", icono: <FiFileText /> },
  { clave: "empresas", label: "Mis empresas", icono: <FiUsers /> },
];

// Bloque del vendor (en azul, separado de la navegación de la empresa):
// identidad, selector de empresa y las dos vistas de su panel. Las vistas
// se ven siempre; con una empresa elegida, entrar a una vuelve a "Todas".
export function PanelVendor({
  nombre,
  canal,
  empresas,
  socioIdActivo,
  empresaActiva,
  vistaActiva,
  onElegir,
  onIrVista,
  compacto,
  onExpandir,
}) {
  return (
    <section className={`${styles.grupo} ${compacto ? styles.compacto : ""}`} aria-label="Panel vendor">
      <TarjetaVendor nombre={nombre} canal={canal} compacto={compacto} />
      <SelectorEmpresaVendor
        empresas={empresas}
        socioIdActivo={socioIdActivo}
        empresaActiva={empresaActiva}
        onElegir={onElegir}
        compacto={compacto}
        onExpandir={onExpandir}
        onVerTodas={() => onIrVista("empresas")}
      />
      <ul className={styles.vistas}>
        {VISTAS_VENDOR.map(({ clave, label, icono }) => {
          const activa = vistaActiva === clave;
          return (
            <li key={clave}>
              <button
                type="button"
                className={`${styles.vista} ${activa ? styles.vistaActiva : ""}`}
                onClick={() => onIrVista(clave)}
                aria-current={activa ? "page" : undefined}
                title={label}
              >
                <span className={styles.vistaIcono} aria-hidden="true">
                  {icono}
                </span>
                <span className={styles.vistaLabel}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
