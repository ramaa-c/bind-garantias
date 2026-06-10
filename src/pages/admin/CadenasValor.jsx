import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiSearch,
  FiPlus,
  FiChevronDown,
  FiX,
  FiEdit,
  FiImage,
  FiList,
  FiUser,
  FiUsers,
  FiArrowLeft,
  FiUploadCloud
} from "react-icons/fi";
import { toast } from "sonner";
import styles from "./CadenasValor.module.css";
import {
  useObtenerTodas,
  useObtenerTodasWeb,
  useCrearCadenaValor,
  useActualizarCadenaValor,
  useObtenerCdasPorCadenaId
} from "../../hooks/useCadenaValor";
import {
  useTipoCanalComercializacion,
  useEquipoComercial
} from "../../hooks/useCatalogos";
import { InputSimple, Select, Button, Spinner } from "../../components/ui";

// Interactive CDA Simulation Panel Component
function CdaPanel({ activeItem }) {
  const { data: cdas, isLoading: isLoadingCdas } = useObtenerCdasPorCadenaId(
    activeItem?.cadenavalorid
  );

  const [localCdasStatus, setLocalCdasStatus] = useState({});
  const [customRechazoMsgs, setCustomRechazoMsgs] = useState({});
  const [editingCda, setEditingCda] = useState(null);
  const [tempRechazoMsg, setTempRechazoMsg] = useState("");

  const cdasList = Array.isArray(cdas) ? cdas : cdas?.items || cdas?.data || [];

  React.useEffect(() => {
    const status = {};
    cdasList.forEach(cda => {
      status[cda.cdaid] = true;
    });
    setLocalCdasStatus(status);
  }, [cdas]);

  const handleToggleCda = (cdaId) => {
    setLocalCdasStatus(prev => {
      const nextStatus = !prev[cdaId];
      const targetCdaDesc = cdasList.find(c => c.cdaid === cdaId)?.descripcion || `CDA ID ${cdaId}`;
      toast.success(`CDA "${targetCdaDesc}" ${nextStatus ? 'habilitado' : 'deshabilitado'} (Simulado)`);
      return {
        ...prev,
        [cdaId]: nextStatus
      };
    });
  };

  if (isLoadingCdas) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
        <Spinner size={50} />
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "0.875rem", color: "#8b949e", marginBottom: "1.25rem" }}>
        Seleccioná los CDAs que se deben ejecutar durante la validación de esta cadena de valor. Las modificaciones son simuladas en este panel de control.
      </p>
      <div className={styles.cdasSection}>
        <div className={styles.cdasTitle}>Configuración de CDAs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
          {cdasList.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
              No hay CDAs vinculados a esta cadena de valor.
            </div>
          ) : (
            cdasList.map((cda) => {
              const isChecked = localCdasStatus[cda.cdaid] !== false;
              const mensajeRechazoActual = customRechazoMsgs[cda.cdaid] !== undefined
                ? customRechazoMsgs[cda.cdaid]
                : cda.mensajerechazo;

              return (
                <div
                  key={cda.cdaid}
                  className={styles.cdaItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.875rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid #30363d",
                    borderRadius: "0.5rem",
                    gap: "1rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      id={`cda-check-${cda.cdaid}`}
                      checked={isChecked}
                      onChange={() => handleToggleCda(cda.cdaid)}
                      style={{
                        width: "1.2rem",
                        height: "1.2rem",
                        accentColor: "#38a169",
                        cursor: "pointer"
                      }}
                    />
                  </div>
                  <label
                    htmlFor={`cda-check-${cda.cdaid}`}
                    style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}
                  >
                    <strong style={{ color: "#ffffff", fontSize: "0.875rem" }}>{cda.descripcion}</strong>
                    {mensajeRechazoActual && (
                      <span style={{ color: "#8b949e", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                        Mensaje rechazo: {mensajeRechazoActual}
                      </span>
                    )}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      title="Editar mensaje de rechazo"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCda(cda);
                        setTempRechazoMsg(mensajeRechazoActual || "");
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid #30363d",
                        padding: "0.45rem",
                        color: "var(--yellow, #f5f400)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.375rem",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.borderColor = "var(--yellow, #f5f400)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                        e.currentTarget.style.borderColor = "#30363d";
                      }}
                    >
                      <FiEdit size={12} />
                    </button>
                    <span className={styles.cdaStatusBadge} style={{
                      background: isChecked ? "rgba(56, 161, 105, 0.15)" : "rgba(234, 74, 90, 0.15)",
                      color: isChecked ? "#38a169" : "#ea4a5a",
                      margin: 0
                    }}>
                      {isChecked ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {editingCda && createPortal(
        <div className={styles.modalBackdrop} style={{ zIndex: 10000 }} onClick={() => setEditingCda(null)}>
          <div className={styles.modalBox} style={{ maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>EDITAR MENSAJE DE RECHAZO</h3>
              <button className={styles.closeModal} onClick={() => setEditingCda(null)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: "0.875rem", color: "#8b949e", marginBottom: "1.25rem" }}>
                Modifique el mensaje que se mostrará cuando se rechace la validación de este CDA:
              </p>
              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ color: "#ffffff", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  {editingCda.descripcion}
                </strong>
              </div>
              <InputSimple
                label="Mensaje de Rechazo"
                value={tempRechazoMsg}
                onChange={val => setTempRechazoMsg(val)}
              />
            </div>
            <div className={styles.modalFooter} style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", borderTop: "1px solid #30363d", padding: "1.25rem 1.5rem 0.5rem" }}>
              <Button variant="outline" onClick={() => setEditingCda(null)}>
                CANCELAR
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setCustomRechazoMsgs(prev => ({
                    ...prev,
                    [editingCda.cdaid]: tempRechazoMsg
                  }));
                  setEditingCda(null);
                  toast.success("Mensaje de rechazo actualizado (Simulado)");
                }}
              >
                GUARDAR
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function CadenasValor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "activar", "edit", "logo", "cdas", "users", "sociedades"
  const [activeItem, setActiveItem] = useState(null);

  // Activation Flow Specific State
  const [activationStep, setActivationStep] = useState("select"); // "select" or "form"
  const [activarSearch, setActivarSearch] = useState("");
  const [selectedChainToActivate, setSelectedChainToActivate] = useState(null);

  // Form State for Activate / Edit / Logo
  const [formState, setFormState] = useState({
    cadenavalorid: 0,
    denominacion: "",
    referencia: "",
    logo: "",
    tipocanalcomercializacionid: "",
    equipocomercialid: ""
  });

  const fileInputRef = useRef(null);

  // Queries & Mutations
  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
    refetch: refetchActive
  } = useObtenerTodasWeb();

  const {
    data: todasCadenasData,
    isLoading: isLoadingTodas
  } = useObtenerTodas(1, 200);

  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();

  const crearMutation = useCrearCadenaValor();
  const actualizarMutation = useActualizarCadenaValor();

  // Normalize Catalog Options
  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];

  // Active list
  const activeList = activeCadenas || [];

  // Full list mapping
  const todasList = Array.isArray(todasCadenasData)
    ? todasCadenasData
    : todasCadenasData?.items || todasCadenasData?.data || [];

  // Helper to map catalog label
  const getCatalogLabel = (catalogOptions, value) => {
    if (value === undefined || value === null || value === "") return "-";
    const option = catalogOptions.find(opt => opt.value === String(value));
    return option ? option.label : `ID: ${value}`;
  };

  // Helper to format image source for Base64 or URL
  const getLogoSrc = (logo) => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http")) return logo;
    return `data:image/png;base64,${logo}`;
  };

  const toggleDropdown = (id) => {
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  // File Upload Helper
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error("El tamaño máximo permitido para la imagen es 500kb");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1] || reader.result;
        setFormState(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Open Modals
  const handleActionClick = (item, type) => {
    setActiveItem(item);
    setActiveDropdownId(null);
    setModalType(type);

    if (type === "edit") {
      setFormState({
        cadenavalorid: item.cadenavalorid,
        denominacion: item.denominacion,
        referencia: item.referencia || "",
        logo: item.logo || "",
        tipocanalcomercializacionid: item.tipocanalcomercializacionid || "",
        equipocomercialid: item.equipocomercialid || ""
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenActivarModal = () => {
    setModalType("activar");
    setActivationStep("select");
    setActivarSearch("");
    setSelectedChainToActivate(null);
    setFormState({
      cadenavalorid: 0,
      denominacion: "",
      referencia: "",
      logo: "",
      tipocanalcomercializacionid: "",
      equipocomercialid: ""
    });
    setIsModalOpen(true);
  };

  const handleSelectChainToActivate = (chain) => {
    setSelectedChainToActivate(chain);
    setFormState({
      cadenavalorid: chain.cadenavalorid,
      denominacion: chain.denominacion,
      referencia: chain.referencia || "",
      logo: chain.logo || "",
      tipocanalcomercializacionid: chain.tipocanalcomercializacionid || "",
      equipocomercialid: chain.equipocomercialid || ""
    });
    setActivationStep("form");
  };

  // Submit operations
  const handleSaveModal = async () => {
    // Validations
    if (!formState.tipocanalcomercializacionid) {
      toast.error("Seleccione un Canal de Comercialización");
      return;
    }
    if (!formState.equipocomercialid) {
      toast.error("Seleccione un Equipo Comercial");
      return;
    }
    if (!formState.logo) {
      toast.error("El logo de la cadena de valor es requerido");
      return;
    }

    const payload = {
      cadenavalorid: Number(formState.cadenavalorid),
      denominacion: formState.denominacion,
      referencia: formState.referencia,
      logo: formState.logo,
      tipocanalcomercializacionid: Number(formState.tipocanalcomercializacionid),
      equipocomercialid: Number(formState.equipocomercialid)
    };

    if (modalType === "activar") {
      crearMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Cadena de valor activada exitosamente para la web");
          refetchActive();
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error("Error al crear cadena:", err);
          toast.error("Ocurrió un error al activar la cadena de valor");
        }
      });
    } else if (modalType === "edit") {
      actualizarMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Cadena de valor modificada exitosamente");
          refetchActive();
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error("Error al actualizar cadena:", err);
          toast.error("Ocurrió un error al modificar la cadena de valor");
        }
      });
    }
  };

  // Filters
  const filteredCadenas = activeList.filter(c =>
    c.denominacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Inactive ones for activation search
  const activeIds = new Set(activeList.map(c => c.cadenavalorid));
  const inactiveCadenas = todasList.filter(c => !activeIds.has(c.cadenavalorid));

  const filteredInactive = inactiveCadenas.filter(c =>
    c.denominacion?.toLowerCase().includes(activarSearch.toLowerCase()) ||
    String(c.cadenavalorid).includes(activarSearch)
  );

  if (isLoadingActive || isLoadingTodas) {
    return <Spinner center size={80} />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Administración Cadenas de Valor</h1>
          <p>Gestioná y modificá las cadenas de valor activas en la plataforma web</p>
        </div>
        <div className={styles.actionsTop}>
          <button className={styles.btnNuevo} onClick={handleOpenActivarModal}>
            <FiPlus /> ACTIVAR CADENA
          </button>
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
                <th style={{ textAlign: "right", width: "200px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCadenas.map(item => (
                <tr key={item.cadenavalorid}>
                  <td>
                    {item.logo ? (
                      <img
                        src={getLogoSrc(item.logo)}
                        alt={item.denominacion}
                        className={styles.logoThumbnail}
                      />
                    ) : (
                      <div className={styles.logoThumbnail} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#8b949e" }}>
                        Sin Logo
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{item.denominacion}</strong>
                    <span style={{ display: "block", fontSize: "11px", color: "#8b949e" }}>
                      ID: #{item.cadenavalorid}
                    </span>
                  </td>
                  <td>{item.referencia || "-"}</td>
                  <td>{getCatalogLabel(canalesOpciones, item.tipocanalcomercializacionid)}</td>
                  <td>{getCatalogLabel(equiposOpciones, item.equipocomercialid)}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.actionsCellGrid}>
                      <button
                        className={`${styles.iconBtnAction} ${styles.btnEdit}`}
                        title="Editar Datos"
                        onClick={() => handleActionClick(item, "edit")}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={`${styles.iconBtnAction} ${styles.btnList}`}
                        title="Configurar CDAs"
                        onClick={() => handleActionClick(item, "cdas")}
                      >
                        <FiList />
                      </button>
                      <button
                        className={`${styles.iconBtnAction} ${styles.btnUser}`}
                        title="Usuarios Relacionados"
                        onClick={() => handleActionClick(item, "users")}
                      >
                        <FiUser />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCadenas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#8b949e" }}>
                    No se encontraron cadenas de valor activas en la web.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Modals Portal */}
      {isModalOpen && (
        createPortal(
          <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
            <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <h3>
                  {modalType === "activar" && "ACTIVAR CADENA DE VALOR"}
                  {modalType === "edit" && `MODIFICAR CADENA: ${formState.denominacion}`}
                  {modalType === "cdas" && `CDAs HABILITADOS PARA: ${activeItem?.denominacion}`}
                  {modalType === "users" && `USUARIOS RELACIONADOS CON: ${activeItem?.denominacion}`}
                </h3>
                <button className={styles.closeModal} onClick={() => setIsModalOpen(false)}>
                  <FiX size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* ACTIVATE MODE - SELECT STEP */}
                {modalType === "activar" && activationStep === "select" && (
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#8b949e", marginBottom: "1rem" }}>
                      Seleccioná una cadena de valor del listado del sistema para activarla en la plataforma web.
                    </p>
                    <div className={styles.searchWrap} style={{ marginBottom: "1rem" }}>
                      <FiSearch className={styles.iconSearch} />
                      <input
                        type="text"
                        placeholder="Buscar cadena por denominación o ID..."
                        value={activarSearch}
                        onChange={(e) => setActivarSearch(e.target.value)}
                      />
                    </div>
                    <div className={styles.chainSearchList}>
                      {filteredInactive.map(chain => (
                        <div
                          key={chain.cadenavalorid}
                          className={styles.chainSearchItem}
                          onClick={() => handleSelectChainToActivate(chain)}
                        >
                          <div>
                            <strong>{chain.denominacion}</strong>
                            <span style={{ display: "block", fontSize: "11px", color: "#8b949e" }}>
                              CUIT: {chain.cuittercero || "No disponible"}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", background: "#30363d", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                            ID: #{chain.cadenavalorid}
                          </span>
                        </div>
                      ))}
                      {filteredInactive.length === 0 && (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", fontSize: "0.875rem" }}>
                          No se encontraron cadenas de valor inactivas para activar.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* FORM STEP FOR ACTIVACIÓN & EDITING */}
                {((modalType === "activar" && activationStep === "form") || modalType === "edit") && (
                  <>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div style={{ flex: 1 }}>
                        <InputSimple
                          label="ID de Cadena"
                          value={formState.cadenavalorid}
                          disabled
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <InputSimple
                          label="Denominación"
                          value={formState.denominacion}
                          disabled
                        />
                      </div>
                    </div>

                    <InputSimple
                      label="Referencia"
                      value={formState.referencia}
                      onChange={val => setFormState({ ...formState, referencia: val })}
                    />

                    <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <Select
                          label="Canal Comercialización *"
                          placeholder="Seleccione canal comercial..."
                          options={canalesOpciones}
                          value={formState.tipocanalcomercializacionid}
                          onChange={val => setFormState({ ...formState, tipocanalcomercializacionid: val })}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Select
                          label="Equipo Comercial *"
                          placeholder="Seleccione equipo comercial..."
                          options={equiposOpciones}
                          value={formState.equipocomercialid}
                          onChange={val => setFormState({ ...formState, equipocomercialid: val })}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Logo de la Cadena *</label>
                      {formState.logo ? (
                        <div className={styles.modalLogoPreviewWrap}>
                          <img
                            src={getLogoSrc(formState.logo)}
                            alt="Preview Logo"
                            style={{ maxHeight: "100px", maxWidth: "250px", objectFit: "contain", background: "rgba(255,255,255,0.02)", border: "1px solid #30363d", padding: "0.5rem", borderRadius: "0.5rem" }}
                          />
                          <button
                            type="button"
                            className={styles.btnRemoveLogo}
                            onClick={() => setFormState({ ...formState, logo: "" })}
                          >
                            Quitar Imagen
                          </button>
                        </div>
                      ) : (
                        <div className={styles.uploadZone} onClick={triggerFileSelect}>
                          <FiUploadCloud className={styles.uploadIcon} />
                          <div>Arrastrá o hacé click aquí para cargar una imagen</div>
                          <span style={{ fontSize: "11px", color: "#8b949e", display: "block", marginTop: "0.25rem" }}>
                            Recomendado: Fondo transparente, proporción similar a 815 x 269 px. Max 500kb.
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* CDAs INTERACTIVE TOGGLE PANEL */}
                {modalType === "cdas" && (
                  <CdaPanel activeItem={activeItem} />
                )}

                {/* RELATED USERS MOCK VIEW */}
                {modalType === "users" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "#8b949e", margin: 0 }}>
                        Usuarios autorizados a interactuar con esta cadena de valor en la plataforma web.
                      </p>
                      <button className={styles.btnNuevoBlue} style={{ marginBottom: 0 }} onClick={() => toast.info("Funcionalidad próximamente disponible")}>
                        NUEVO
                      </button>
                    </div>
                    <table className={styles.usersTable}>
                      <thead>
                        <tr>
                          <th>Nombre de usuario / Email</th>
                          <th>Habilitado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>consultante_{activeItem?.referencia || "cadenadevalor"}@mailinator.com</td>
                          <td>
                            <span className={styles.cdaStatusBadge}>Si</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={styles.modalFoot}>
                {modalType === "activar" && activationStep === "form" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setActivationStep("select")}
                      disabled={crearMutation.isPending}
                    >
                      <FiArrowLeft style={{ marginRight: "0.25rem", verticalAlign: "middle" }} /> ATRÁS
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveModal}
                      isLoading={crearMutation.isPending}
                    >
                      ACTIVAR
                    </Button>
                  </>
                )}

                {modalType === "activar" && activationStep === "select" && (
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    CANCELAR
                  </Button>
                )}

                {modalType === "edit" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      disabled={actualizarMutation.isPending}
                    >
                      CANCELAR
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveModal}
                      isLoading={actualizarMutation.isPending}
                    >
                      GUARDAR
                    </Button>
                  </>
                )}

                {(modalType === "cdas" || modalType === "users") && (
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    CERRAR
                  </Button>
                )}
              </div>
            </div>
          </div>
          , document.body)
      )}
    </div>
  );
}
