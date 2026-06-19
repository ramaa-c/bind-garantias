import React, { useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiList,
  FiUser,
  FiSliders,
} from "react-icons/fi";
import styles from "./CadenasValor.module.css";
import { useObtenerTodasWeb } from "../../hooks/useCadenaValor";
import {
  useTipoCanalComercializacion,
  useEquipoComercial,
} from "../../hooks/useCatalogos";
import { Spinner, Button } from "../../components/ui";
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

  // Queries
  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
    refetch: refetchActive,
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
              {filteredCadenas.map((item) => (
                <tr key={item.cadenavalorid}>
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
                  <td className={styles.actionCell}>
                    <div className={styles.actionsCellGrid}>
                      <Button
                        variant="ghost"
                        className={`${styles.iconBtnAction} ${styles.btnEdit}`}
                        title="Editar Datos"
                        onClick={() => handleActionClick(item, "edit")}
                      >
                        <FiEdit />
                      </Button>
                      <Button
                        variant="ghost"
                        className={`${styles.iconBtnAction} ${styles.btnList}`}
                        title="Configurar CDAs"
                        onClick={() => handleActionClick(item, "cdas")}
                      >
                        <FiList />
                      </Button>
                      <Button
                        variant="ghost"
                        className={`${styles.iconBtnAction} ${styles.btnUser}`}
                        title="Usuarios Relacionados"
                        onClick={() => handleActionClick(item, "users")}
                      >
                        <FiUser />
                      </Button>
                      <Button
                        variant="ghost"
                        className={`${styles.iconBtnAction} ${styles.btnRequisitos}`}
                        title="Configurar Requisitos"
                        onClick={() => handleActionClick(item, "requisitos")}
                      >
                        <FiSliders />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCadenas.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
