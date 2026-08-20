import React, { useState, useEffect, useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { toast } from "sonner";
import { useActualizarCadenaValor } from "../../../../hooks/useCadenaValor";
import { useTipoCanalComercializacion, useEquipoComercial, useTipoContrato, useMonedas } from "../../../../hooks/useCatalogos";
import { Modal, Button, InputSimple, SelectSimple, MontoEnPalabras } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./EditarCadenaModal.module.css";

export const EditarCadenaModal = ({ isOpen, onClose, activeItem, onSuccess }) => {
  const [formState, setFormState] = useState({
    cadenavalorid: 0,
    denominacion: "",
    referencia: "",
    logo: "",
    tipocanalcomercializacionid: "",
    equipocomercialid: "",
    tipocontratoid: "",
    montomaximo: "",
    montomaximoutilizado: "",
    porcentajemaximoutilizado: "",
    monedaid: "",
    activa: "1"
  });

  const fileInputRef = useRef(null);

  // Bloque numérico compartido por los inputs enmascarados de Monto/Porcentaje
  // Máximo: coma como separador decimal (es-AR) y "." mapeado a coma al tipear.
  const bloqueNumerico = (max) => ({
    mask: Number,
    scale: 2,
    signed: false,
    min: 0,
    ...(max !== undefined ? { max } : {}),
    thousandsSeparator: ".",
    padFractionalZeros: true,
    normalizeZeros: true,
    radix: ",",
    mapToRadix: ["."],
  });

  // El valor que llega por onAccept es el string ya enmascarado (ej: "$ 1.234,56"
  // o "% 66,32"); antes de validar/enviar hay que limpiarlo a un número plano.
  const desenmascarar = (val) => {
    if (typeof val !== "string") return val;
    return val.replace(/[^0-9,]/g, "").replace(",", ".");
  };

  // Queries & Mutations
  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const { data: contratosData } = useTipoContrato();
  const { data: monedasData } = useMonedas();
  const actualizarMutation = useActualizarCadenaValor();

  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];
  const contratosOpciones = contratosData?.opciones || [];
  const monedasOpciones = monedasData?.opciones || [];

  const [confirmOpen, setConfirmOpen] = useState(false);
  // Snapshot del formState al abrir el modal: permite saber si el usuario
  // realmente modificó algo antes de disparar el ConfirmacionModal de
  // "¿guardar cambios?" - evita el falso positivo de confirmar un guardado
  // que no cambia nada (mismo criterio que LineasCadena).
  const [formStateInicial, setFormStateInicial] = useState(null);

  useEffect(() => {
    if (activeItem && isOpen) {
      const datos = {
        cadenavalorid: activeItem.cadenavalorid,
        denominacion: activeItem.denominacion,
        referencia: activeItem.referencia || "",
        logo: activeItem.logo || "",
        tipocanalcomercializacionid: activeItem.tipocanalcomercializacionid != null ? activeItem.tipocanalcomercializacionid.toString() : "",
        equipocomercialid: activeItem.equipocomercialid != null ? activeItem.equipocomercialid.toString() : "",
        tipocontratoid: activeItem.tipocontratoid != null ? activeItem.tipocontratoid.toString() : "",
        montomaximo: activeItem.montomaximo != null && activeItem.montomaximo !== "" ? activeItem.montomaximo.toString() : "100",
        montomaximoutilizado: activeItem.montomaximoutilizado != null && activeItem.montomaximoutilizado !== "" ? activeItem.montomaximoutilizado.toString() : "0",
        porcentajemaximoutilizado: activeItem.porcentajemaximoutilizado != null && activeItem.porcentajemaximoutilizado !== "" ? activeItem.porcentajemaximoutilizado.toString() : "100",
        monedaid: activeItem.monedaid != null ? activeItem.monedaid.toString() : "",
        activa: activeItem.activa || "1"
      };
      setFormState(datos);
      setFormStateInicial(datos);
    }
  }, [activeItem, isOpen]);

  // Los inputs enmascarados de Monto/Porcentaje reformatean su valor (padding
  // de decimales, separador de miles) apenas montan, disparando su propio
  // onAccept - eso pisa formState con el string ya formateado sin que el
  // usuario haya tocado nada. Comparar los strings crudos contra el snapshot
  // sin formatear daba un falso "hay cambios" permanente; se normalizan a
  // número (mismo criterio que al armar el payload) antes de comparar.
  const normalizarParaComparar = (fs) => ({
    ...fs,
    montomaximo: Number(desenmascarar(fs.montomaximo)) || 0,
    montomaximoutilizado: Number(desenmascarar(fs.montomaximoutilizado)) || 0,
    porcentajemaximoutilizado: Number(desenmascarar(fs.porcentajemaximoutilizado)) || 0,
  });

  const sinCambios =
    !!formStateInicial &&
    JSON.stringify(normalizarParaComparar(formState)) ===
      JSON.stringify(normalizarParaComparar(formStateInicial));

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
    const montoLimpio = desenmascarar(formState.montomaximo);
    const montoUtilizadoLimpio = desenmascarar(formState.montomaximoutilizado);
    const porcentajeLimpio = desenmascarar(formState.porcentajemaximoutilizado);

    if (montoLimpio === "" || isNaN(Number(montoLimpio)) || Number(montoLimpio) < 0) {
      toast.error("Ingrese un monto máximo válido");
      return;
    }
    if (montoUtilizadoLimpio === "" || isNaN(Number(montoUtilizadoLimpio)) || Number(montoUtilizadoLimpio) < 0) {
      toast.error("Ingrese un monto máximo utilizado válido");
      return;
    }
    if (porcentajeLimpio === "" || isNaN(Number(porcentajeLimpio)) || Number(porcentajeLimpio) < 0 || Number(porcentajeLimpio) > 100) {
      toast.error("Ingrese un porcentaje máximo utilizado válido (0 a 100)");
      return;
    }
    if (!formState.monedaid) {
      toast.error("Esta cadena no tiene una Moneda asignada. Contactá a soporte para configurarla.");
      return;
    }

    setConfirmOpen(true);
  };

  const confirmSave = () => {
    const payload = {
      cadenavalorid: Number(formState.cadenavalorid),
      denominacion: formState.denominacion,
      referencia: formState.referencia,
      logo: formState.logo,
      tipocanalcomercializacionid: Number(formState.tipocanalcomercializacionid),
      equipocomercialid: Number(formState.equipocomercialid),
      tipocontratoid: Number(formState.tipocontratoid),
      montomaximo: Number(desenmascarar(formState.montomaximo)),
      montomaximoutilizado: Number(desenmascarar(formState.montomaximoutilizado)),
      porcentajemaximoutilizado: Number(desenmascarar(formState.porcentajemaximoutilizado)),
      monedaid: Number(formState.monedaid),
      activa: formState.activa
    };

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Cadena de valor modificada exitosamente");
        setConfirmOpen(false);
        onSuccess();
        onClose();
      },
      onError: (err) => {
        console.error("Error al actualizar cadena:", err);
        toast.error("Ocurrió un error al modificar la cadena de valor");
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
                  className={styles.compactInput}
                />
              </div>
              <div style={{ flex: 2 }}>
                <InputSimple
                  label="Denominación"
                  value={formState.denominacion}
                  disabled
                  className={styles.compactInput}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div style={{ flex: 1 }}>
                <InputSimple
                  label="Referencia"
                  value={formState.referencia}
                  onChange={val => setFormState({ ...formState, referencia: val })}
                  className={styles.compactInput}
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
                className={styles.compactInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <SelectSimple
                label="Equipo Comercial *"
                placeholder="Seleccione equipo comercial..."
                options={equiposOpciones}
                value={formState.equipocomercialid}
                onChange={val => setFormState({ ...formState, equipocomercialid: val })}
                className={styles.compactInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <SelectSimple
                label="Tipo de Contrato *"
                placeholder="Seleccione tipo de contrato..."
                options={contratosOpciones}
                value={formState.tipocontratoid}
                onChange={val => setFormState({ ...formState, tipocontratoid: val })}
                className={styles.compactInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionGroup}>
          <h4 className={styles.sectionTitle}>Límites Financieros</h4>
          <div className={styles.row}>
            <div style={{ flex: 1 }}>
              <SelectSimple
                label="Moneda *"
                placeholder="Sin moneda asignada"
                options={monedasOpciones}
                value={formState.monedaid}
                onChange={() => {}}
                disabled
                className={styles.compactInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputSimple
                label="Monto Máximo *"
                value={formState.montomaximo}
                onChange={val => setFormState({ ...formState, montomaximo: val })}
                mask="$ num"
                blocks={{ num: bloqueNumerico() }}
                lazy={false}
                className={styles.compactInput}
              />
              <MontoEnPalabras value={desenmascarar(formState.montomaximo)} />
            </div>
          </div>
          <div className={styles.row}>
            <div style={{ flex: 1 }}>
              <InputSimple
                label="Monto Máximo Utilizado *"
                value={formState.montomaximoutilizado}
                onChange={val => setFormState({ ...formState, montomaximoutilizado: val })}
                mask="$ num"
                blocks={{ num: bloqueNumerico() }}
                lazy={false}
                className={styles.compactInput}
              />
              <MontoEnPalabras value={desenmascarar(formState.montomaximoutilizado)} />
            </div>
            <div style={{ flex: 1 }}>
              <InputSimple
                label="Porcentaje Máximo Utilizado (%) *"
                value={formState.porcentajemaximoutilizado}
                onChange={val => setFormState({ ...formState, porcentajemaximoutilizado: val })}
                mask="% num"
                blocks={{ num: bloqueNumerico(100) }}
                lazy={false}
                className={styles.compactInput}
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
          disabled={sinCambios}
          title={sinCambios ? "No hay cambios para guardar" : undefined}
        >
          GUARDAR
        </Button>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Confirmar Modificación"
        mensaje="¿Estás seguro de que deseas guardar los cambios realizados en esta cadena de valor?"
        variant="blue"
        confirmText="GUARDAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={actualizarMutation.isPending}
      />
    </Modal>
  );
};
