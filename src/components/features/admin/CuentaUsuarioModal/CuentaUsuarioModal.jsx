import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FiUser, FiLock, FiAlertCircle } from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import {
  Modal,
  Button,
  InputSimple,
  InputPasswordSeguro,
  Spinner,
} from "../../../ui";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  useObtenerPorNombreOEmail,
  useActualizarUsuario,
  useCambiarPassword,
} from "../../../../hooks/useUsuario";
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

  const isMock =
    user?.email === "admin" ||
    user?.email === "admin_restricto" ||
    user?.email === "admin restricto";

  const { data: usuarioDb, isPending: isLoadingUsuario } =
    useObtenerPorNombreOEmail(isOpen && !isMock ? user?.email || "" : "");

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
    if (!usuarioWebId) return;
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
    if (!usuarioWebId) return;

    cambiarPasswordMutation.mutate(
      {
        usuarioid: usuarioWebId,
        data: { oldpassword: formData.oldPassword, newpassword: formData.newPassword },
      },
      {
        onSuccess: () => {
          toast.success("Contraseña actualizada correctamente");
          resetPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (error) => {
          const status = error?.response?.status;
          if (status === 400 || status === 401 || status === 403) {
            setPasswordError("oldPassword", {
              type: "server",
              message: "La contraseña actual es incorrecta",
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
      title="MI CUENTA"
      subtitle="Gestioná tu nombre de usuario y tu contraseña de acceso."
      maxWidth="760px"
      variant="blue"
    >
      {isMock ? (
        <div className={styles.avisoNoDisponible}>
          <FiAlertCircle />
          <p>
            Esta función no está disponible para este tipo de acceso.
          </p>
        </div>
      ) : isLoadingUsuario ? (
        <div className={styles.loadingWrap}>
          <Spinner />
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
            <div className={styles.identityAvatar}>
              <FaRegUserCircle />
            </div>
            <div>
              <p className={styles.identityEmail}>{user?.email}</p>
              <p className={styles.identityRole}>Administrador</p>
            </div>
          </div>

          <div className={styles.columnsGrid}>
            <form
              className={styles.sectionGroup}
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
                  variant="blue"
                  isLoading={actualizarUsuarioMutation.isPending}
                  disabled={!usernameIsDirty}
                >
                  GUARDAR NOMBRE
                </Button>
              </div>
            </form>

            <form
              className={styles.sectionGroup}
              onSubmit={handlePasswordSubmit(onSubmitPassword)}
              noValidate
            >
              <h4 className={styles.sectionTitle}>
                <FiLock /> Cambiar contraseña
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
                  variant="blue"
                  isLoading={cambiarPasswordMutation.isPending}
                  disabled={!isPasswordValid}
                >
                  ACTUALIZAR CONTRASEÑA
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.modalFoot}>
        <Button variant="outlineBlue" onClick={onClose}>
          CERRAR
        </Button>
      </div>
    </Modal>
  );
};

export default CuentaUsuarioModal;
