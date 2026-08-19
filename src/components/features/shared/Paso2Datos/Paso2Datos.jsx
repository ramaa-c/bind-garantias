import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiEdit2,
  FiChevronRight,
  FiLock,
} from "react-icons/fi";
import { Button } from "../../../ui";
import { UbicacionModal, ContactoModal, FacturacionModal } from "../../../features";
import styles from "./Paso2Datos.module.css";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function Paso2Datos({ onContinuar, isSubmitting }) {
  const { setValue, trigger, control } = useFormContext();

  const [modalUbicacionOpen, setUbicacionModalOpen] = useState(false);
  const [modalContactoOpen, setContactoModalOpen] = useState(false);
  const [modalFacturacionOpen, setFacturacionModalOpen] = useState(false);

  const localidad = useWatch({ control, name: "localidad" });
  const direccion = useWatch({ control, name: "direccion" }) || "";
  const celular = useWatch({ control, name: "celular" }) || "";
  const emailFacturacion = useWatch({ control, name: "emailfacturacion" }) || "";
  const cuit = useWatch({ control, name: "cuit" }) || "";
  const razonSocial =
    useWatch({ control, name: "razonSocial" }) || "Razón Social Desconocida";

  const ubicacionConfirmada =
    useWatch({ control, name: "ubicacionConfirmada" }) || false;

  const ubicacionOk = ubicacionConfirmada && direccion.trim().length >= 5;
  const contactoOk = celular.trim().length >= 8;
  const facturacionOk = EMAIL_REGEX.test(emailFacturacion.trim());
  const puedeContinuar = ubicacionOk && contactoOk && facturacionOk;

  const totalTareas = 3;
  const tareasCompletas =
    (ubicacionOk ? 1 : 0) + (contactoOk ? 1 : 0) + (facturacionOk ? 1 : 0);
  const progresoPct = (tareasCompletas / totalTareas) * 100;

  const inicialEmpresa = razonSocial?.trim()?.charAt(0)?.toUpperCase() || "?";

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

  const handleGuardarFacturacion = () => {
    setFacturacionModalOpen(false);
  };

  const [isValidando, setIsValidando] = useState(false);

  const handleAvanzarClick = async () => {
    if (isValidando) return;
    setIsValidando(true);
    try {
      const esValidoGlobal = await trigger([
        "calle",
        "numero",
        "direccion",
        "provincia",
        "localidad",
        "celular",
        "emailfacturacion",
      ]);
      if (puedeContinuar && esValidoGlobal) {
        await onContinuar();
      }
    } finally {
      setIsValidando(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* PROGRESO ────────────────────────────────────────────────────────────── */}
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>
          {tareasCompletas} de {totalTareas} completado
          {tareasCompletas === 1 ? "" : "s"}
        </span>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${progresoPct === 100 ? styles.progressFillDone : ""}`}
            style={{ transform: `scaleX(${progresoPct / 100})` }}
          />
        </div>
      </div>

      {/* EMPRESA ──────────────────────────────────────────────────────────────── */}
      <div className={styles.empresaCard}>
        <div className={styles.empresaAvatar}>{inicialEmpresa}</div>
        <div className={styles.empresaInfo}>
          <span className={styles.empresaBadge}>
            <FiCheckCircle size={11} /> Socio validado
          </span>
          <h2 className={styles.empresaName}>{razonSocial}</h2>
          <p className={styles.empresaCuit}>CUIT {cuit || "20-12345678-9"}</p>
        </div>
        <span
          className={styles.lockedBadge}
          title="El CUIT ya fue validado y no se puede modificar"
          aria-label="CUIT verificado, no editable"
        >
          <FiLock size={13} />
        </span>
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
          className={`${styles.taskRow} ${ubicacionOk ? styles.rowSuccess : ""}`}
          onClick={() => !isSubmitting && setUbicacionModalOpen(true)}
          style={{
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <span
            className={`${styles.taskIcon} ${ubicacionOk ? styles.iconSuccess : styles.iconWarn}`}
          >
            {ubicacionOk ? <FiCheckCircle size={17} /> : <FiMapPin size={17} />}
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
            className={`${styles.taskAction} ${ubicacionOk ? styles.taskActionEdit : ""}`}
          >
            {ubicacionOk ? (
              <>
                <FiEdit2 size={12} /> Modificar
              </>
            ) : (
              <>
                Completar <FiChevronRight size={13} />
              </>
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
          className={`${styles.taskRow} ${contactoOk ? styles.rowSuccess : ""}`}
          onClick={() => !isSubmitting && setContactoModalOpen(true)}
          style={{
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <span
            className={`${styles.taskIcon} ${contactoOk ? styles.iconSuccess : styles.iconWarn}`}
          >
            {contactoOk ? <FiCheckCircle size={17} /> : <FiPhone size={17} />}
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
            className={`${styles.taskAction} ${contactoOk ? styles.taskActionEdit : ""}`}
          >
            {contactoOk ? (
              <>
                <FiEdit2 size={12} /> Modificar
              </>
            ) : (
              <>
                Verificar <FiChevronRight size={13} />
              </>
            )}
          </span>
        </div>

        {/* FACTURACIÓN */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (!isSubmitting && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setFacturacionModalOpen(true);
            }
          }}
          className={`${styles.taskRow} ${facturacionOk ? styles.rowSuccess : ""}`}
          onClick={() => !isSubmitting && setFacturacionModalOpen(true)}
          style={{
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <span
            className={`${styles.taskIcon} ${facturacionOk ? styles.iconSuccess : styles.iconWarn}`}
          >
            {facturacionOk ? <FiCheckCircle size={17} /> : <FiMail size={17} />}
          </span>

          <div className={styles.taskInfo}>
            <strong className={styles.taskTitle}>Email de Facturación</strong>
            <span className={styles.taskSub}>
              {facturacionOk ? emailFacturacion : "Ingresar email para tus facturas"}
            </span>
          </div>

          <span
            className={`${styles.taskAction} ${facturacionOk ? styles.taskActionEdit : ""}`}
          >
            {facturacionOk ? (
              <>
                <FiEdit2 size={12} /> Modificar
              </>
            ) : (
              <>
                Completar <FiChevronRight size={13} />
              </>
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
          disabled={isSubmitting || !puedeContinuar}
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
      <FacturacionModal
        isOpen={modalFacturacionOpen}
        onClose={() => setFacturacionModalOpen(false)}
        onGuardar={handleGuardarFacturacion}
      />
    </div>
  );
}
