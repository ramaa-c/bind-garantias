import React, { useState } from "react";
import { FiPlus, FiEdit2, FiSearch, FiInbox, FiHelpCircle } from "react-icons/fi";
import { toast } from "sonner";
import { Button, Skeleton } from "../../../components/ui";
import { TipoRelacionSocioModal } from "../../../components/features/admin/TipoRelacionSocioModal/TipoRelacionSocioModal";
import { useTiposRelacionSocioActivos } from "../../../hooks/useTipoRelacionSocio";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import styles from "./TiposRelacionSocio.module.css";

const RowSkeleton = () => (
  <tr>
    <td><Skeleton width="30%" height="0.85rem" /></td>
    <td><Skeleton width="60%" height="0.9rem" /></td>
    <td style={{ textAlign: "center" }}>
      <Skeleton width="28px" height="28px" radius="0.4rem" style={{ margin: "0 auto" }} />
    </td>
  </tr>
);

// ABM del catálogo curado de relaciones de terceros (api/TipoRelacionSocio),
// que reemplaza el TipoRelacionSocioID hardcodeado que hoy vive repartido en
// varios lugares del código (ver requisitosService.js/TIPO_RELACION_MAP). El
// alta/edición vive en TipoRelacionSocioModal - acá solo el listado.
export default function TiposRelacionSocio() {
  // Defensa en profundidad: ver useBloqueoAdminRestringido.
  const bloqueado = useBloqueoAdminRestringido();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);

  const { data: activosData, isLoading } = useTiposRelacionSocioActivos();
  const activos = Array.isArray(activosData)
    ? activosData
    : activosData?.items || activosData?.data || [];

  const activosNormalizados = activos.map((item) => ({
    tiporelacionsocioid: item.tiporelacionsocioid ?? item.TipoRelacionSocioID,
    descripcion: item.descripcion ?? item.Descripcion ?? "",
  }));

  const listaFiltrada = activosNormalizados.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.descripcion.toLowerCase().includes(term) ||
      String(item.tiporelacionsocioid).includes(term)
    );
  });

  const handleAgregar = () => {
    setItemEditar(null);
    setModalAbierto(true);
  };

  const handleEditar = (item) => {
    setItemEditar(item);
    setModalAbierto(true);
  };

  if (bloqueado) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Relaciones de Terceros</h1>
          <p>
            Activá los vínculos del catálogo real de SGR+ que se pueden usar
            en la web, con la descripción que va a ver el cliente.
          </p>
        </div>
        <div className={styles.actionsTop}>
          <button
            type="button"
            className={styles.helpButton}
            onClick={() =>
              toast.info(
                "El ID siempre es el del catálogo real de SGR+ - acá solo se define cómo se llama esa relación para la web. Una vez activada, no se puede desactivar (pedile a Victor un borrado manual si hace falta).",
              )
            }
            title="Ayuda"
          >
            <FiHelpCircle size={18} />
          </button>
          <Button type="button" variant="blue" size="md" onClick={handleAgregar}>
            <FiPlus /> Agregar relación
          </Button>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por descripción o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!isLoading && (
          <span className={styles.listCount}>
            {listaFiltrada.length} relación{listaFiltrada.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "20%" }}>ID</th>
                <th>Descripción (web)</th>
                <th style={{ textAlign: "center", width: "4rem" }}></th>
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
                      <span>Todavía no hay relaciones activadas para la web.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item.tiporelacionsocioid}>
                    <td>
                      <span className={styles.idTag}>#{item.tiporelacionsocioid}</span>
                    </td>
                    <td>{item.descripcion || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => handleEditar(item)}
                        title="Editar descripción"
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

      <TipoRelacionSocioModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        itemEditar={itemEditar}
        idsActivos={activosNormalizados.map((item) => item.tiporelacionsocioid)}
      />
    </div>
  );
}
