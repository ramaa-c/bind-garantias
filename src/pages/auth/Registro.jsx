import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal/Modal";

import { FiMail } from "react-icons/fi";
import { InputAuth, Button } from "../../components/ui";
import { useCrearUsuario, useResetearPassword } from "../../hooks/useUsuario";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

// --- SCHEMA ---
const registroSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" })
    .toLowerCase()
    .trim(),
});

const Registro = () => {
  const navigate = useNavigate();
  const { mutateAsync: crearUsuario, isPending: registrando } =
    useCrearUsuario();
  const { mutateAsync: reenviarCorreo, isPending: reenviando } =
    useResetearPassword();

  const [modalUsuarioExistente, setModalUsuarioExistente] = useState(false);
  const [emailPendiente, setEmailPendiente] = useState("");

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registroSchema),
  });

  const getCSharpIsoDate = (addYears = 0) => {
    const date = new Date();
    if (addYears) date.setFullYear(date.getFullYear() + addYears);
    return date.toISOString().split(".")[0];
  };

  const onSubmit = async (data) => {
    const payloadSkeletor = {
      email: data.email,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: "",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: "",
    };

    try {
      await crearUsuario(payloadSkeletor);

      toast.success(
        "¡Registro exitoso! Revisá tu casilla de correo para continuar.",
      );

      navigate("/confirmar-correo", {
        replace: true,
        state: {
          usuarioSkeletor: payloadSkeletor,
          canal: "canal1",
        },
      });
    } catch (error) {
      if (error?.response?.status === 409) {
        setEmailPendiente(data.email);
        setModalUsuarioExistente(true);
      } else {
        setError("email", {
          type: "server",
          message:
            error?.response?.data?.message ||
            "Error de conexión. Intentá nuevamente.",
        });
      }
    }
  };

  const handleContinuarProcesoPendiente = async () => {
    const payloadReset = {
      email: emailPendiente,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(),
      hashseguridad: "email",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: "",
    };

    try {
      await reenviarCorreo(payloadReset);

      setModalUsuarioExistente(false);
      toast.success("Enlace enviado", {
        description: "Revisá tu bandeja de entrada o la carpeta de SPAM.",
      });

      navigate("/confirmar-correo", {
        replace: true,
        state: {
          emailIngresado: emailPendiente,
          canal: "canal1",
        },
      });
    } catch (error) {
      toast.error("Error al solicitar el enlace", {
        description:
          error?.response?.data?.message ||
          "Ocurrió un error. Intentá más tarde.",
      });
    }
  };

  const isFormDisabled = registrando || reenviando;

  return (
    <>
      <div className={styles.layoutSplit}>
        <section className={styles.sideForm}>
          <div className={styles.globalLogo}>
            <img
              src={logoBind}
              alt="Logo BIND"
              width="120"
              className={styles.clickableLogo}
              onClick={() => navigate("/")}
            />
          </div>

          <div className={styles.cardModern}>
            <div className={styles.headerText}>
              <h2>Creá tu cuenta</h2>
              <p>Ingresá tu correo electrónico para comenzar.</p>
            </div>

            <form
              className={styles.formContent}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <InputAuth
                name="email"
                control={control}
                label="Correo Electrónico"
                type="email"
                icon={<FiMail size={20} />}
                disabled={isFormDisabled}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isFormDisabled}
                >
                  {registrando ? "REGISTRANDO..." : "REGISTRARSE"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  disabled={isFormDisabled}
                >
                  YA TENGO CUENTA
                </Button>
              </div>
            </form>

            <div className={styles.supportContainerModern}>
              <p>¿Tenés problemas o dudas para registrarte?</p>
              <p>
                Ponete en contacto con nosotros a{" "}
                <a
                  href="mailto:comerciales@bindgarantias.com.ar"
                  className={styles.linkYellow}
                >
                  comerciales@bindgarantias.com.ar
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sideBrand}>
          <div className={styles.brandContent}>
            <h2 className={styles.brandTitle}>
              Potenciando y transformando el <em>financiamiento PyME.</em>
            </h2>
            <p className={styles.brandSubtitle}>
              Accedé a la mejor financiación para tu empresa.
            </p>
          </div>
        </section>
      </div>

      {/* MODAL DE USUARIO EXISTENTE */}
      <Modal
        isOpen={modalUsuarioExistente}
        onClose={() => !reenviando && setModalUsuarioExistente(false)}
        title="Usuario ya registrado"
      >
        <div style={{ padding: "1rem" }}>
          <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
            El correo <strong>{emailPendiente}</strong> ya se encuentra
            registrado en nuestro sistema, pero parece que no has finalizado el
            proceso de creación de contraseña.
          </p>
          <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
            ¿Deseas continuar con el proceso y solicitar un nuevo enlace de
            activación?
          </p>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <Button
              variant="outline"
              onClick={() => setModalUsuarioExistente(false)}
              disabled={reenviando}
            >
              CANCELAR
            </Button>
            <Button
              variant="primary"
              onClick={handleContinuarProcesoPendiente}
              disabled={reenviando}
            >
              {reenviando ? "ENVIANDO..." : "CONTINUAR PROCESO"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Registro;
