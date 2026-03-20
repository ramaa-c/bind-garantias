import React, { useState } from "react";
import { FiMapPin, FiX } from "react-icons/fi";
import { useFormContext, useFormState } from "react-hook-form";
import { Button, InputFlotante } from "../../../ui";
import styles from "./ModalUbicacion.module.css";

export default function ModalUbicacion({ isOpen, onClose, onGuardar }) {
    const { register, watch, trigger, control } = useFormContext();
    const { errors, dirtyFields } = useFormState({ control });

    const [intentoGuardar, setIntentoGuardar] = useState(false);

    const dirVal = watch("direccion") || "";
    const provVal = watch("provincia") || "";
    const locVal = watch("localidad") || "";

    const errorDir = errors.direccion?.message || (intentoGuardar && dirVal.trim().length < 5 ? "Mínimo 5 caracteres" : null);
    const errorProv = errors.provincia?.message || (intentoGuardar && provVal.trim().length < 3 ? "Requerido" : null);
    const errorLoc = errors.localidad?.message || (intentoGuardar && locVal.trim().length < 3 ? "Requerido" : null);

    const isDirValido = !errorDir && dirVal.trim().length >= 5 && (dirtyFields.direccion || intentoGuardar);
    const isProvValido = !errorProv && provVal.trim().length >= 3 && (dirtyFields.provincia || intentoGuardar);
    const isLocValido = !errorLoc && locVal.trim().length >= 3 && (dirtyFields.localidad || intentoGuardar);

    const handleGuardar = async () => {
        setIntentoGuardar(true);
        const okZod = await trigger(["direccion", "provincia", "localidad"]);

        if (okZod && dirVal.trim().length >= 5 && provVal.trim().length >= 3 && locVal.trim().length >= 3) {
            setIntentoGuardar(false);
            onGuardar();
        }
    };

    // TRUCO PARA EVITAR CIERRE AL ARRASTRAR
    const handleOverlayMouseDown = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
            <div className={styles.modalContainer}>
                <button className={styles.btnClose} onClick={onClose}>
                    <FiX size={20} />
                </button>

                <div className={styles.body}>
                    <div className={styles.iconWrapper}>
                        <FiMapPin size={30} />
                    </div>

                    <h2 className={styles.title}>Datos de Ubicación</h2>
                    <p className={styles.description}>
                        Ingresá el domicilio fiscal de la empresa.
                    </p>

                    <div className={styles.formSection}>
                        <InputFlotante
                            label="Dirección"
                            error={errorDir}
                            esValido={isDirValido}
                            {...register("direccion")}
                        />
                        <div className={styles.inputRow}>
                            <InputFlotante
                                label="Provincia"
                                error={errorProv}
                                esValido={isProvValido}
                                {...register("provincia")}
                            />
                            <InputFlotante
                                label="Localidad"
                                error={errorLoc}
                                esValido={isLocValido}
                                {...register("localidad")}
                            />
                        </div>
                    </div>

                    <div className={styles.btnSave}>
                        <Button variant="primary" onClick={handleGuardar} style={{ width: '100%', height: '48px' }}>
                            GUARDAR DATOS
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}