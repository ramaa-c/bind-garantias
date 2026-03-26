import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiPhone,
  FiEdit2,
  FiChevronRight
} from "react-icons/fi";
import { Button } from "../../../ui";
import { ModalUbicacion, ModalContacto } from "../../../features";
import styles from "./Paso2Datos.module.css";

export default function Paso2Datos({ onVolver, onContinuar }) {
  const { setValue, getValues, trigger } = useFormContext();

  const [modalUbicacionOpen, setModalUbicacionOpen] = useState(false);
  const [modalContactoOpen, setModalContactoOpen] = useState(false);
  const [intentoAvanzar, setIntentoAvanzar] = useState(false);

  const [displayData, setDisplayData] = useState({
    direccion: "",
    localidad: "",
    celular: "",
    smsVerificado: false,
    cuit: "",
  });

  useEffect(() => {
    const vals = getValues();
    setDisplayData({
      direccion: vals.direccion || "",
      localidad: vals.localidad || "",
      celular: vals.celular || "",
      smsVerificado: vals.smsVerificado || false,
      cuit: vals.cuit || "",
    });
  }, [getValues]);

  const ubicacionOk = displayData.direccion.trim().length >= 5;
  const contactoOk = !!displayData.smsVerificado;

  const handleGuardarUbicacion = () => {
    const nuevosValores = getValues();
    setDisplayData((prev) => ({
      ...prev,
      direccion: nuevosValores.direccion || "",
      localidad: nuevosValores.localidad || "",
    }));
    setModalUbicacionOpen(false);
  };

  const handleGuardarContacto = () => {
    setValue("smsVerificado", true, {
      shouldValidate: true,
      shouldDirty: true,
    });

    const nuevosValores = getValues();
    setDisplayData((prev) => ({
      ...prev,
      celular: nuevosValores.celular || "",
      smsVerificado: true,
    }));
    setModalContactoOpen(false);
  };

  const handleAvanzarClick = async () => {
    setIntentoAvanzar(true);
    const esValidoGlobal = await trigger([
      "direccion",
      "provincia",
      "localidad",
      "celular",
    ]);

    if (ubicacionOk && contactoOk && esValidoGlobal) {
      onContinuar();
    }
  };

  const getClassUbicacion = () => {
    if (ubicacionOk) return styles.statusCheck;
    if (intentoAvanzar && !ubicacionOk) return styles.statusError;
    return styles.statusWarn;
  };

  const getClassContacto = () => {
    if (contactoOk) return styles.statusCheck;
    if (intentoAvanzar && !contactoOk) return styles.statusError;
    return styles.statusWarn;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSteps}>
        <h3 className={styles.title}>Información de la Solicitud</h3>
        <p className={styles.mutedText}>
          Completá los datos requeridos para la validación final.
        </p>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryInfo}>
          <div className={styles.summaryStatus}>
            <FiCheckCircle size={14} /> CUIT VALIDADO
          </div>
          <p className={styles.summaryCuit}>
            {displayData.cuit || "20-12345678-9"}
          </p>
          <p className={styles.summaryName}>EMPRESA DE PRUEBA S.A.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={styles.actionBtn}
          onClick={onVolver}
        >
          <FiEdit2 /> EDITAR
        </Button>
      </div>

      <div className={styles.sectionGroup}>
        {/* CARD 1: UBICACIÓN */}
        <div
          className={`${styles.taskCard} ${ubicacionOk ? styles.cardSuccess : intentoAvanzar && !ubicacionOk ? styles.cardError : ""}`}
          onClick={() => setModalUbicacionOpen(true)}
        >
          <div className={styles.taskCardInfo}>
            <div className={`${styles.statusIconPill} ${getClassUbicacion()}`}>
              {ubicacionOk ? (
                <FiCheckCircle />
              ) : intentoAvanzar ? (
                <FiAlertCircle />
              ) : (
                <FiMapPin />
              )}
            </div>
            <div className={styles.taskCardText}>
              <h4>Datos de Ubicación</h4>
              <p>
                {ubicacionOk && displayData.direccion
                  ? `${displayData.direccion}, ${displayData.localidad}`
                  : "Dirección, Provincia y Localidad"}
              </p>
            </div>
          </div>

          {ubicacionOk ? (
            <Button
              variant="ghost"
              size="sm"
              className={styles.actionBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalUbicacionOpen(true);
              }}
            >
              <FiEdit2 size={12} /> MODIFICAR
            </Button>
          ) : (
            <Button variant="outline" size="sm" className={styles.taskBtn}>
              COMPLETAR
            </Button>
          )}
        </div>

        {/* CARD 2: CONTACTO / SMS */}
        <div
          className={`${styles.taskCard} ${contactoOk ? styles.cardSuccess : intentoAvanzar && !contactoOk ? styles.cardError : ""}`}
          onClick={() => setModalContactoOpen(true)}
          style={{ marginTop: "1rem" }}
        >
          <div className={styles.taskCardInfo}>
            <div className={`${styles.statusIconPill} ${getClassContacto()}`}>
              {contactoOk ? (
                <FiCheckCircle />
              ) : intentoAvanzar ? (
                <FiAlertCircle />
              ) : (
                <FiPhone />
              )}
            </div>
            <div className={styles.taskCardText}>
              <h4>Verificación de Contacto</h4>
              <p>
                {contactoOk
                  ? `Cel: ${displayData.celular}`
                  : "Validación mediante SMS"}
              </p>
            </div>
          </div>

          {contactoOk ? (
            <Button
              variant="ghost"
              size="sm"
              className={styles.actionBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalContactoOpen(true);
              }}
            >
              <FiEdit2 size={12} /> MODIFICAR
            </Button>
          ) : (
            <Button variant="outline" size="sm" className={styles.taskBtn}>
              VERIFICAR
            </Button>
          )}
        </div>
      </div>

      <div className={styles.actionsRight}>
        <Button
          variant="primary"
          iconRight={<FiChevronRight />}
          onClick={handleAvanzarClick}
          className={styles.tallButton}
        >
          CONTINUAR
        </Button>
      </div>

      <ModalUbicacion
        isOpen={modalUbicacionOpen}
        onClose={() => setModalUbicacionOpen(false)}
        onGuardar={handleGuardarUbicacion}
      />

      <ModalContacto
        isOpen={modalContactoOpen}
        onClose={() => setModalContactoOpen(false)}
        onGuardar={handleGuardarContacto}
      />
    </div>
  );
}
