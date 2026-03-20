import React, { useState } from "react";
import { FiSmartphone, FiX, FiCheckCircle, FiMessageSquare } from "react-icons/fi";
import { useFormContext, useFormState } from "react-hook-form";
import { Button, InputFlotante } from "../../../ui";
import styles from "./ModalContacto.module.css";

export default function ModalContacto({ isOpen, onClose, onGuardar }) {
    const { register, watch, trigger, control, setValue } = useFormContext();
    const { errors, dirtyFields } = useFormState({ control });

    const [fase, setFase] = useState("ingresar");
    const [intentoSolicitarSms, setIntentoSolicitarSms] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [codigoSms, setCodigoSms] = useState("");

    const celVal = watch("celular") || "";

    const errorCel = errors.celular?.message || (intentoSolicitarSms && celVal.replace(/\D/g, "").length < 10 ? "Debe tener 10 números" : null);
    const isCelValido = !errorCel && celVal.replace(/\D/g, "").length === 10 && (dirtyFields.celular || intentoSolicitarSms);

    const handleSolicitarSms = async () => {
        setIntentoSolicitarSms(true);
        const okZod = await trigger(["celular"]);

        if (okZod && celVal.replace(/\D/g, "").length === 10) {
            setFase("verificar");
        }
    };

    const handleVerificarSms = () => {
        if (codigoSms.length === 6 && !procesando) {
            setProcesando(true);
            setFase("exito");

            setTimeout(() => {
                onGuardar();

                setTimeout(() => {
                    setFase("ingresar");
                    setCodigoSms("");
                    setProcesando(false);
                }, 300);
            }, 1200);
        }
    };

    const handleClose = () => {
        if (procesando) return;
        setFase("ingresar");
        setCodigoSms("");
        onClose();
    };

    // TRUCO PARA EVITAR CIERRE AL ARRASTRAR
    const handleOverlayMouseDown = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
            <div className={styles.modalContainer}>

                {!procesando && (
                    <button className={styles.btnClose} onClick={handleClose} aria-label="Cerrar">
                        <FiX size={20} />
                    </button>
                )}

                <div className={styles.body}>

                    {fase === "ingresar" && (
                        <>
                            <div className={styles.iconWrapper}>
                                <FiSmartphone size={30} />
                            </div>
                            <h2 className={styles.title}>Verificá tu celular</h2>
                            <p className={styles.description}>
                                Ingresá tu número. Te enviaremos un SMS con un código de validación.
                            </p>
                            <div className={styles.formSection}>
                                <InputFlotante
                                    label="Celular (Sin 0 ni 15)"
                                    maxLength={10}
                                    error={errorCel}
                                    esValido={isCelValido}
                                    {...register("celular", {
                                        onChange: (e) => {
                                            const nums = e.target.value.replace(/\D/g, "");
                                            setValue("celular", nums, { shouldValidate: true });
                                        }
                                    })}
                                />
                            </div>
                            <div className={styles.btnSave}>
                                <Button variant="primary" onClick={handleSolicitarSms} style={{ width: '100%', height: '48px' }}>
                                    ENVIAR CÓDIGO SMS
                                </Button>
                            </div>
                        </>
                    )}

                    {fase === "verificar" && (
                        <>
                            <div className={styles.iconWrapperSuccess}>
                                <FiMessageSquare size={30} />
                            </div>
                            <h2 className={styles.title}>Código enviado</h2>
                            <p className={styles.description}>
                                Ingresalo a continuación. <br />
                                <span className={styles.linkEdit} onClick={() => setFase("ingresar")}>¿Te equivocaste de número?</span>
                            </p>
                            <div className={styles.formSection}>
                                <InputFlotante
                                    label="Código de verificación"
                                    value={codigoSms}
                                    maxLength={6}
                                    onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, ""))}
                                    esValido={codigoSms.length === 6}
                                />
                            </div>
                            <div className={styles.btnSave}>
                                <Button
                                    variant="primary"
                                    onClick={handleVerificarSms}
                                    disabled={codigoSms.length < 6 || procesando}
                                    style={{ width: '100%', height: '48px' }}
                                >
                                    VERIFICAR IDENTIDAD
                                </Button>
                            </div>
                            <p className={styles.resendText}>
                                ¿No recibiste el código? <span className={styles.resendLink}>Reenviar SMS</span>
                            </p>
                        </>
                    )}

                    {fase === "exito" && (
                        <div style={{ animation: "scaleIn 0.5s ease", textAlign: 'center' }}>
                            <div className={styles.iconWrapperSuccess} style={{ margin: "0 auto 20px auto" }}>
                                <FiCheckCircle size={40} />
                            </div>
                            <h2 className={styles.title}>¡Celular Verificado!</h2>
                            <p className={styles.description}>
                                Guardando tus datos para continuar...
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}