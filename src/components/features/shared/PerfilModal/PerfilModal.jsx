import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  FiUser,
  FiLock,
  FiBriefcase,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiEdit2,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import { Modal, Button, InputSimple, InputPasswordSeguro, Skeleton } from "../../../ui";
import UbicacionModal from "../UbicacionModal/UbicacionModal";
import ContactoModal from "../ContactoModal/ContactoModal";
import FacturacionModal from "../FacturacionModal/FacturacionModal";
import { AltaDatosEmpresaSchema } from "../../../../schemas/AltaDatosEmpresaSchema";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useSocioWebPorId, useActualizarSocio } from "../../../../hooks/useSocios";
import {
  useObtenerPorNombreOEmail,
  useActualizarUsuario,
  useCambiarPassword,
} from "../../../../hooks/useUsuario";
import {
  obtenerInicialesEmpresa,
  obtenerVarianteAvatarEmpresa,
} from "../../../../utils/empresaAvatar";
import sidebarStyles from "../../../layout/Client/Sidebar/Sidebar.module.css";
import paso2Styles from "../Paso2Datos/Paso2Datos.module.css";
import styles from "./PerfilModal.module.css";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

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

// Provincia no se persiste en el Socio (ver comentario en AltaDatosEmpresa.jsx)
// - arranca vacía y el usuario la vuelve a elegir dentro de UbicacionModal, tal
// como ya ocurre al retomar un onboarding incompleto.
const construirValoresEmpresa = (socio) => {
  const calle = socio?.calle || "";
  const numero = Number(socio?.numero) || 0;
  const celular = socio?.telefono || "";
  return {
    cuit: socio?.cuit || "",
    razonSocial: socio?.denominacion || "",
    calle,
    sinNumero: !numero,
    numero: numero || "",
    piso: socio?.piso || "",
    departamento: socio?.departamento || "",
    direccion: `${calle} ${numero || ""}`.trim(),
    provincia: "",
    provinciaid: 0,
    ciudad: "",
    ciudadid: 0,
    localidad: socio?.partido || "",
    localidadid: 0,
    codpos: socio?.codpos || "",
    celular,
    // Asumimos validado el número ya guardado: si el usuario no lo toca,
    // ContactoModal deja pasar directo sin re-pedir el SMS.
    celularVerificado: celular,
    emailfacturacion: socio?.emailfacturacion || "",
  };
};

export const PerfilModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const emailUsuario =
    typeof user === "string" ? user : user?.email ? String(user.email) : "Usuario";

  const [tab, setTab] = useState("empresa");
  const [modalUbicacionOpen, setUbicacionModalOpen] = useState(false);
  const [modalContactoOpen, setContactoModalOpen] = useState(false);
  const [modalFacturacionOpen, setFacturacionModalOpen] = useState(false);

  const {
    socioIdActivo,
    nombreEmpresa,
    cuitActivo,
    isLoading: isLoadingEmpresa,
  } = useEmpresaActiva(!isOpen);
  const hayEmpresa = !!socioIdActivo;

  const { data: socioWeb, isPending: isPendingSocioWeb } = useSocioWebPorId(
    isOpen ? socioIdActivo : undefined,
  );
  const actualizarSocioMutation = useActualizarSocio();

  useEffect(() => {
    if (isOpen) setTab(hayEmpresa ? "empresa" : "cuenta");
  }, [isOpen, hayEmpresa]);

  const metodosEmpresa = useForm({
    resolver: zodResolver(AltaDatosEmpresaSchema),
    mode: "onTouched",
    defaultValues: construirValoresEmpresa(null),
  });
  const { control: controlEmpresa, reset: resetEmpresa, getValues: getValoresEmpresa } =
    metodosEmpresa;

  useEffect(() => {
    if (isOpen && socioWeb) {
      resetEmpresa(construirValoresEmpresa(socioWeb));
    }
  }, [isOpen, socioWeb, resetEmpresa]);

  const direccion = useWatch({ control: controlEmpresa, name: "direccion" }) || "";
  const localidadTexto = useWatch({ control: controlEmpresa, name: "localidad" }) || "";
  const celular = useWatch({ control: controlEmpresa, name: "celular" }) || "";
  const emailFacturacion =
    useWatch({ control: controlEmpresa, name: "emailfacturacion" }) || "";

  const ubicacionOk = direccion.trim().length >= 5;
  const contactoOk = celular.trim().length >= 8;
  const facturacionOk = EMAIL_REGEX.test(emailFacturacion.trim());

  const guardarCambiosSocio = (overrides) => {
    if (!socioWeb || !socioIdActivo) return;
    actualizarSocioMutation.mutate(
      { ...socioWeb, socioid: Number(socioIdActivo), ...overrides },
      {
        onSuccess: () => {
          toast.success("Datos de la empresa actualizados correctamente");
          queryClient.invalidateQueries({
            queryKey: ["sociosWeb", "detalle", Number(socioIdActivo)],
          });
        },
        onError: () => {
          toast.error("No se pudo actualizar", {
            description: "Ocurrió un error al guardar los cambios. Intentá nuevamente.",
          });
        },
      },
    );
  };

  const handleGuardarUbicacion = () => {
    const data = getValoresEmpresa();
    guardarCambiosSocio({
      calle: data.calle,
      numero: Number(data.numero) || 0,
      piso: data.piso || "",
      departamento: data.departamento || "",
      ciudadid: data.ciudadid ? Number(data.ciudadid) : null,
      partido: data.localidad,
      partidoid: data.localidadid ? Number(data.localidadid) : null,
      codpos: data.codpos || "",
    });
    setUbicacionModalOpen(false);
  };

  const handleGuardarContacto = () => {
    const data = getValoresEmpresa();
    guardarCambiosSocio({ telefono: data.celular });
    setContactoModalOpen(false);
  };

  const handleGuardarFacturacion = () => {
    const data = getValoresEmpresa();
    guardarCambiosSocio({ emailfacturacion: data.emailfacturacion });
    setFacturacionModalOpen(false);
  };

  const { data: usuarioDb, isPending: isLoadingUsuario } = useObtenerPorNombreOEmail(
    isOpen ? emailUsuario : "",
  );
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
      toast.error("No se pudo identificar tu cuenta; recargá la página e intentá de nuevo.");
      return;
    }
    const denominacion = formData.denominacion.trim();

    actualizarUsuarioMutation.mutate(
      { ...registro, usuariowebid: usuarioWebId, denominacion },
      {
        onSuccess: () => {
          toast.success("Nombre de usuario actualizado correctamente");
          resetUsernameForm({ denominacion });
        },
        onError: (error) => {
          const status = error?.response?.status;
          const mensaje = error?.response?.data?.message;
          toast.error(status && status < 500 ? "No se pudo actualizar" : "Error de servidor", {
            description:
              mensaje || "Ocurrió un error al actualizar el nombre de usuario. Intentá nuevamente.",
          });
        },
      },
    );
  };

  const onSubmitPassword = (formData) => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar tu cuenta; recargá la página e intentá de nuevo.");
      return;
    }

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
            description: "No pudimos actualizar tu contraseña. Intentá nuevamente más tarde.",
          });
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MI PERFIL"
      subtitle="Gestioná los datos de tu empresa y el acceso a tu cuenta."
      maxWidth="46rem"
    >
      <div className={styles.modalBody}>
        <div className={styles.identityCard}>
          {hayEmpresa ? (
            <div
              className={`${sidebarStyles.companyAvatar} ${sidebarStyles[`avatar--${obtenerVarianteAvatarEmpresa(nombreEmpresa || "")}`]} ${styles.identityAvatarSize}`}
            >
              {obtenerInicialesEmpresa(nombreEmpresa || "")}
            </div>
          ) : (
            <div className={styles.identityAvatarUser}>
              <FaRegUserCircle />
            </div>
          )}
          <div className={styles.identityInfo}>
            <p className={styles.identityName}>
              {hayEmpresa ? nombreEmpresa : emailUsuario}
            </p>
            <p className={styles.identityMeta}>
              {hayEmpresa ? `CUIT ${cuitActivo} · ${emailUsuario}` : "Sin empresa vinculada"}
            </p>
          </div>
        </div>

        {hayEmpresa && (
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "empresa" ? styles.tabBtnActive : ""}`}
              onClick={() => setTab("empresa")}
            >
              <FiBriefcase /> <span>Datos de la empresa</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "cuenta" ? styles.tabBtnActive : ""}`}
              onClick={() => setTab("cuenta")}
            >
              <FiUser /> <span>Mi cuenta</span>
            </button>
          </div>
        )}

        {tab === "empresa" && hayEmpresa && (
          <>
            {isLoadingEmpresa || isPendingSocioWeb ? (
              <div className={styles.skeletonStack}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="4.25rem" radius="0.9rem" />
                ))}
              </div>
            ) : (
              <FormProvider {...metodosEmpresa}>
                <div className={paso2Styles.taskList}>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setUbicacionModalOpen(true);
                      }
                    }}
                    className={`${paso2Styles.taskRow} ${ubicacionOk ? paso2Styles.rowSuccess : ""}`}
                    onClick={() => setUbicacionModalOpen(true)}
                  >
                    <span
                      className={`${paso2Styles.taskIcon} ${ubicacionOk ? paso2Styles.iconSuccess : paso2Styles.iconWarn}`}
                    >
                      {ubicacionOk ? <FiCheckCircle size={17} /> : <FiMapPin size={17} />}
                    </span>
                    <div className={paso2Styles.taskInfo}>
                      <strong className={paso2Styles.taskTitle}>Datos de Ubicación</strong>
                      <span className={paso2Styles.taskSub}>
                        {ubicacionOk && direccion
                          ? `${direccion}${localidadTexto ? `, ${localidadTexto}` : ""}`
                          : "Dirección, Provincia y Localidad"}
                      </span>
                    </div>
                    <span
                      className={`${paso2Styles.taskAction} ${ubicacionOk ? paso2Styles.taskActionEdit : ""}`}
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

                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setContactoModalOpen(true);
                      }
                    }}
                    className={`${paso2Styles.taskRow} ${contactoOk ? paso2Styles.rowSuccess : ""}`}
                    onClick={() => setContactoModalOpen(true)}
                  >
                    <span
                      className={`${paso2Styles.taskIcon} ${contactoOk ? paso2Styles.iconSuccess : paso2Styles.iconWarn}`}
                    >
                      {contactoOk ? <FiCheckCircle size={17} /> : <FiPhone size={17} />}
                    </span>
                    <div className={paso2Styles.taskInfo}>
                      <strong className={paso2Styles.taskTitle}>Verificación de Contacto</strong>
                      <span className={paso2Styles.taskSub}>
                        {contactoOk ? `Cel: ${celular}` : "Ingresar teléfono celular"}
                      </span>
                    </div>
                    <span
                      className={`${paso2Styles.taskAction} ${contactoOk ? paso2Styles.taskActionEdit : ""}`}
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

                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFacturacionModalOpen(true);
                      }
                    }}
                    className={`${paso2Styles.taskRow} ${facturacionOk ? paso2Styles.rowSuccess : ""}`}
                    onClick={() => setFacturacionModalOpen(true)}
                  >
                    <span
                      className={`${paso2Styles.taskIcon} ${facturacionOk ? paso2Styles.iconSuccess : paso2Styles.iconWarn}`}
                    >
                      {facturacionOk ? <FiCheckCircle size={17} /> : <FiMail size={17} />}
                    </span>
                    <div className={paso2Styles.taskInfo}>
                      <strong className={paso2Styles.taskTitle}>Email de Facturación</strong>
                      <span className={paso2Styles.taskSub}>
                        {facturacionOk ? emailFacturacion : "Ingresar email para tus facturas"}
                      </span>
                    </div>
                    <span
                      className={`${paso2Styles.taskAction} ${facturacionOk ? paso2Styles.taskActionEdit : ""}`}
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
              </FormProvider>
            )}
          </>
        )}

        {tab === "cuenta" && (
          isLoadingUsuario ? (
            <div className={styles.skeletonStack}>
              <Skeleton width="100%" height="6rem" radius="0.9rem" />
              <Skeleton width="100%" height="10rem" radius="0.9rem" />
            </div>
          ) : !usuarioWebId ? (
            <div className={styles.avisoNoDisponible}>
              <FiAlertCircle />
              <p>No pudimos identificar tu cuenta de usuario. Intentá nuevamente más tarde.</p>
            </div>
          ) : (
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
                  Este nombre se muestra dentro de la plataforma.
                </p>
                <div className={styles.sectionBody}>
                  <InputSimple
                    name="denominacion"
                    control={usernameControl}
                    label="Nombre de usuario"
                    variant="client"
                    error={usernameErrors.denominacion}
                    disabled={actualizarUsuarioMutation.isPending}
                  />
                </div>
                <div className={styles.sectionActions}>
                  <Button
                    type="submit"
                    variant="primary"
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
                    variant="client"
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
                        email={emailUsuario}
                        esValido={!passwordErrors.newPassword && !!newPasswordValue}
                        disabled={cambiarPasswordMutation.isPending}
                      />
                    )}
                  />

                  <InputSimple
                    name="confirmPassword"
                    control={passwordControl}
                    label="Confirmar nueva contraseña"
                    type="password"
                    variant="client"
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
                    variant="primary"
                    isLoading={cambiarPasswordMutation.isPending}
                    disabled={!isPasswordValid}
                  >
                    ACTUALIZAR CONTRASEÑA
                  </Button>
                </div>
              </form>
            </div>
          )
        )}
      </div>

      <div className={styles.modalFoot}>
        <Button variant="outline" onClick={onClose}>
          CERRAR
        </Button>
      </div>
    </Modal>
  );
};

export default PerfilModal;
