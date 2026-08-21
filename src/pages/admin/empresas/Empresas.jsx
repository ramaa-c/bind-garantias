import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { FiInbox, FiSearch, FiX, FiChevronRight, FiMail, FiPhone, FiBriefcase, FiCheckCircle, FiLink, FiActivity } from "react-icons/fi";
import { useObtenerSocios, useObtenerExecuteCda, useEstaMigradoEnSgrPlus, useMigracionSgrPlusDeSocios } from "../../../hooks/useSocios";
import { useObtenerTodasWebConEstado } from "../../../hooks/useCadenaValor";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { SelectSimple } from "../../../components/ui";
import { ActividadSocioModal } from "../../../components/features/admin/ActividadSocioModal/ActividadSocioModal";
import { detectarCadenaValorId } from "../../../utils/executeCda";
import styles from "./Empresas.module.css";

// Filas más altas que antes (avatar + contacto en dos líneas): con 10
// se generaba scroll de página en full HD, por eso se bajó a 8.
const ELEMENTOS_POR_PAGINA = 8;

const TIPO_PERSONA = {
  1: { label: "Persona Física", tono: "fisica" },
  10: { label: "Persona Jurídica", tono: "juridica" },
};

const getTipoPersona = (tipoPersonaId) =>
  TIPO_PERSONA[Number(tipoPersonaId)] || { label: "Sin definir", tono: "indefinido" };

const FILTROS_POR_DEFECTO = {
  tipoPersona: "todos",
  estado: "todos",
  orden: "recientes",
};

const OPCIONES_TIPO_PERSONA = [
  { value: "todos", label: "Todos los tipos" },
  { value: "fisica", label: "Persona Física" },
  { value: "juridica", label: "Persona Jurídica" },
];

const OPCIONES_ESTADO = [
  { value: "todos", label: "Todos los estados" },
  { value: "migrado", label: "Migrado a SGR+" },
  { value: "postulante", label: "Postulante" },
];

const OPCIONES_ORDEN = [
  { value: "recientes", label: "Más recientes" },
  { value: "antiguas", label: "Más antiguas" },
  { value: "az", label: "Nombre A-Z" },
  { value: "za", label: "Nombre Z-A" },
];

const getIniciales = (denominacion) => {
  if (!denominacion) return "?";
  const palabras = denominacion.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

const EmpresaRowSkeleton = () => (
  <tr>
    <td>
      <div className={styles.empresaCell}>
        <Skeleton width="2.35rem" height="2.35rem" radius="50%" />
        <div className={styles.empresaInfo}>
          <Skeleton height="0.9rem" width="70%" />
          <Skeleton height="0.7rem" width="40%" style={{ marginTop: "0.4rem" }} />
        </div>
      </div>
    </td>
    <td>
      <Skeleton height="0.75rem" width="65%" />
      <Skeleton height="0.75rem" width="45%" style={{ marginTop: "0.45rem" }} />
    </td>
    <td><Skeleton width="5.5rem" height="1.4rem" radius="pill" /></td>
    <td><Skeleton width="5.5rem" height="1.4rem" radius="pill" /></td>
    <td></td>
    <td></td>
  </tr>
);

const EstadoBadge = ({ e, cadenasWeb }) => {
  // Mismo criterio que EmpresaDetalle.jsx: sin esto, useValidacionLegajo
  // nunca resuelve la cadena real de la empresa y cae al fallback genérico
  // de useRequisitos (DEFAULT_SA_CONFIG/etc.), dando un total de requisitos
  // distinto (y potencialmente incorrecto) al que se ve en el detalle.
  const { data: ejecucionesCda } = useObtenerExecuteCda(e.socioid);
  const cadenaValorIdDetectada = useMemo(
    () => detectarCadenaValorId(ejecucionesCda),
    [ejecucionesCda],
  );

  // Como Socio no tiene un CadenaValorID propio, el mismo CUIT puede
  // ingresar por el slug de cualquier cadena y ver requisitos distintos a
  // los de la cadena por la que efectivamente hizo su alta. Se muestra a
  // qué cadena corresponde el estado de este badge para no confundir "no
  // migrado acá" con "no migrado en ningún lado" (ver EmpresaDetalle.jsx).
  const nombreCadenaDetectada = useMemo(() => {
    if (!cadenaValorIdDetectada) return null;
    const fila = (cadenasWeb || []).find(
      (c) => Number(c.cadenavalorid) === cadenaValorIdDetectada,
    );
    return fila?.denominacion || `Cadena #${cadenaValorIdDetectada}`;
  }, [cadenasWeb, cadenaValorIdDetectada]);

  // Confirmación real de migración: si el CUIT aparece en sgrplus/Socios es
  // porque efectivamente vive en el core. Antes acá "Migrado" también se
  // daba por tener el legajo 100% completo en la web (requisitosCompletados
  // === totalRequisitos, vía useValidacionLegajo) sin haber migrado nunca —
  // confirmado en vivo (2026-08-11): un socio con el legajo completo pero
  // cuya migración había fallado con 500 igual aparecía como "Migrado" acá.
  // Vuelve a resolverse por fila (useEstaMigradoEnSgrPlus/Cuit): el intento
  // de traer esto en bloque (sgrplus/Socios sin Cuit) para el filtro de
  // Estado rompió los badges — hay que confirmar primero contra el backend
  // real qué devuelve esa consulta sin filtro antes de reusarla acá.
  const { data: migradoEnSgrPlus, isLoading: isLoadingMigracion } = useEstaMigradoEnSgrPlus(e.cuit);
  const isMigrado = Number(e.legajo) > 0 || !!migradoEnSgrPlus;

  if (isLoadingMigracion && Number(e.legajo) === 0) {
    return (
      <span className={`${styles.estadoBadge} ${styles.estadoAzulBind}`} style={{ opacity: 0.6 }}>
        ...
      </span>
    );
  }

  return (
    <div className={styles.estadoCell}>
      {isMigrado ? (
        <span className={`${styles.estadoBadge} ${styles.estadoSuccess}`}>
          <FiCheckCircle size={12} /> Migrado
        </span>
      ) : (
        <span className={`${styles.estadoBadge} ${styles.estadoAzulBind}`}>
          Postulante
        </span>
      )}
      {nombreCadenaDetectada && (
        <span className={styles.cadenaChip} title={nombreCadenaDetectada}>
          <FiLink size={10} /> {nombreCadenaDetectada}
        </span>
      )}
    </div>
  );
};

export default function Empresas() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [debouncedBusqueda] = useDebounce(busqueda, 400);
  const [tipoPersona, setTipoPersona] = useState(FILTROS_POR_DEFECTO.tipoPersona);
  const [estado, setEstado] = useState(FILTROS_POR_DEFECTO.estado);
  const [orden, setOrden] = useState(FILTROS_POR_DEFECTO.orden);
  const [pagina, setPagina] = useState(1);
  const [empresaActividad, setEmpresaActividad] = useState(null);

  // El backend solo permite filtrar la lista de socios por Cuit o por
  // Denominacion (nunca ambos a la vez: el Cuit es único, así que combinarlos
  // no tendría sentido). Se manda uno u otro según el aspecto del término.
  const params = useMemo(() => {
    const term = debouncedBusqueda.trim();
    if (!term) return {};

    const esCuit = /^[\d.\-\s]+$/.test(term);
    if (esCuit) {
      return { Cuit: term.replace(/\D/g, "") };
    }
    return { Denominacion: term };
  }, [debouncedBusqueda]);

  const { data, isLoading, isFetching } = useObtenerSocios(params);
  const { data: cadenasWeb } = useObtenerTodasWebConEstado();
  // Confirmación real de migración, una consulta por CUIT (igual que el
  // badge de cada fila) pero solo se prende cuando el filtro de Estado
  // realmente está en uso — ver useMigracionSgrPlusDeSocios.
  const estadoFiltroActivo = estado !== FILTROS_POR_DEFECTO.estado;
  const { migradosSet: migradosSgrPlus } = useMigracionSgrPlusDeSocios(data, estadoFiltroActivo);

  const empresas = useMemo(() => {
    let lista = [...(data || [])];

    if (tipoPersona !== FILTROS_POR_DEFECTO.tipoPersona) {
      lista = lista.filter((e) => getTipoPersona(e.tipopersonaid).tono === tipoPersona);
    }

    if (estado !== FILTROS_POR_DEFECTO.estado) {
      lista = lista.filter((e) => {
        const cuitLimpio = String(e.cuit || "").replace(/\D/g, "");
        const migrado = Number(e.legajo) > 0 || !!migradosSgrPlus?.has(cuitLimpio);
        return estado === "migrado" ? migrado : !migrado;
      });
    }

    lista.sort((a, b) => {
      if (orden === "az") return (a.denominacion || "").localeCompare(b.denominacion || "");
      if (orden === "za") return (b.denominacion || "").localeCompare(a.denominacion || "");
      if (orden === "antiguas") return Number(a.socioid) - Number(b.socioid);
      return Number(b.socioid) - Number(a.socioid); // recientes (default): el backend no garantiza orden
    });

    return lista;
  }, [data, tipoPersona, estado, orden, migradosSgrPlus]);

  const totalPaginas = Math.max(1, Math.ceil(empresas.length / ELEMENTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const empresasPagina = empresas.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA
  );

  const handleBusqueda = (value) => {
    setBusqueda(value);
    setPagina(1);
  };

  const handleTipoPersona = (value) => {
    setTipoPersona(value);
    setPagina(1);
  };

  const handleEstado = (value) => {
    setEstado(value);
    setPagina(1);
  };

  const handleOrden = (value) => {
    setOrden(value);
    setPagina(1);
  };

  const hayFiltrosActivos =
    !!busqueda ||
    tipoPersona !== FILTROS_POR_DEFECTO.tipoPersona ||
    estado !== FILTROS_POR_DEFECTO.estado ||
    orden !== FILTROS_POR_DEFECTO.orden;

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setTipoPersona(FILTROS_POR_DEFECTO.tipoPersona);
    setEstado(FILTROS_POR_DEFECTO.estado);
    setOrden(FILTROS_POR_DEFECTO.orden);
    setPagina(1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerTitle}>
        <div>
          <h1>Empresas</h1>
          <p>Listado de empresas registradas en la plataforma.</p>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por CUIT o Denominación..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            className={styles.inputSearch}
          />
        </div>

        <div className={styles.filterFieldsRow}>
          <SelectSimple
            label="Tipo"
            value={tipoPersona}
            onChange={handleTipoPersona}
            options={OPCIONES_TIPO_PERSONA}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
          <SelectSimple
            label="Estado"
            value={estado}
            onChange={handleEstado}
            options={OPCIONES_ESTADO}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
          <SelectSimple
            label="Orden"
            value={orden}
            onChange={handleOrden}
            options={OPCIONES_ORDEN}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
        </div>

        <button
          type="button"
          className={`${styles.clearFiltersBtn} ${hayFiltrosActivos ? styles.clearFiltersBtnVisible : ""}`}
          onClick={handleLimpiarFiltros}
          disabled={!hayFiltrosActivos}
          tabIndex={hayFiltrosActivos ? 0 : -1}
          title="Limpiar filtros"
          aria-label="Limpiar filtros"
        >
          <FiX />
        </button>

        {!isLoading && (
          <span className={styles.listCount}>
            <FiBriefcase />
            {empresas.length} empresa{empresas.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "36%" }}>Empresa</th>
                <th style={{ width: "30%" }}>Contacto</th>
                <th style={{ width: "13%" }}>Tipo</th>
                <th style={{ width: "13%" }}>Estado</th>
                <th style={{ width: "2.5rem" }}></th>
                <th style={{ width: "2.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <EmpresaRowSkeleton key={i} />)
              ) : empresasPagina.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <div className={styles.emptyState}>
                      <FiInbox className={styles.emptyStateIcon} />
                      <span>No se encontraron empresas que coincidan con los criterios de búsqueda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                empresasPagina.map((e, idx) => {
                  const tipo = getTipoPersona(e.tipopersonaid);
                  return (
                    <tr
                      key={e.socioid || `${e.cuit}-${idx}`}
                      className={styles.clickableRow}
                      onClick={() => navigate(`/admin/empresas/${e.socioid}`)}
                    >
                      <td>
                        <div className={styles.empresaCell}>
                          <div className={styles.avatar}>{getIniciales(e.denominacion)}</div>
                          <div className={styles.empresaInfo}>
                            <span className={styles.denominacion}>{e.denominacion || "-"}</span>
                            <span className={styles.cuit}>CUIT {e.cuit || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contactoCell}>
                          <span className={styles.contactoLinea}>
                            <FiMail className={styles.contactoIcon} />
                            <span className={styles.contactoTexto}>{e.email || "-"}</span>
                          </span>
                          <span className={styles.contactoLinea}>
                            <FiPhone className={styles.contactoIcon} />
                            <span className={styles.contactoTexto}>{e.telefono || "-"}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.tipoBadge} ${styles[`tipo-${tipo.tono}`]}`}>
                          {tipo.label}
                        </span>
                      </td>
                      <td>
                        <EstadoBadge e={e} cadenasWeb={cadenasWeb} />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className={styles.activityButton}
                          title="Ver actividad"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEmpresaActividad(e);
                          }}
                        >
                          <FiActivity size={14} />
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <FiChevronRight className={styles.rowChevron} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && empresas.length > 0 && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPagina}
          hasMoreData={paginaActual < totalPaginas}
          isLoading={isFetching}
          knownEndPage={totalPaginas}
          variant="admin"
          totalItems={empresas.length}
          pageSize={ELEMENTOS_POR_PAGINA}
          itemLabel="empresas"
        />
      )}

      <ActividadSocioModal
        isOpen={!!empresaActividad}
        onClose={() => setEmpresaActividad(null)}
        cuit={empresaActividad?.cuit}
        denominacion={empresaActividad?.denominacion}
      />
    </div>
  );
}
