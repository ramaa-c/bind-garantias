import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal/Modal";
import { FiMail } from "react-icons/fi";
import { InputSimple, Button } from "../../components/ui";
import { useCrearUsuario, useResetearPassword } from "../../hooks/useUsuario";
import { usuarioService } from "../../services/usuarioService";
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
  const [verificandoEstado, setVerificandoEstado] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailValue = useWatch({ control, name: "email" });

  useEffect(() => {
    if (errors.email?.type === "server" || errors.email?.type === "manual") {
      clearErrors("email");
    }
  }, [emailValue, clearErrors]);

  const getCSharpIsoDate = (addYears = 0) => {
    const date = new Date();
    if (addYears) date.setFullYear(date.getFullYear() + addYears);
    return date.toISOString().split(".")[0];
  };

  const onSubmit = async (data) => {
    const payloadSkeletor = {
      email: data.email,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: "canal1",
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
        setVerificandoEstado(true);
        try {
          const userData = await usuarioService.obtenerPorNombreOEmail(
            data.email,
          );
          const targetUser = Array.isArray(userData)
            ? userData[0]
            : userData?.items?.[0] || userData?.data?.[0] || userData;

          if (targetUser && String(targetUser.debecambiarclave) === "1") {
            setEmailPendiente(data.email);
            setModalUsuarioExistente(true);
          } else {
            setError("email", {
              type: "server",
              message:
                "Ya existe una cuenta con este correo. Intenta iniciar sesión.",
            });
          }
        } catch (fetchError) {
          setError("email", {
            type: "server",
            message: "Este correo ya se encuentra registrado.",
          });
        } finally {
          setVerificandoEstado(false);
        }
      } else {
        // Manejo de errores 500 y otros problemas de red
        if (error?.response?.status >= 500 || !error?.response) {
          clearErrors("email");
          toast.error("Error de servidor", {
            description: "Ocurrió un error. Intentá más tarde.",
          });
        } else {
          setError("email", {
            type: "server",
            message: "Error de conexión. Intentá nuevamente.",
          });
        }
      }
    }
  };

  const handleContinuarProcesoPendiente = async () => {
    const payloadReset = {
      email: emailPendiente,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: "canal1",
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
        description: "Ocurrió un error. Intentá más tarde.",
      });
    }
  };

  const isFormDisabled = registrando || reenviando || verificandoEstado;

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
              <InputSimple
                name="email"
                control={control}
                label="Correo Electrónico"
                type="email"
                disabled={isFormDisabled}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isFormDisabled}
                >
                  {registrando || verificandoEstado
                    ? "PROCESANDO..."
                    : "REGISTRARSE"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
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
        title="Usuario pendiente de activación"
      >
        <div className={styles.modalUsuarioExistente}>
          <p className={styles.modalTexto}>
            El correo{" "}
            <span className={styles.modalEmailDestacado}>{emailPendiente}</span>{" "}
            ya se encuentra registrado, pero el proceso de creación de
            contraseña no fue completado.
          </p>
          <div className={styles.modalAlerta}>
            Te enviaremos un nuevo enlace de activación a esa dirección. Revisá
            tu bandeja de entrada o la carpeta de SPAM.
          </div>
          <div className={styles.modalFooter}>
            <Button
              variant="outline"
              onClick={() => setModalUsuarioExistente(false)}
              disabled={reenviando}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleContinuarProcesoPendiente}
              disabled={reenviando}
            >
              {reenviando ? "Enviando..." : "Reenviar enlace"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Registro;
