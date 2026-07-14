import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { FiInbox, FiSearch, FiChevronRight, FiMail, FiPhone, FiBriefcase } from "react-icons/fi";
import { useObtenerSocios } from "../../../hooks/useSocios";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
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
        <div className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
        <div className={styles.empresaInfo}>
          <div className={styles.skeletonBlock} style={{ height: "0.9rem", width: "70%" }} />
          <div className={styles.skeletonBlock} style={{ height: "0.7rem", width: "40%", marginTop: "0.4rem" }} />
        </div>
      </div>
    </td>
    <td>
      <div className={styles.skeletonBlock} style={{ height: "0.75rem", width: "65%" }} />
      <div className={styles.skeletonBlock} style={{ height: "0.75rem", width: "45%", marginTop: "0.45rem" }} />
    </td>
    <td><div className={`${styles.skeletonBlock} ${styles.skeletonPill}`} /></td>
    <td></td>
  </tr>
);

export default function Empresas() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [debouncedBusqueda] = useDebounce(busqueda, 400);
  const [pagina, setPagina] = useState(1);

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

  const empresas = useMemo(() => data || [], [data]);

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
                <th style={{ width: "38%" }}>Empresa</th>
                <th style={{ width: "36%" }}>Contacto</th>
                <th style={{ width: "18%" }}>Tipo</th>
                <th style={{ width: "2.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <EmpresaRowSkeleton key={i} />)
              ) : empresasPagina.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 0 }}>
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
    </div>
  );
}
