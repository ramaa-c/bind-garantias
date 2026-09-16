import React, { useState } from "react";
import { FiPlus, FiEdit2, FiSearch, FiInbox, FiHelpCircle } from "react-icons/fi";
import { toast } from "sonner";
import { Button, Skeleton } from "../../../components/ui";
import { VariableParametrizacionModal } from "../../../components/features/admin/VariableParametrizacionModal/VariableParametrizacionModal";
import { useVariablesParametrizacion } from "../../../hooks/useVariablesParametrizacion";
import styles from "./VariablesParametrizacion.module.css";

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
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Variables Parametrizables</h1>
          <p>
            Administrá los valores de configuración de la plataforma.
          </p>
        </div>
        <div className={styles.actionsTop}>
          <button
            type="button"
            className={styles.helpButton}
            onClick={() =>
              toast.info(
                "Dar de alta una variable nueva acá no alcanza para que tenga efecto: el código todavía tiene que leerla explícitamente en algún lugar de la plataforma.",
              )
            }
            title="Ayuda"
          >
            <FiHelpCircle size={20} />
          </button>
          <Button type="button" variant="blue" size="lg" onClick={handleAgregar}>
            <FiPlus /> Agregar variable
          </Button>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por nombre de variable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!isLoading && (
          <span className={styles.listCount}>
            {listaFiltrada.length} variable{listaFiltrada.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Variable</th>
                <th style={{ width: "9rem" }}>Valor</th>
                <th style={{ textAlign: "center", width: "4.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
              ) : listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 0 }}>
                    <div className={styles.emptyState}>
                      <FiInbox className={styles.emptyStateIcon} />
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
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => handleEditar(item)}
                        title="Editar valor"
                      >
                        <FiEdit2 size={14} />
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
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        itemEditar={itemEditar}
      />
    </div>
  );
}
