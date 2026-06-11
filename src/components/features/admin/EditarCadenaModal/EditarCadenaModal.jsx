import React, { useState, useEffect, useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { toast } from "sonner";
import { useActualizarCadenaValor } from "../../../../hooks/useCadenaValor";
import { useTipoCanalComercializacion, useEquipoComercial } from "../../../../hooks/useCatalogos";
import { Modal, Button, InputSimple, Select } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import styles from "./EditarCadenaModal.module.css";

export const EditarCadenaModal = ({ isOpen, onClose, activeItem, onSuccess }) => {
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
  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const actualizarMutation = useActualizarCadenaValor();

  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];

  useEffect(() => {
    if (activeItem && isOpen) {
      setFormState({
        cadenavalorid: activeItem.cadenavalorid,
        denominacion: activeItem.denominacion,
        referencia: activeItem.referencia || "",
        logo: activeItem.logo || "",
        tipocanalcomercializacionid: activeItem.tipocanalcomercializacionid || "",
        equipocomercialid: activeItem.equipocomercialid || ""
      });
    }
  }, [activeItem, isOpen]);

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

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Cadena de valor modificada exitosamente");
        onSuccess();
        onClose();
      },
      onError: (err) => {
        console.error("Error al actualizar cadena:", err);
        toast.error("Ocurrió un error al modificar la cadena de valor");
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
      title="MODIFICAR CADENA DE VALOR"
      maxWidth="700px"
      variant="blue"
    >
      <div className={styles.modalBody}>
        <CadenaHeaderCard
          denominacion={activeItem?.denominacion || formState.denominacion}
          logo={formState.logo || activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid || formState.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
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
                  Cargar Logo de la Cadena *
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
      </div>

      <div className={styles.modalFoot}>
        <Button
          variant="outlineBlue"
          onClick={onClose}
          disabled={actualizarMutation.isPending}
        >
          CANCELAR
        </Button>
        <Button
          variant="blue"
          onClick={handleSave}
          isLoading={actualizarMutation.isPending}
        >
          GUARDAR
        </Button>
      </div>
    </Modal>
  );
};
