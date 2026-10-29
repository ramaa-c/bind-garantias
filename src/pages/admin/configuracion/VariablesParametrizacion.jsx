import React, { useState } from "react";
import { FiPlus, FiEdit2, FiSearch, FiInbox } from "react-icons/fi";
import { Button, InfoTooltip, Skeleton } from "../../../components/ui";
import { VariableParametrizacionModal } from "../../../components/features/admin/VariableParametrizacionModal/VariableParametrizacionModal";
import { useVariablesParametrizacion } from "../../../hooks/useVariablesParametrizacion";
import styles from "./VariablesParametrizacion.module.css";
import l from "../../../components/features/admin/ListadoAdmin/ListadoAdmin.module.css";

const RowSkeleton = () => (
  <tr>
    <td><Skeleton width="60%" height="0.9rem" /></td>
    <td><Skeleton width="30%" height="0.85rem" /></td>
    <td style={{ textAlign: "center" }}>
      <Skeleton width="28px" height="28px" radius="0.4rem" style={{ margin: "0 auto" }} />
    </td>
  </tr>
);

// ABM de las variables de configuración de la plataforma
// (api/VariablesParametrizacion, ticket SGRPLUSPLA-100): valores como
// PorcentajeMinimoSolicitud, que hoy solo se podían cargar/editar pegándole
// directo a la API. Una variable nueva no tiene efecto real hasta que algún
// lugar del código la lea explícitamente - el alta acá solo la deja
// disponible en el catálogo, no la conecta sola a ninguna pantalla.
export default function VariablesParametrizacion() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);

  const { data, isLoading } = useVariablesParametrizacion();
  const variables = Array.isArray(data) ? data : [];

  const listaFiltrada = variables.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return String(item.variable || "").toLowerCase().includes(term);
  });

  const handleAgregar = () => {
    setItemEditar(null);
    setModalAbierto(true);
  };

  const handleEditar = (item) => {
    setItemEditar(item);
    setModalAbierto(true);
  };

  return (
    <div className={styles.container}>
      <div className={l.encabezado}>
        <h1>Variables parametrizables</h1>
        {!isLoading && (
          <span className={l.resumen}>
            {listaFiltrada.length} variable{listaFiltrada.length !== 1 ? "s" : ""}
          </span>
        )}
        <div className={`${styles.actionsTop} ${l.accionPrincipal}`}>
          <InfoTooltip
            variant="admin"
            label="¿Cómo funciona esto?"
            texto="Dar de alta una variable nueva acá no alcanza para que tenga efecto: el código todavía tiene que leerla explícitamente en algún lugar de la plataforma."
          />
          <Button type="button" variant="blue" size="md" onClick={handleAgregar}>
            <FiPlus /> Nueva variable
          </Button>
        </div>
      </div>

      <div className={l.filtros}>
        <div className={l.buscador}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por nombre de variable"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar por nombre de variable"
          />
        </div>
        {searchTerm && (
          <button type="button" className={l.limpiar} onClick={() => setSearchTerm("")}>
            Limpiar
          </button>
        )}
      </div>

      <div className={l.tablaCaja}>
        <div className={l.tablaScroll}>
          <table className={`${l.tabla} ${styles.table}`}>
            <thead>
              <tr>
                <th>Variable</th>
                <th style={{ width: "9rem" }}>Valor</th>
                <th style={{ width: "8rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
              ) : listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 0, height: "auto" }}>
                    <div className={l.vacio}>
                      <FiInbox aria-hidden="true" />
                      <span>Todavía no hay variables cargadas.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item.variablesparametrizacionid}>
                    <td>{item.variable || "-"}</td>
                    <td>
                      <span className={styles.valorTag}>{item.valor}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className={l.accionFila}
                        onClick={() => handleEditar(item)}
                        title="Editar valor"
                      >
                        <FiEdit2 size={13} aria-hidden="true" /> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <VariableParametrizacionModal
        key={`${itemEditar?.variable ?? "nueva"}-${modalAbierto ? "open" : "closed"}`}
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        itemEditar={itemEditar}
      />
    </div>
  );
}
