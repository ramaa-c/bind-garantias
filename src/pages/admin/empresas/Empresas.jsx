import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { FiInbox, FiSearch, FiChevronRight } from "react-icons/fi";
import { useObtenerSocios } from "../../../hooks/useSocios";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import styles from "./Empresas.module.css";

const ELEMENTOS_POR_PAGINA = 10;

const getTipoPersonaLabel = (tipoPersonaId) => {
  const id = Number(tipoPersonaId);
  if (id === 1) return "Persona Física";
  if (id === 10) return "Persona Jurídica";
  return "-";
};

const EmpresaRowSkeleton = () => (
  <tr>
    <td><div className={styles.skeletonBlock} style={{ height: "0.85rem", width: "75%" }} /></td>
    <td><div className={styles.skeletonBlock} style={{ height: "0.85rem", width: "55%" }} /></td>
    <td><div className={styles.skeletonBlock} style={{ height: "0.85rem", width: "80%" }} /></td>
    <td><div className={styles.skeletonBlock} style={{ height: "0.85rem", width: "45%" }} /></td>
    <td><div className={styles.skeletonBlock} style={{ height: "0.85rem", width: "50%" }} /></td>
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
            {empresas.length} empresa{empresas.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Denominación</th>
                <th>CUIT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Tipo</th>
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
                empresasPagina.map((e, idx) => (
                  <tr
                    key={e.socioid || `${e.cuit}-${idx}`}
                    className={styles.clickableRow}
                    onClick={() => navigate(`/admin/empresas/${e.socioid}`)}
                  >
                    <td><strong>{e.denominacion || "-"}</strong></td>
                    <td>{e.cuit || "-"}</td>
                    <td>{e.email || "-"}</td>
                    <td>{e.telefono || "-"}</td>
                    <td>{getTipoPersonaLabel(e.tipopersonaid)}</td>
                    <td style={{ textAlign: "center" }}>
                      <FiChevronRight className={styles.rowChevron} />
                    </td>
                  </tr>
                ))
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
