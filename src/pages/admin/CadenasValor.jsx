import React, { useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiList,
  FiUser,
  FiSliders
} from "react-icons/fi";
import styles from "./CadenasValor.module.css";
import { useObtenerTodasWeb } from "../../hooks/useCadenaValor";
import {
  useTipoCanalComercializacion,
  useEquipoComercial
} from "../../hooks/useCatalogos";
import { Spinner } from "../../components/ui";
import {
  ActivarCadenaModal,
  EditarCadenaModal,
  CdaConfigModal,
  UsuariosRelacionadosModal,
  RequisitosConfigModal
} from "../../components/features";
import { toast } from "sonner";
import api from "../../api/axios";
import {
  requisitosService,
  DEFAULT_PHYSICAL_CONFIG,
  DEFAULT_SA_CONFIG,
  DEFAULT_SRL_CONFIG,
  DEFAULT_SH_CONFIG,
  DEFAULT_OTRAS_CONFIG,
} from "../../services/requisitosService";

export default function CadenasValor() {
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "activar", "edit", "cdas", "users"
  const [activeItem, setActiveItem] = useState(null);
  const [inicializando, setInicializando] = useState(false);

  const handleInicializarFaltantes = async () => {
    setInicializando(true);
    let count = 0;
    try {
      const defaultConfigs = {
        fisica: DEFAULT_PHYSICAL_CONFIG,
        sa: DEFAULT_SA_CONFIG,
        srl: DEFAULT_SRL_CONFIG,
        sh: DEFAULT_SH_CONFIG,
        otras: DEFAULT_OTRAS_CONFIG,
      };

      for (const chain of activeList) {
        const res = await api.get("api/CadenaValorParametrizacion", {
          params: { cadenavalorid: chain.cadenavalorid },
        });
        const data = res.data || [];
        if (data.length === 0) {
          await requisitosService.guardarRequisitos(chain.cadenavalorid, defaultConfigs);
          count++;
        }
      }

      if (count > 0) {
        toast.success(`Se inicializaron correctamente los parámetros por defecto para ${count} cadena(s)`);
      } else {
        toast.info("Todas las cadenas activas ya cuentan con parámetros registrados");
      }
    } catch (err) {
      console.error("Error al inicializar parámetros:", err);
      toast.error("Ocurrió un error al inicializar los parámetros de las cadenas");
    } finally {
      setInicializando(false);
    }
  };

  // Queries
  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
    refetch: refetchActive
  } = useObtenerTodasWeb();

  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();

  // Normalize Catalog Options
  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];

  const activeList = activeCadenas || [];

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
  const filteredCadenas = activeList.filter(c =>
    c.denominacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p>Gestioná y modificá las cadenas de valor activas en la plataforma web</p>
        </div>
        <div className={styles.actionsTop}>
          <button
            className={styles.btnSecundario}
            onClick={handleInicializarFaltantes}
            disabled={inicializando}
          >
            <FiSliders /> {inicializando ? "INICIALIZANDO..." : "INICIALIZAR PARÁMETROS"}
          </button>
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
                      <button
                        className={`${styles.iconBtnAction} ${styles.btnRequisitos}`}
                        title="Configurar Requisitos"
                        onClick={() => handleActionClick(item, "requisitos")}
                      >
                        <FiSliders />
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
