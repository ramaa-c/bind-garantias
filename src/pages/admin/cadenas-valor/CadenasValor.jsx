import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiList,
  FiUser,
  FiSliders,
} from "react-icons/fi";
import styles from "./CadenasValor.module.css";
import { useObtenerTodasWebConEstado, useActualizarCadenaValor } from "../../../hooks/useCadenaValor";
import { cadenaValorService } from "../../../services/cadenaValorService";
import {
  useTipoCanalComercializacion,
  useEquipoComercial,
} from "../../../hooks/useCatalogos";
import { Spinner, Button, Alert, Skeleton } from "../../../components/ui";
import {
  ActivarCadenaModal,
  EditarCadenaModal,
  UsuariosRelacionadosModal,
  RequisitosConfigModal,
  CdaConfigModal,
} from "../../../components/features";
import { toast } from "sonner";

// Mientras carga la lista se muestran filas fantasma con la misma forma que
// las reales (el header, buscador y tabla quedan visibles al instante), en
// vez de un spinner de página completa. Mismo patrón que Empresas/CdasGlobales.
const CadenaRowSkeleton = () => (
  <tr>
    <td><Skeleton width="50px" height="25px" radius="0.25rem" /></td>
    <td>
      <Skeleton width="60%" height="0.9rem" />
      <Skeleton width="35%" height="0.65rem" style={{ marginTop: "0.4rem" }} />
    </td>
    <td><Skeleton width="55%" height="0.8rem" /></td>
    <td><Skeleton width="70%" height="0.8rem" /></td>
    <td><Skeleton width="60%" height="0.8rem" /></td>
    <td style={{ textAlign: "center" }}>
      <Skeleton width="36px" height="20px" radius="pill" style={{ margin: "0 auto" }} />
    </td>
    <td>
      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="28px" height="28px" radius="0.4rem" />
        ))}
      </div>
    </td>
  </tr>
);

export default function CadenasValor() {
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // Local state for optimistic status toggle and loading
  const [toggledStates, setToggledStates] = useState({});
  const [updatingIds, setUpdatingIds] = useState(new Set());

  // Queries
  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
    refetch: refetchActive,
  } = useObtenerTodasWebConEstado();

  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const actualizarMutation = useActualizarCadenaValor();

  // Normalize Catalog Options
  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];

  const activeList = activeCadenas || [];

  // Interruptor manual "Activa" de la tabla web: además de estar Aprobada y
  // vigente en CORE, el admin puede optar por apagar una cadena igual.
  // Solo interactuable cuando CORE la habilita (aprobadaVigente).
  const handleToggleActiva = async (item) => {
    const currentActive = String(item.activa || "1");
    const nuevoEstado = currentActive === "0" ? "1" : "0";

    // Optimistically toggle state in UI immediately
    setToggledStates(prev => ({
      ...prev,
      [item.cadenavalorid]: nuevoEstado
    }));
    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.add(item.cadenavalorid);
      return next;
    });

    let coreMontoMaximo = 100;
    if (item.montomaximo == null) {
      try {
        const coreChain = await cadenaValorService.obtenerPorId(item.cadenavalorid);
        const parseMonto = (obj) => {
          if (!obj) return 0;
          const key = Object.keys(obj).find(
            (k) =>
              k.toLowerCase() === "montomaximocv" ||
              k.toLowerCase() === "montomaximo" ||
              k.toLowerCase() === "tope" ||
              k.toLowerCase() === "monto_maximo"
          );
          return parseFloat(obj[key] || 0);
        };
        coreMontoMaximo = parseMonto(coreChain);
      } catch (err) {
        console.error(`Error al obtener cadena central ${item.cadenavalorid}:`, err);
      }
    }

    const payload = {
      cadenavalorid: Number(item.cadenavalorid),
      denominacion: item.denominacion,
      referencia: item.referencia || "",
      logo: item.logo || "",
      tipocanalcomercializacionid: Number(item.tipocanalcomercializacionid),
      equipocomercialid: Number(item.equipocomercialid),
      montomaximo: item.montomaximo != null ? Number(item.montomaximo) : coreMontoMaximo,
      porcentajemaximo: item.porcentajemaximo != null ? Number(item.porcentajemaximo) : 100,
      activa: nuevoEstado
    };

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          nuevoEstado === "1"
            ? `Cadena "${item.denominacion}" activada.`
            : `Cadena "${item.denominacion}" desactivada.`
        );
        setToggledStates(prev => {
          const next = { ...prev };
          delete next[item.cadenavalorid];
          return next;
        });
        setUpdatingIds(prev => {
          const next = new Set(prev);
          next.delete(item.cadenavalorid);
          return next;
        });
        refetchActive();
      },
      onError: (err) => {
        console.error("Error al cambiar estado de la cadena:", err);
        toast.error("Ocurrió un error al cambiar el estado de la cadena de valor");
        setToggledStates(prev => {
          const next = { ...prev };
          delete next[item.cadenavalorid];
          return next;
        });
        setUpdatingIds(prev => {
          const next = new Set(prev);
          next.delete(item.cadenavalorid);
          return next;
        });
      }
    });
  };

  // Helper to map catalog label
  const getCatalogLabel = (catalogOptions, value) => {
    if (value === undefined || value === null || value === "") return "-";
    const option = catalogOptions.find((opt) => opt.value === String(value));
    return option ? option.label : `ID: ${value}`;
  };

  // Helper to format image source for Base64 or URL
  const getLogoSrc = (logo) => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http")) return logo;
    return `data:image/png;base64,${logo}`;
  };

  // Open Modals
  const handleActionClick = (item, type) => {
    setActiveItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleOpenActivarModal = () => {
    setModalType("activar");
    setIsModalOpen(true);
  };

  // Filters
  const filteredCadenas = activeList.filter(
    (c) =>
      c.denominacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.referencia?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Administración Cadenas de Valor</h1>
          <p>
            Gestioná y modificá las cadenas de valor activas en la plataforma
            web
          </p>
        </div>
        <div className={styles.actionsTop}>
          <Button variant="primary" onClick={handleOpenActivarModal}>
            <FiPlus /> ACTIVAR CADENA
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Filtrar activas por denominación o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Logo</th>
                <th>Denominación</th>
                <th>Referencia</th>
                <th>Canal Comercialización</th>
                <th>Equipo Comercial</th>
                <th style={{ textAlign: "center", width: "80px" }}>Activa</th>
                <th style={{ textAlign: "center", width: "200px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingActive &&
                Array.from({ length: 6 }).map((_, i) => <CadenaRowSkeleton key={i} />)}
              {!isLoadingActive && filteredCadenas.map((item) => {
                const puedeActivarse = item.aprobadaVigente;
                const manualStatus = toggledStates[item.cadenavalorid] !== undefined
                  ? toggledStates[item.cadenavalorid]
                  : String(item.activa ?? "1");
                const isManualOff = manualStatus === "0";
                const isInactive = !puedeActivarse || isManualOff;
                const isUpdating = updatingIds.has(item.cadenavalorid);

                return (
                  <tr
                    key={item.cadenavalorid}
                    className={isInactive ? styles.inactiveRow : ""}
                  >
                    <td>
                      {item.logo ? (
                        <img
                          src={getLogoSrc(item.logo)}
                          alt={item.denominacion}
                          className={styles.logoThumbnail}
                        />
                      ) : (
                        <div
                          className={styles.logoThumbnail}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "#8b949e",
                          }}
                        >
                          Sin Logo
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{item.denominacion}</strong>
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#8b949e",
                        }}
                      >
                        ID: #{item.cadenavalorid}
                      </span>
                    </td>
                    <td>{item.referencia || "-"}</td>
                    <td>
                      {getCatalogLabel(
                        canalesOpciones,
                        item.tipocanalcomercializacionid,
                      )}
                    </td>
                    <td>
                      {getCatalogLabel(equiposOpciones, item.equipocomercialid)}
                    </td>
                    <td style={{ textAlign: "center" }} className={styles.switchCell}>
                      {isUpdating ? (
                        <div className={styles.switchLoaderWrap}>
                          <Spinner size={16} />
                        </div>
                      ) : (
                        <label
                          className={styles.switch}
                          title={
                            !puedeActivarse
                              ? "No está Aprobada o su vigencia venció: no se puede activar desde acá"
                              : isManualOff
                                ? "Activar cadena"
                                : "Desactivar cadena"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={!isInactive}
                            onChange={() => handleToggleActiva(item)}
                            disabled={isUpdating || !puedeActivarse}
                          />
                          <span className={styles.slider} />
                        </label>
                      )}
                    </td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionsCellGrid}>
                        <Button
                          variant="ghost"
                          className={`${styles.iconBtnAction} ${styles.btnEdit}`}
                          title="Editar Datos"
                          onClick={() => handleActionClick(item, "edit")}
                          disabled={isInactive}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant="ghost"
                          className={`${styles.iconBtnAction} ${styles.btnUser}`}
                          title="Usuarios Relacionados"
                          onClick={() => handleActionClick(item, "users")}
                          disabled={isInactive}
                        >
                          <FiUser />
                        </Button>
                        <Button
                          variant="ghost"
                          className={`${styles.iconBtnAction} ${styles.btnRequisitos}`}
                          title="Configurar Requisitos"
                          onClick={() => handleActionClick(item, "requisitos")}
                          disabled={isInactive}
                        >
                          <FiSliders />
                        </Button>
                        <Button
                          variant="ghost"
                          className={`${styles.iconBtnAction} ${styles.btnList}`}
                          title="Ver CDAs Activos"
                          onClick={() => handleActionClick(item, "cda")}
                          disabled={isInactive}
                        >
                          <FiList />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoadingActive && filteredCadenas.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#8b949e",
                    }}
                  >
                    No se encontraron cadenas de valor activas en la web.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ActivarCadenaModal
        isOpen={isModalOpen && modalType === "activar"}
        onClose={() => setIsModalOpen(false)}
        activeList={activeList}
        onSuccess={refetchActive}
      />

      <EditarCadenaModal
        isOpen={isModalOpen && modalType === "edit"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
        onSuccess={refetchActive}
      />

      <UsuariosRelacionadosModal
        isOpen={isModalOpen && modalType === "users"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
      />

      <RequisitosConfigModal
        isOpen={isModalOpen && modalType === "requisitos"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
      />

      <CdaConfigModal
        isOpen={isModalOpen && modalType === "cda"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
        isReadOnly={true}
      />
    </div>
  );
}
