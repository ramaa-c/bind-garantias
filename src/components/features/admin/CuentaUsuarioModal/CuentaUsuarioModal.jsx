import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FiUser, FiLock, FiAlertCircle, FiShield } from "react-icons/fi";
import {
  Modal,
  Button,
  InputSimple,
  InputPasswordSeguro,
  Skeleton,
} from "../../../ui";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  useObtenerPorNombreOEmail,
  useActualizarUsuario,
  useCambiarPassword,
} from "../../../../hooks/useUsuario";
import {
  esClaveActualIncorrecta,
  esDemasiadosIntentos,
} from "../../../../utils/usuarioUtils";
import { cerrarSesionLocal } from "../../../../api/axios";
import { mensajeNegocio } from "../../../../utils/mensajesError";
import styles from "./CuentaUsuarioModal.module.css";

const usernameSchema = z.object({
  denominacion: z
    .string()
    .trim()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(60, "Máximo 60 caracteres"),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z
      .string()
      .min(12, "Mínimo 12 caracteres")
      .max(128, "Máximo 128 caracteres")
      .regex(/[a-z]/, "Incluir una minúscula")
      .regex(/[A-Z]/, "Incluir una mayúscula")
      .regex(/[0-9]/, "Incluir un número")
      .regex(/[!_.*@#$%^&()\-+]/, "Incluir un caracter especial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "Debe ser distinta de la contraseña actual",
    path: ["newPassword"],
  });

const extraerRegistroUsuario = (db) => {
  if (!db) return null;
  if (Array.isArray(db)) return db[0] || null;
  if (db.items) return db.items[0] || null;
  if (db.data) return db.data[0] || null;
  return db;
};

export const CuentaUsuarioModal = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [seccionMovil, setSeccionMovil] = useState("usuario");

  const { data: usuarioDb, isPending: isLoadingUsuario } =
    useObtenerPorNombreOEmail(isOpen ? user?.email || "" : "");

  const registro = extraerRegistroUsuario(usuarioDb);
  const usuarioWebId =
    registro?.usuariowebid ?? registro?.UsuarioWebID ?? registro?.id ?? null;
  const denominacionActual = registro?.denominacion ?? registro?.Denominacion ?? "";

  const actualizarUsuarioMutation = useActualizarUsuario();
  const cambiarPasswordMutation = useCambiarPassword();

  const {
    control: usernameControl,
    handleSubmit: handleUsernameSubmit,
    reset: resetUsernameForm,
    formState: { errors: usernameErrors, isDirty: usernameIsDirty },
  } = useForm({
    resolver: zodResolver(usernameSchema),
    defaultValues: { denominacion: "" },
  });

  useEffect(() => {
    if (isOpen && usuarioWebId) {
      resetUsernameForm({ denominacion: denominacionActual || "" });
    }
  }, [isOpen, usuarioWebId, denominacionActual, resetUsernameForm]);

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isValid: isPasswordValid },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watchPassword("newPassword") || "";
  const confirmPasswordValue = watchPassword("confirmPassword") || "";

  useEffect(() => {
    if (!isOpen) {
      resetPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  }, [isOpen, resetPasswordForm]);

  const onSubmitUsername = (formData) => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      return;
    }
    const denominacion = formData.denominacion.trim();

    actualizarUsuarioMutation.mutate(
      { ...registro, usuariowebid: usuarioWebId, denominacion },
      {
        onSuccess: () => {
          toast.success("Nombre de usuario actualizado correctamente");
          setUser({ ...user, nombre: denominacion });
          resetUsernameForm({ denominacion });
        },
        onError: (error) => {
          const status = error?.response?.status;
          const mensaje = error?.response?.data?.message;
          toast.error(
            status && status < 500 ? "No se pudo actualizar" : "Error de servidor",
            {
              description:
                mensaje ||
                "Ocurrió un error al actualizar el nombre de usuario. Intentá nuevamente.",
            },
          );
        },
      },
    );
  };

  const onSubmitPassword = (formData) => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      return;
    }

    cambiarPasswordMutation.mutate(
      {
        usuarioid: usuarioWebId,
        data: { oldpassword: formData.oldPassword, newpassword: formData.newPassword },
      },
      {
        onSuccess: () => {
          cerrarSesionLocal({
            tipo: "success",
            titulo: "Contraseña actualizada",
            descripcion: "Cambiaste tu contraseña: volvé a ingresar.",
          });
        },
        onError: (error) => {
          const status = error?.response?.status;
          if (esDemasiadosIntentos(error)) {
            toast.error("Demasiados intentos", {
              description: mensajeNegocio(error, "Intentá nuevamente más tarde."),
            });
            return;
          }
          if (esClaveActualIncorrecta(error)) {
            setPasswordError("oldPassword", {
              type: "server",
              message: "La contraseña actual es incorrecta",
            });
            return;
          }
          if (status === 401) {
            cerrarSesionLocal();
            return;
          }
          if (status === 400) {
            setPasswordError("newPassword", {
              type: "server",
              message: mensajeNegocio(error, "La contraseña nueva no es válida"),
            });
            return;
          }
          if (status === 403) {
            toast.error("No se pudo actualizar la contraseña", {
              description: mensajeNegocio(
                error,
                "Revisá los datos ingresados e intentá nuevamente.",
              ),
            });
            return;
          }
          toast.error("Error de servidor", {
            description:
              "No pudimos actualizar tu contraseña. Intentá nuevamente más tarde.",
          });
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mi cuenta"
      subtitle="Tu nombre de usuario y tu contraseña de acceso."
      icono={<FiUser />}
      maxWidth="780px"
      variant="blue"
      footer={
        <Button variant="adminNeutro" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {isLoadingUsuario ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.9rem 1rem", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "0.75rem" }}>
            <Skeleton width="2.6rem" height="2.6rem" radius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="55%" height="0.9rem" />
              <Skeleton width="30%" height="0.7rem" style={{ marginTop: "0.45rem" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{ flex: "1 1 16rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <Skeleton width="50%" height="0.9rem" />
                <Skeleton width="80%" height="0.7rem" />
                <Skeleton width="100%" height="2.6rem" radius="0.5rem" />
                <Skeleton width="9rem" height="2.2rem" radius="0.5rem" style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        </div>
      ) : !usuarioWebId ? (
        <div className={styles.avisoNoDisponible}>
          <FiAlertCircle />
          <p>
            No pudimos identificar tu cuenta de usuario. Intentá nuevamente más
            tarde.
          </p>
        </div>
      ) : (
        <div className={styles.modalBody}>
          <div className={styles.identityCard}>
            <div className={styles.identityAvatar} aria-hidden="true">
              {(user?.email || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className={styles.identityTextos}>
              <p className={styles.identityEmail}>{user?.email}</p>
              <p className={styles.identityRole}>Administrador</p>
            </div>
            <span className={styles.identityChip}>
              <FiShield aria-hidden="true" /> Admin
            </span>
          </div>

          <div className={styles.selectorMovil} role="tablist" aria-label="Qué querés cambiar">
            <button
              type="button"
              role="tab"
              aria-selected={seccionMovil === "usuario"}
              className={seccionMovil === "usuario" ? styles.selectorActivo : ""}
              onClick={() => setSeccionMovil("usuario")}
            >
              Usuario
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={seccionMovil === "password"}
              className={seccionMovil === "password" ? styles.selectorActivo : ""}
              onClick={() => setSeccionMovil("password")}
            >
              Contraseña
            </button>
          </div>

          <div className={styles.columnsGrid}>
            <form
              className={`${styles.sectionGroup} ${seccionMovil !== "usuario" ? styles.ocultoMovil : ""}`}
              onSubmit={handleUsernameSubmit(onSubmitUsername)}
              noValidate
            >
              <h4 className={styles.sectionTitle}>
                <FiUser /> Nombre de usuario
              </h4>
              <p className={styles.sectionHint}>
                Este nombre se muestra en el panel de administración.
              </p>
              <div className={styles.sectionBody}>
                <InputSimple
                  name="denominacion"
                  control={usernameControl}
                  label="Nombre de usuario"
                  error={usernameErrors.denominacion}
                  disabled={actualizarUsuarioMutation.isPending}
                />
              </div>
              <div className={styles.sectionActions}>
                <Button
                  type="submit"
                  variant="adminSuave"
                  size="sm"
                  isLoading={actualizarUsuarioMutation.isPending}
                  disabled={!usernameIsDirty}
                >
                  Guardar nombre
                </Button>
              </div>
            </form>

            <form
              className={`${styles.sectionGroup} ${seccionMovil !== "password" ? styles.ocultoMovil : ""}`}
              onSubmit={handlePasswordSubmit(onSubmitPassword)}
              noValidate
            >
              <h4 className={styles.sectionTitle}>
                <FiLock /> Contraseña
              </h4>
              <p className={styles.sectionHint}>
                Usá una contraseña que no utilices en otros sitios.
              </p>

              <div className={styles.sectionBody}>
                <InputSimple
                  name="oldPassword"
                  control={passwordControl}
                  label="Contraseña actual"
                  type="password"
                  error={passwordErrors.oldPassword}
                  disabled={cambiarPasswordMutation.isPending}
                />

                <Controller
                  name="newPassword"
                  control={passwordControl}
                  render={({ field }) => (
                    <InputPasswordSeguro
                      {...field}
                      label="Nueva contraseña"
                      currentValue={newPasswordValue}
                      email={user?.email || ""}
                      esValido={!passwordErrors.newPassword && !!newPasswordValue}
                      disabled={cambiarPasswordMutation.isPending}
                      theme="blue"
                    />
                  )}
                />

                <InputSimple
                  name="confirmPassword"
                  control={passwordControl}
                  label="Confirmar nueva contraseña"
                  type="password"
                  esValido={
                    !!confirmPasswordValue &&
                    newPasswordValue === confirmPasswordValue &&
                    !passwordErrors.confirmPassword
                  }
                  error={passwordErrors.confirmPassword}
                  disabled={cambiarPasswordMutation.isPending}
                />
              </div>

              <div className={styles.sectionActions}>
                <Button
                  type="submit"
                  variant="adminSuave"
                  size="sm"
                  isLoading={cambiarPasswordMutation.isPending}
                  disabled={!isPasswordValid}
                >
                  Cambiar contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CuentaUsuarioModal;
