import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiPhone,
  FiEdit2,
  FiChevronRight,
} from "react-icons/fi";
import { Button } from "../../../ui";
import { UbicacionModal, ContactoModal } from "../../../features";
import styles from "./Paso2Datos.module.css";

export default function Paso2Datos({ onVolver, onContinuar, isSubmitting }) {
  const { setValue, trigger, control } = useFormContext();

  const [modalUbicacionOpen, setUbicacionModalOpen] = useState(false);
  const [modalContactoOpen, setContactoModalOpen] = useState(false);
  const [intentoAvanzar, setIntentoAvanzar] = useState(false);

  const calle = useWatch({ control, name: "calle" });
  const numero = useWatch({ control, name: "numero" });
  const sinNumero = useWatch({ control, name: "sinNumero" });
  const provincia = useWatch({ control, name: "provincia" });
  const localidad = useWatch({ control, name: "localidad" });
  const direccion = useWatch({ control, name: "direccion" }) || "";
  const celular = useWatch({ control, name: "celular" }) || "";
  const cuit = useWatch({ control, name: "cuit" }) || "";
  const razonSocial =
    useWatch({ control, name: "razonSocial" }) || "Razón Social Desconocida";

  const ubicacionConfirmada =
    useWatch({ control, name: "ubicacionConfirmada" }) || false;

  const ubicacionOk = ubicacionConfirmada && direccion.trim().length >= 5;
  const contactoOk = celular.trim().length >= 8;

  const handleGuardarUbicacion = () => {
    setValue("ubicacionConfirmada", true, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setUbicacionModalOpen(false);
  };

  const handleGuardarContacto = () => {
    setContactoModalOpen(false);
  };

  const handleAvanzarClick = async () => {
    setIntentoAvanzar(true);
    const esValidoGlobal = await trigger([
      "calle",
      "numero",
      "direccion",
      "provincia",
      "localidad",
      "celular",
    ]);
    if (ubicacionOk && contactoOk && esValidoGlobal) onContinuar();
  };

  const pill = (done, error) => {
    if (done) return styles.pillDone;
    if (error) return styles.pillError;
    return styles.pillPending;
  };

  return (
    <div className={styles.container}>
      {/* HEADER ──────────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.completionPills}>
          <span
            className={`${styles.pill} ${pill(ubicacionOk, intentoAvanzar && !ubicacionOk)}`}
          >
            {ubicacionOk ? (
              <FiCheckCircle size={11} />
            ) : (
              <FiAlertCircle size={11} />
            )}
            Ubicación
          </span>
          <span
            className={`${styles.pill} ${pill(contactoOk, intentoAvanzar && !contactoOk)}`}
          >
            {contactoOk ? (
              <FiCheckCircle size={11} />
            ) : (
              <FiAlertCircle size={11} />
            )}
            Contacto
          </span>
        </div>
      </div>

      {/* SUMMARY ─────────────────────────────────────────────────────────────── */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryLeft}>
          <span className={styles.summaryStatus}>
            <FiCheckCircle size={11} /> Socio validado
          </span>
          <h2 className={styles.summaryName}>{razonSocial}</h2>
          <p className={styles.summaryCuit}>CUIT: {cuit || "20-12345678-9"}</p>
        </div>
        <button
          type="button"
          className={styles.editLink}
          onClick={onVolver}
          disabled={isSubmitting}
        >
          <FiEdit2 size={13} /> Editar
        </button>
      </div>

      {/* TAREAS ──────────────────────────────────────────────────────────────── */}
      <div className={styles.taskList}>
        {/* UBICACIÓN */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (!isSubmitting && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setUbicacionModalOpen(true);
            }
          }}
          className={`${styles.taskRow} ${ubicacionOk ? styles.rowSuccess : intentoAvanzar && !ubicacionOk ? styles.rowError : ""}`}
          onClick={() => !isSubmitting && setUbicacionModalOpen(true)}
          style={{
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <span
            className={`${styles.taskIcon} ${ubicacionOk ? styles.iconSuccess : intentoAvanzar && !ubicacionOk ? styles.iconError : styles.iconWarn}`}
          >
            {ubicacionOk ? (
              <FiCheckCircle size={16} />
            ) : intentoAvanzar ? (
              <FiAlertCircle size={16} />
            ) : (
              <FiMapPin size={16} />
            )}
          </span>

          <div className={styles.taskInfo}>
            <strong className={styles.taskTitle}>Datos de Ubicación</strong>
            <span className={styles.taskSub}>
              {ubicacionOk && direccion
                ? `${direccion}, ${localidad}`
                : "Dirección, Provincia y Localidad"}
            </span>
          </div>

          <span
            className={`${styles.taskAction} ${ubicacionOk ? styles.taskActionEdit : intentoAvanzar && !ubicacionOk ? styles.taskActionError : ""}`}
          >
            {ubicacionOk ? (
              <>
                <FiEdit2 size={12} /> Modificar
              </>
            ) : (
              "Completar →"
            )}
          </span>
        </div>

        {/* CONTACTO */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (!isSubmitting && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setContactoModalOpen(true);
            }
          }}
          className={`${styles.taskRow} ${contactoOk ? styles.rowSuccess : intentoAvanzar && !contactoOk ? styles.rowError : ""}`}
          onClick={() => !isSubmitting && setContactoModalOpen(true)}
          style={{
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <span
            className={`${styles.taskIcon} ${contactoOk ? styles.iconSuccess : intentoAvanzar && !contactoOk ? styles.iconError : styles.iconWarn}`}
          >
            {contactoOk ? (
              <FiCheckCircle size={16} />
            ) : intentoAvanzar ? (
              <FiAlertCircle size={16} />
            ) : (
              <FiPhone size={16} />
            )}
          </span>

          <div className={styles.taskInfo}>
            <strong className={styles.taskTitle}>
              Verificación de Contacto
            </strong>
            <span className={styles.taskSub}>
              {contactoOk ? `Cel: ${celular}` : "Ingresar teléfono celular"}
            </span>
          </div>

          <span
            className={`${styles.taskAction} ${contactoOk ? styles.taskActionEdit : intentoAvanzar && !contactoOk ? styles.taskActionError : ""}`}
          >
            {contactoOk ? (
              <>
                <FiEdit2 size={12} /> Modificar
              </>
            ) : (
              "Verificar →"
            )}
          </span>
        </div>
      </div>

      {/* FOOTER ──────────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <Button
          variant="primary"
          iconRight={!isSubmitting ? <FiChevronRight /> : null}
          onClick={handleAvanzarClick}
          className={styles.continueBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? "PROCESANDO..." : "CONTINUAR"}
        </Button>
      </div>

      <UbicacionModal
        isOpen={modalUbicacionOpen}
        onClose={() => setUbicacionModalOpen(false)}
        onGuardar={handleGuardarUbicacion}
      />
      <ContactoModal
        isOpen={modalContactoOpen}
        onClose={() => setContactoModalOpen(false)}
        onGuardar={handleGuardarContacto}
      />
    </div>
  );
}
