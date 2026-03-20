import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiAlertCircle, FiMapPin, FiPhone, FiEdit2 } from "react-icons/fi";
import { Button } from "../../../ui";
import { ModalUbicacion, ModalContacto } from "../../../features";
import styles from "./Paso2Datos.module.css";

export default function Paso2Datos({ onVolver, onContinuar }) {
  const { watch, setValue, register } = useFormContext();

  const [modalUbicacionOpen, setModalUbicacionOpen] = useState(false);
  const [modalContactoOpen, setModalContactoOpen] = useState(false);
  const [intentoAvanzar, setIntentoAvanzar] = useState(false);


  const cuitIngresado = watch("cuit", "");
  const dirValue = watch("direccion") || "";
  const locValue = watch("localidad") || "";
  const celValue = watch("celular") || "";


  const [ubicacionOk, setUbicacionOk] = useState(false);
  const [contactoOk, setContactoOk] = useState(false);


  useEffect(() => {
    if (dirValue.length >= 5) setUbicacionOk(true);
    if (watch("smsVerificado")) setContactoOk(true);
  }, [dirValue, watch]);


  const handleGuardarUbicacion = () => {
    setUbicacionOk(true);
    setModalUbicacionOpen(false);
  };

  const handleGuardarContacto = () => {
    setValue("smsVerificado", true);
    setContactoOk(true);
    setModalContactoOpen(false);
  };

  const handleAvanzarClick = () => {
    setIntentoAvanzar(true);
    if (ubicacionOk && contactoOk) {
      onContinuar();
    }
  };


  const getClassUbicacion = () => {
    if (ubicacionOk) return styles.statusCheck;
    if (intentoAvanzar) return styles.statusError;
    return styles.statusWarn;
  };

  const getClassContacto = () => {
    if (contactoOk) return styles.statusCheck;
    if (intentoAvanzar) return styles.statusError;
    return styles.statusWarn;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSteps}>
        <h3 className={styles.title}>Información de la Solicitud</h3>
        <p className={styles.mutedText}>Completá los datos requeridos para la validación final.</p>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryInfo}>
          <div className={styles.summaryStatus}><FiCheckCircle size={14} /> CUIT VALIDADO</div>
          <p className={styles.summaryCuit}>{cuitIngresado || "20-12345678-9"}</p>
          <p className={styles.summaryName}>EMPRESA DE PRUEBA S.A.</p>
        </div>
        <button className={styles.btnEdit} onClick={onVolver}><FiEdit2 /> EDITAR</button>
      </div>

      <div className={styles.sectionGroup}>
        {/* CARD 1: UBICACIÓN */}
        <div
          className={`${styles.taskCard} ${ubicacionOk ? styles.cardSuccess : intentoAvanzar && !ubicacionOk ? styles.cardError : ""}`}
          onClick={() => setModalUbicacionOpen(true)}
        >
          <div className={styles.taskCardInfo}>
            <div className={`${styles.statusIconPill} ${getClassUbicacion()}`}>
              {ubicacionOk ? <FiCheckCircle /> : intentoAvanzar ? <FiAlertCircle /> : <FiMapPin />}
            </div>
            <div className={styles.taskCardText}>
              <h4>Datos de Ubicación</h4>
              <p>{ubicacionOk && dirValue ? `${dirValue}, ${locValue}` : "Dirección, Provincia y Localidad"}</p>
            </div>
          </div>
          <Button variant={ubicacionOk ? "outline" : "primary"} size="sm" className={styles.taskBtn}>
            {ubicacionOk ? "MODIFICAR" : "COMPLETAR"}
          </Button>
        </div>

        {/* CARD 2: CONTACTO / SMS */}
        <div
          className={`${styles.taskCard} ${contactoOk ? styles.cardSuccess : intentoAvanzar && !contactoOk ? styles.cardError : ""}`}
          onClick={() => setModalContactoOpen(true)}
          style={{ marginTop: '15px' }}
        >
          <div className={styles.taskCardInfo}>
            <div className={`${styles.statusIconPill} ${getClassContacto()}`}>
              {contactoOk ? <FiCheckCircle /> : intentoAvanzar ? <FiAlertCircle /> : <FiPhone />}
            </div>
            <div className={styles.taskCardText}>
              <h4>Verificación de Contacto</h4>
              <p>{contactoOk ? `Cel: ${celValue}` : "Validación mediante SMS"}</p>
            </div>
          </div>
          <Button variant={contactoOk ? "outline" : "primary"} size="sm" className={styles.taskBtn}>
            {contactoOk ? "MODIFICAR" : "VERIFICAR"}
          </Button>
        </div>
      </div>

      <div className={styles.actionsRight}>
        <Button variant="primary" onClick={handleAvanzarClick} className={styles.tallButton}>
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
      <div style={{ display: "none" }}>
        <input {...register("direccion")} />
        <input {...register("provincia")} />
        <input {...register("localidad")} />
        <input {...register("celular")} />
        <input {...register("smsVerificado")} />
      </div>
    </div>
  );
}