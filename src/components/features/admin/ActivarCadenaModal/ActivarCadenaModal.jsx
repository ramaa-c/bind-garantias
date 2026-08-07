import React, { useState, useRef } from "react";
import { FiSearch, FiArrowLeft, FiUploadCloud, FiChevronRight } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerCadenasCursanPlataforma, useCrearCadenaValor } from "../../../../hooks/useCadenaValor";
import { useUsuarioWebIdActual } from "../../../../hooks/useUsuario";
import { esCadenaAprobadaYVigente } from "../../../../utils/cadenaValorUtils";
import { esCdaActivo } from "../../../../utils/cdaUtils";
import { PANTALLAS_CDA } from "../../../../utils/pantallasCda";
import { cdaService } from "../../../../services/cdaService";
import { cadenaValorService } from "../../../../services/cadenaValorService";
import { useTipoCanalComercializacion, useEquipoComercial, useTipoContrato } from "../../../../hooks/useCatalogos";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { SelectSimple } from "../../../ui/SelectSimple/SelectSimple";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import {
  requisitosService,
  DEFAULT_PHYSICAL_CONFIG,
  DEFAULT_SA_CONFIG,
  DEFAULT_SRL_CONFIG,
  DEFAULT_SH_CONFIG,
  DEFAULT_OTRAS_CONFIG,
} from "../../../../services/requisitosService";
import styles from "./ActivarCadenaModal.module.css";

export const ActivarCadenaModal = ({ isOpen, onClose, activeList, onSuccess }) => {
  const [step, setStep] = useState("select"); // "select" or "form"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState(null);
  const [formState, setFormState] = useState({
    cadenavalorid: 0,
    denominacion: "",
    referencia: "",
    logo: "",
    tipocanalcomercializacionid: "",
    equipocomercialid: "",
    tipocontratoid: ""
  });

  const fileInputRef = useRef(null);

  // Queries & Mutations
  const { data: todasCadenasData, isLoading: isLoadingTodas } = useObtenerCadenasCursanPlataforma();
  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const { data: contratosData } = useTipoContrato();
  const crearMutation = useCrearCadenaValor();
  const usuarioWebId = useUsuarioWebIdActual();

  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];
  const contratosOpciones = contratosData?.opciones || [];

  const [confirmOpen, setConfirmOpen] = useState(false);

  const todasList = Array.isArray(todasCadenasData)
    ? todasCadenasData
    : todasCadenasData?.items || todasCadenasData?.data || [];

  // Solo se puede activar en la web una cadena Aprobada y con vigencia vigente.
  const cadenasHabilitadas = todasList.filter(esCadenaAprobadaYVigente);

  const activeIds = new Set(activeList.map(c => c.cadenavalorid));
  const inactiveCadenas = cadenasHabilitadas.filter(c => !activeIds.has(c.cadenavalorid));

  const filteredInactive = inactiveCadenas.filter(c =>
    c.denominacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(c.cadenavalorid).includes(searchQuery)
  );

  const handleSelectChain = (chain) => {
    setSelectedChain(chain);
    setFormState({
      cadenavalorid: chain.cadenavalorid,
      denominacion: chain.denominacion,
      referencia: chain.referencia || "",
      logo: chain.logo || "",
      tipocanalcomercializacionid: chain.tipocanalcomercializacionid != null ? chain.tipocanalcomercializacionid.toString() : "",
      equipocomercialid: chain.equipocomercialid != null ? chain.equipocomercialid.toString() : "",
      tipocontratoid: chain.tipocontratoid != null ? chain.tipocontratoid.toString() : ""
    });
    setStep("form");
  };

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

  const handleSave = async () => {
    if (!formState.tipocanalcomercializacionid) {
      toast.error("Seleccione un Canal de Comercialización");
      return;
    }
    if (!formState.equipocomercialid) {
      toast.error("Seleccione un Equipo Comercial");
      return;
    }
    if (!formState.tipocontratoid) {
      toast.error("Seleccione un Tipo de Contrato");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSave = () => {
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

    const payload = {
      cadenavalorid: Number(formState.cadenavalorid),
      denominacion: formState.denominacion,
      referencia: formState.referencia,
      logo: formState.logo,
      tipocanalcomercializacionid: Number(formState.tipocanalcomercializacionid),
      equipocomercialid: Number(formState.equipocomercialid),
      tipocontratoid: Number(formState.tipocontratoid),
      montomaximo: parseMonto(selectedChain),
      porcentajemaximo: 100,
      activa: "1"
    };

    crearMutation.mutate(payload, {
      onSuccess: async () => {
        // Inicializar requisitos por defecto para esta nueva cadena
        try {
          const defaultConfigs = {
            fisica: DEFAULT_PHYSICAL_CONFIG,
            sa: DEFAULT_SA_CONFIG,
            srl: DEFAULT_SRL_CONFIG,
            sh: DEFAULT_SH_CONFIG,
            otras: DEFAULT_OTRAS_CONFIG,
          };
          await requisitosService.guardarRequisitos(payload.cadenavalorid, defaultConfigs);
        } catch (reqErr) {
          console.error("Error al inicializar requisitos por defecto para nueva cadena:", reqErr);
        }

        // Crear el GrupoCda de esta cadena para ambas pantallas, sembrado con
        // los CDAs marcados "CDA por Defecto" (todos unidos por AND).
        if (!usuarioWebId) {
          toast.warning("La cadena se activó, pero no se pudieron vincular los criterios de aceptación por defecto (no se identificó al usuario logueado). Vinculalos manualmente desde el panel de CDAs.");
        } else {
          try {
            const todosCdas = await cdaService.obtenerTodosCdas();
            const todosCdasList = Array.isArray(todosCdas) ? todosCdas : todosCdas?.items || todosCdas?.data || [];
            const defaultCdas = todosCdasList.filter((c) => {
              if (!esCdaActivo(c)) return false;
              const flag = c.vinculadefaultcv ?? c.VinculaDefaultCV;
              return String(flag) === "1" || String(flag).toUpperCase() === "S";
            });

            for (const pantalla of PANTALLAS_CDA) {
              const pantallaGrupoCdaId = await cdaService.obtenerOCrearPantallaGrupoCda(pantalla.value);
              const grupo = await cdaService.crearGrupoCda({
                pantallagrupocdaid: pantallaGrupoCdaId,
                cadenavalorid: payload.cadenavalorid,
                expresionagrupacion: "",
              });

              if (defaultCdas.length > 0) {
                await cadenaValorService.vincularCdasAGrupo({
                  grupocdaid: grupo?.grupocdaid,
                  listacda: defaultCdas.map((c) => ({
                    cdaid: c.cdaid ?? c.CdaId ?? c.CdaID,
                    valorcomparacion: c.valorcomparacion ?? c.ValorComparacion ?? "",
                    usuariowebid: usuarioWebId,
                  })),
                });
              }
            }
          } catch (grupoErr) {
            console.error("Error al inicializar grupos de CDAs por defecto para la nueva cadena:", grupoErr);
          }
        }

        toast.success("Cadena de valor activada exitosamente para la web");
        setConfirmOpen(false);
        onSuccess();
        onClose();
        // Reset state
        setStep("select");
        setSelectedChain(null);
      },
      onError: (err) => {
        console.error("Error al crear cadena:", err);
        toast.error("Ocurrió un error al activar la cadena de valor");
        setConfirmOpen(false);
      }
    });
  };

  const getLogoSrc = (logo) => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http")) return logo;
    return `data:image/png;base64,${logo}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ACTIVAR CADENA DE VALOR"
      maxWidth="700px"
      variant="blue"
    >
      <div className={styles.modalBody}>
        {isLoadingTodas ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Skeleton width="85%" height="0.85rem" />
            <Skeleton width="100%" height="2.5rem" radius="0.6rem" style={{ margin: "0.5rem 0" }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.75rem 1rem", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "0.65rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <Skeleton width="2.4rem" height="2.4rem" radius="0.6rem" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="55%" height="0.9rem" />
                    <Skeleton width="35%" height="0.7rem" style={{ marginTop: "0.4rem" }} />
                  </div>
                </div>
                <Skeleton width="4.5rem" height="1.3rem" radius="pill" />
              </div>
            ))}
          </div>
        ) : step === "select" ? (
          <div>
            <p style={{ fontSize: "0.875rem", color: "#8b949e", marginBottom: "1rem" }}>
              Seleccioná una cadena de valor del listado del sistema para activarla en la plataforma web.
            </p>
            <div className={styles.searchWrap} style={{ marginBottom: "1rem" }}>
              <FiSearch className={styles.iconSearch} />
              <input
                type="text"
                placeholder="Buscar cadena por denominación o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.chainSearchList}>
              {filteredInactive.map(chain => {
                const getInitials = (name) => {
                  if (!name) return "CV";
                  return name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0].toUpperCase())
                    .join("");
                };

                return (
                  <div
                    key={chain.cadenavalorid}
                    className={styles.chainSearchItem}
                    onClick={() => handleSelectChain(chain)}
                  >
                    <div className={styles.itemLeft}>
                      <div className={styles.itemAvatar}>
                        {getInitials(chain.denominacion)}
                      </div>
                      <div className={styles.itemDetails}>
                        <strong className={styles.itemName}>{chain.denominacion}</strong>
                        <span className={styles.itemCuit}>
                          CUIT: {chain.cuittercero || "No disponible"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={styles.itemIdBadge}>
                        ID: #{chain.cadenavalorid}
                      </span>
                      <FiChevronRight className={styles.itemChevron} />
                    </div>
                  </div>
                );
              })}
              {filteredInactive.length === 0 && (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#8b949e", fontSize: "0.875rem" }}>
                  No se encontraron cadenas de valor vigentes para activar.
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <CadenaHeaderCard
              denominacion={selectedChain?.denominacion || formState.denominacion}
              logo={formState.logo || selectedChain?.logo}
              referencia={formState.referencia || selectedChain?.referencia}
              cadenavalorid={selectedChain?.cadenavalorid || formState.cadenavalorid}
              cuittercero={selectedChain?.cuittercero}
            />
            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>Identificación de la Cadena</h4>
              <div className={styles.inputsGrid}>
                <div className={styles.row}>
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
                <div className={styles.row}>
                  <div style={{ flex: 1 }}>
                    <InputSimple
                      label="Referencia"
                      value={formState.referencia}
                      onChange={val => setFormState({ ...formState, referencia: val })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>Configuración Comercial</h4>
              <div className={styles.row}>
                <div style={{ flex: 1 }}>
                  <SelectSimple
                    label="Canal Comercialización *"
                    placeholder="Seleccione canal comercial..."
                    options={canalesOpciones}
                    value={formState.tipocanalcomercializacionid}
                    onChange={val => setFormState({ ...formState, tipocanalcomercializacionid: val })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <SelectSimple
                    label="Equipo Comercial *"
                    placeholder="Seleccione equipo comercial..."
                    options={equiposOpciones}
                    value={formState.equipocomercialid}
                    onChange={val => setFormState({ ...formState, equipocomercialid: val })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <SelectSimple
                    label="Tipo de Contrato *"
                    placeholder="Seleccione tipo de contrato..."
                    options={contratosOpciones}
                    value={formState.tipocontratoid}
                    onChange={val => setFormState({ ...formState, tipocontratoid: val })}
                  />
                </div>
              </div>
            </div>

            <div className={styles.logoSection}>
              {formState.logo ? (
                <div className={styles.modalLogoPreviewWrap}>
                  <img
                    src={getLogoSrc(formState.logo)}
                    alt="Preview Logo"
                    style={{ maxHeight: "60px", maxWidth: "180px", objectFit: "contain", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(43, 113, 200, 0.15)", padding: "0.25rem", borderRadius: "0.5rem" }}
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
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#ffffff" }}>
                      Cargar Logo de la Cadena (Opcional)
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#8b949e", marginTop: "0.15rem" }}>
                      Arrastrá o hacé click aquí. Fondo transparente, Max 500kb.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      <div
        className={styles.modalFoot}
        style={{
          margin: "1.5rem -1.5rem -1.5rem -1.5rem",
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid #30363d",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        {step === "form" ? (
          <>
            <Button
              variant="outlineBlue"
              onClick={() => setStep("select")}
              disabled={crearMutation.isPending}
            >
              <FiArrowLeft style={{ marginRight: "0.25rem", verticalAlign: "middle" }} /> ATRÁS
            </Button>
            <Button
              variant="blue"
              onClick={handleSave}
              isLoading={crearMutation.isPending}
            >
              ACTIVAR
            </Button>
          </>
        ) : (
          <Button variant="outlineBlue" onClick={onClose}>
            CANCELAR
          </Button>
        )}
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Confirmar Activación"
        mensaje="¿Estás seguro de que deseas activar esta cadena de valor en la plataforma web?"
        variant="blue"
        confirmText="ACTIVAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={crearMutation.isPending}
      />
    </Modal>
  );
};
