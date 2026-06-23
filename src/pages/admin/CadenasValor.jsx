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
import { useObtenerTodasWeb, useActualizarCadenaValor } from "../../hooks/useCadenaValor";
import { cadenaValorService } from "../../services/cadenaValorService";
import {
  useTipoCanalComercializacion,
  useEquipoComercial,
} from "../../hooks/useCatalogos";
import { Spinner, Button, Alert } from "../../components/ui";
import {
  ActivarCadenaModal,
  EditarCadenaModal,
  CdaConfigModal,
  UsuariosRelacionadosModal,
  RequisitosConfigModal,
} from "../../components/features";
import { toast } from "sonner";

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
  } = useObtenerTodasWeb();

  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const actualizarMutation = useActualizarCadenaValor();

  // Normalize Catalog Options
  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];

  const activeList = activeCadenas || [];

  const [isMigrating, setIsMigrating] = useState(false);
  const [coreCadenasDetails, setCoreCadenasDetails] = useState({});

  // Fetch core chain details individually for all active chains to bypass pagination limits
  useEffect(() => {
    if (activeList.length > 0) {
      activeList.forEach(async (c) => {
        if (!coreCadenasDetails[c.cadenavalorid]) {
          try {
            const detail = await cadenaValorService.obtenerPorId(c.cadenavalorid);
            setCoreCadenasDetails(prev => ({
              ...prev,
              [c.cadenavalorid]: detail
            }));
          } catch (err) {
            console.error(`Error loading core chain detail for ${c.cadenavalorid}:`, err);
          }
        }
      });
    }
  }, [activeList]);

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

  // Filter chains that lack status, have incorrect/zero montomaximo, or porcentajemaximo !== 100
  const chainsToMigrate = activeList.filter((c) => {
    const coreChain = coreCadenasDetails[c.cadenavalorid];
    // If not loaded yet, assume it might need migration if current web values are nulo/0
    if (!coreChain) {
      return (
        c.activa === undefined ||
        c.activa === null ||
        c.activa === "" ||
        Number(c.montomaximo) === 0 ||
        Number(c.porcentajemaximo) !== 100
      );
    }
    const coreMontoMaximo = parseMonto(coreChain);

    return (
      c.activa === undefined ||
      c.activa === null ||
      c.activa === "" ||
      Number(c.montomaximo) !== coreMontoMaximo ||
      Number(c.porcentajemaximo) !== 100
    );
  });

  const handleMigrarCadenas = async () => {
    if (chainsToMigrate.length === 0) return;
    setIsMigrating(true);
    const toastId = toast.loading(`Actualizando ${chainsToMigrate.length} cadenas de valor...`);
    try {
      await Promise.all(
        chainsToMigrate.map(async (c) => {
          let coreMontoMaximo = 100;
          try {
            const coreChain = coreCadenasDetails[c.cadenavalorid] 
              || await cadenaValorService.obtenerPorId(c.cadenavalorid);
            coreMontoMaximo = parseMonto(coreChain);
          } catch (err) {
            console.error(`Error al obtener cadena central ${c.cadenavalorid}:`, err);
          }

          const payload = {
            cadenavalorid: Number(c.cadenavalorid),
            denominacion: c.denominacion,
            referencia: c.referencia || "",
            logo: c.logo || "",
            tipocanalcomercializacionid: Number(c.tipocanalcomercializacionid),
            equipocomercialid: Number(c.equipocomercialid),
            montomaximo: coreMontoMaximo,
            porcentajemaximo: 100,
            activa: c.activa || "1",
          };
          return cadenaValorService.actualizarCadenaValor(payload);
        })
      );
      toast.success("Migración finalizada con éxito", { id: toastId });
      refetchActive();
    } catch (error) {
      console.error("Error al migrar cadenas:", error);
      toast.error("Ocurrió un error al migrar algunas cadenas de valor", { id: toastId });
    } finally {
      setIsMigrating(false);
    }
  };

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
    try {
      const coreChain = coreCadenasDetails[item.cadenavalorid]
        || await cadenaValorService.obtenerPorId(item.cadenavalorid);
      coreMontoMaximo = parseMonto(coreChain);
    } catch (err) {
      console.error(`Error al obtener cadena central ${item.cadenavalorid}:`, err);
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
        // Clear optimistic state to sync with backend refetch
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
        // Revert optimistic state
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

  if (isLoadingActive) {
    return <Spinner center size={80} />;
  }

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

      {/* Migration Alert */}
      {chainsToMigrate.length > 0 && (
        <Alert variant="warning" className={styles.migrationAlert}>
          <div className={styles.migrationAlertContent}>
            <span>
              Se detectaron <strong>{chainsToMigrate.length}</strong> cadenas con datos históricos incompletos (sin estado, monto máximo o porcentaje).
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleMigrarCadenas}
              isLoading={isMigrating}
            >
              Actualizar datos
            </Button>
          </div>
        </Alert>
      )}

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
              {filteredCadenas.map((item) => {
                const currentStatus = toggledStates[item.cadenavalorid] !== undefined
                  ? toggledStates[item.cadenavalorid]
                  : String(item.activa);
                const isInactive = currentStatus === "0";
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
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={!isInactive}
                            onChange={() => handleToggleActiva(item)}
                            disabled={isUpdating}
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
                          className={`${styles.iconBtnAction} ${styles.btnList}`}
                          title="Configurar CDAs"
                          onClick={() => handleActionClick(item, "cdas")}
                          disabled={isInactive}
                        >
                          <FiList />
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
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCadenas.length === 0 && (
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

      <CdaConfigModal
        isOpen={isModalOpen && modalType === "cdas"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
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
    </div>
  );
}
