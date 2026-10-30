import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
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
  FiCheckCircle,
  FiEdit2,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import { Modal, Button, InputSimple, InputPasswordSeguro, Skeleton } from "../../../ui";
import UbicacionModal from "../UbicacionModal/UbicacionModal";
import ContactoModal from "../ContactoModal/ContactoModal";
import { AltaDatosEmpresaSchema } from "../../../../schemas/AltaDatosEmpresaSchema";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useSocioWebPorId, useActualizarSocio } from "../../../../hooks/useSocios";
import { useVendor } from "../../../../hooks/useVendor";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { obtenerDatosEmpresaPorCuit } from "../../../../utils/datosEmpresaPorCuit";
import {
  extraerRegistroUsuario,
  esClaveActualIncorrecta,
  esDemasiadosIntentos,
} from "../../../../utils/usuarioUtils";
import { cerrarSesionLocal } from "../../../../api/axios";
import { mensajeNegocio } from "../../../../utils/mensajesError";
import {
  useObtenerPorNombreOEmail,
  useActualizarUsuario,
  useCambiarPassword,
} from "../../../../hooks/useUsuario";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";
import paso2Styles from "../Paso2Datos/Paso2Datos.module.css";
import styles from "./PerfilModal.module.css";

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

// Provincia no se persiste en el Socio (ver comentario en AltaDatosEmpresa.jsx)
// - arranca vacía/con lo que haya en ciudadid/partidoid y se corrige apenas
// abre el modal con la misma re-consulta por CUIT que usa el Paso 2 (ver
// efecto de triangulación más abajo), en vez de forzar al usuario a elegir
// todo de cero como pasaba antes.
const construirValoresEmpresa = (socio) => {
  const calle = socio?.calle || "";
  const numero = Number(socio?.numero) || 0;
  const celular = socio?.telefono || "";
  const localidad = socio?.partido || "";
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
    provinciaid: Number(socio?.provinciaid) || 0,
    ciudad: localidad,
    ciudadid: Number(socio?.ciudadid) || 0,
    localidad,
    localidadid: Number(socio?.partidoid) || 0,
    codpos: socio?.codpos || "",
    celular,
    // Asumimos validado el número ya guardado: si el usuario no lo toca,
    // ContactoModal deja pasar directo sin re-pedir el SMS.
    celularVerificado: celular,
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

  const {
    socioIdActivo,
    nombreEmpresa,
    cuitActivo,
    esAdminEmpresa,
    isLoading: isLoadingEmpresa,
  } = useEmpresaActiva(!isOpen);
  // Durante el alta de empresa (paso 1 y paso 2) la empresa todavía no
  // terminó de darse de alta: mismo criterio que Sidebar/Navbar
  // (enAltaDatosEmpresa), no se ofrece editar sus datos desde el perfil.
  // Antes en paso 2 el socio ya existía (socioIdActivo seteado) y aparecía
  // la pestaña "Datos de la empresa".
  const location = useLocation();
  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const hayEmpresa = !!socioIdActivo && !enAltaDatosEmpresa;

  // Un vendor sin empresa activa (ej. abrió "Mi perfil" desde Seleccionar
  // Empresa antes de elegir una) no necesariamente "no tiene empresa
  // vinculada" - puede tener varias y todavía no eligió ninguna en esta
  // sesión. Mostrar esa leyenda ahí sería engañoso, así que la identityCard
  // completa (avatar + "Sin empresa vinculada") se oculta solo para ese
  // caso puntual; el resto de la modal (Mi cuenta) ya se comporta bien.
  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;
  const ocultarIdentityCard = isVendor && !hayEmpresa;
  const puedeEditarTelefono = esAdminEmpresa && !isVendor;

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

  // Triangulación de Provincia (ver AltaDatosEmpresa.jsx/Paso 2): es el
  // único campo de ubicación que el backend nunca persiste en el Socio, así
  // que se resuelve consultando Nosis/AFIP por CUIT (mismo utilitario que
  // Paso1) y matcheando el nombre contra el catálogo. A diferencia del
  // Paso 2 (onboarding, sin datos previos confiables), acá Ciudad/Localidad
  // SÍ vienen persistidas y ya se seedearon bien desde el propio socio en
  // construirValoresEmpresa (ciudadid/partidoid) - pisarlas con lo que
  // devuelva Nosis/AFIP (que ni siquiera trae esos IDs, ver
  // datosEmpresaPorCuit.js) las dejaba en null y por eso no aparecía la
  // ciudad. UbicacionModal deriva Localidad sola a partir de la Ciudad ya
  // seedeada (mismo mecanismo que el wizard), sin necesitar este re-fetch.
  // Sin shouldDirty: es una corrección automática, no una edición del
  // usuario - no debe habilitar por sí sola el botón de Guardar (ver
  // bloquearSinCambios en UbicacionModal).
  const { data: provinciasData, isPending: isPendingProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];
  const resueltoParaCuitRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      resueltoParaCuitRef.current = null;
      return;
    }
    if (!socioWeb || !cuitActivo || isPendingProvincias) return;
    if (resueltoParaCuitRef.current === cuitActivo) return;
    let cancelado = false;

    (async () => {
      try {
        const resultado = await obtenerDatosEmpresaPorCuit(cuitActivo, opcionesProvincias);
        if (cancelado || !resultado.encontrado) return;
        metodosEmpresa.setValue("provincia", resultado.valores.provincia, {
          shouldValidate: true,
        });
        metodosEmpresa.setValue("provinciaid", resultado.valores.provinciaid, {
          shouldValidate: true,
        });
      } catch (e) {
        console.error("[PerfilModal] Error resolviendo ubicación por CUIT:", e);
      } finally {
        if (!cancelado) resueltoParaCuitRef.current = cuitActivo;
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, socioWeb, cuitActivo, isPendingProvincias]);

  const direccion = useWatch({ control: controlEmpresa, name: "direccion" }) || "";
  const localidadTexto = useWatch({ control: controlEmpresa, name: "localidad" }) || "";
  const celular = useWatch({ control: controlEmpresa, name: "celular" }) || "";

  const ubicacionOk = direccion.trim().length >= 5;
  const contactoOk = celular.trim().length >= 8;

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
        onError: (error) => {
          toast.error("No se pudo actualizar", {
            description: mensajeNegocio(
              error,
              "Ocurrió un error al guardar los cambios. Intentá nuevamente.",
            ),
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
    trigger: triggerPassword,
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

  // Mismo fix que CrearClave.jsx: con resolver, RHF solo revalida el campo
  // que cambió - si "confirmPassword" ya tenía el error "no coinciden" (del
  // .refine() cruzado del schema) y el usuario corrige "newPassword" en vez
  // de "confirmPassword" para que vuelvan a coincidir, el mensaje queda
  // pegado para siempre sin este trigger manual. Solo dispara si
  // confirmPassword ya tiene valor o error viejo, para no marcar "no
  // coinciden" contra un campo que el usuario todavía ni tocó.
  useEffect(() => {
    if (confirmPasswordValue || passwordErrors.confirmPassword) {
      triggerPassword("confirmPassword");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPasswordValue, triggerPassword]);

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
            description: "No pudimos actualizar tu contraseña. Intentá nuevamente más tarde.",
          });
        },
      },
    );
  };

  // Secciones del menú de "Mi perfil": "Mi empresa" solo existe con una
  // empresa activa ya dada de alta (ver hayEmpresa más arriba).
  const secciones = [
    ...(hayEmpresa
      ? [
          {
            key: "empresa",
            label: "Mi empresa",
            icon: FiBriefcase,
            hint: "Datos que podés actualizar vos mismo.",
          },
        ]
      : []),
    {
      key: "cuenta",
      label: "Mi cuenta",
      icon: FiUser,
      hint: "Este nombre se muestra dentro de la plataforma.",
    },
    // Pestaña propia: así el formulario de contraseña conserva su armado
    // original (la lista de requisitos pegada debajo de "Nueva contraseña")
    // en vez de repartirse en columnas.
    {
      key: "seguridad",
      label: "Seguridad",
      icon: FiLock,
      hint: "Usá una contraseña que no uses en otros sitios.",
    },
  ];
  const seccionActiva = secciones.find((s) => s.key === tab) || secciones[0];
  const tabRefs = useRef({});

  // Navegación con flechas/Home/End entre pestañas (patrón WAI-ARIA de
  // tablist): solo la pestaña activa queda en el orden de Tab, el resto se
  // alcanza con las flechas - sirve igual para el menú vertical de
  // escritorio y para los segmentos horizontales de mobile.
  const handleTabKeyDown = (e, index) => {
    const ultimo = secciones.length - 1;
    let siguiente = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") siguiente = index === ultimo ? 0 : index + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") siguiente = index === 0 ? ultimo : index - 1;
    else if (e.key === "Home") siguiente = 0;
    else if (e.key === "End") siguiente = ultimo;
    if (siguiente === null) return;
    e.preventDefault();
    const destino = secciones[siguiente].key;
    setTab(destino);
    tabRefs.current[destino]?.focus();
  };

  // Mismo bloque de carga/error para "Mi cuenta" y "Seguridad": los dos
  // formularios dependen de haber identificado al usuario web.
  const renderEstadoUsuario = (alturas) =>
    isLoadingUsuario ? (
      <div className={styles.skeletonStack}>
        {alturas.map((alto, i) => (
          <Skeleton key={i} width="100%" height={alto} radius="0.9rem" />
        ))}
      </div>
    ) : !usuarioWebId ? (
      <div className={styles.avisoNoDisponible}>
        <FiAlertCircle />
        <p>No pudimos identificar tu cuenta de usuario. Intentá nuevamente más tarde.</p>
      </div>
    ) : null;

  const nombreVisible = denominacionActual || emailUsuario.split("@")[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="50rem">
      {/* Opción C: cabecera con el usuario y la empresa como chip, pestañas
          subrayadas debajo. Sin título del Modal: la cabecera hace de
          título y el botón de cerrar flota arriba a la derecha. */}
      <div className={styles.hero}>
        <div className={styles.heroIdentidad}>
          <span className={styles.heroAvatar} aria-hidden="true">
            {obtenerInicialesEmpresa(nombreVisible)}
          </span>
          <div className={styles.heroTextos}>
            <h2 className={styles.heroNombre}>{nombreVisible}</h2>
            <p className={styles.heroEmail}>{emailUsuario}</p>
            {hayEmpresa ? (
              <span className={styles.heroEmpresa}>
                <FiBriefcase aria-hidden="true" /> {nombreEmpresa}
                {cuitActivo ? ` · CUIT ${cuitActivo}` : ""}
              </span>
            ) : (
              !ocultarIdentityCard && (
                <span className={styles.heroEmpresa}>Sin empresa vinculada</span>
              )
            )}
          </div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Secciones de mi perfil">
          {secciones.map((seccion, index) => {
            const Icono = seccion.icon;
            const activa = seccion.key === seccionActiva.key;
            return (
              <button
                key={seccion.key}
                ref={(el) => {
                  tabRefs.current[seccion.key] = el;
                }}
                type="button"
                role="tab"
                id={`perfil-tab-${seccion.key}`}
                aria-selected={activa}
                aria-controls="perfil-panel"
                tabIndex={activa ? 0 : -1}
                className={`${styles.tab} ${activa ? styles.tabActiva : ""}`}
                onClick={() => setTab(seccion.key)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
              >
                <Icono aria-hidden="true" />
                {seccion.label}
              </button>
            );
          })}
        </div>
      </div>

      <section
        id="perfil-panel"
        role="tabpanel"
        aria-labelledby={`perfil-tab-${seccionActiva.key}`}
        className={styles.panel}
      >
        <p className={styles.panelHint}>{seccionActiva.hint}</p>

              {seccionActiva.key === "empresa" &&
                (isLoadingEmpresa || isPendingSocioWeb ? (
                  <div className={styles.skeletonStack}>
                    {Array.from({ length: 2 }).map((_, i) => (
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
                          <strong className={paso2Styles.taskTitle}>Datos de ubicación</strong>
                          <span className={paso2Styles.taskSub}>
                            {ubicacionOk && direccion
                              ? `${direccion}${localidadTexto ? `, ${localidadTexto}` : ""}`
                              : "Dirección, provincia y localidad"}
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
                        role={puedeEditarTelefono ? "button" : undefined}
                        tabIndex={puedeEditarTelefono ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (puedeEditarTelefono && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            setContactoModalOpen(true);
                          }
                        }}
                        className={`${paso2Styles.taskRow} ${contactoOk ? paso2Styles.rowSuccess : ""}`}
                        onClick={() => puedeEditarTelefono && setContactoModalOpen(true)}
                        style={puedeEditarTelefono ? undefined : { cursor: "default" }}
                      >
                        <span
                          className={`${paso2Styles.taskIcon} ${contactoOk ? paso2Styles.iconSuccess : paso2Styles.iconWarn}`}
                        >
                          {contactoOk ? <FiCheckCircle size={17} /> : <FiPhone size={17} />}
                        </span>
                        <div className={paso2Styles.taskInfo}>
                          <strong className={paso2Styles.taskTitle}>Verificación de contacto</strong>
                          <span className={paso2Styles.taskSub}>
                            {contactoOk
                              ? `Cel: ${celular}`
                              : puedeEditarTelefono
                                ? "Ingresar teléfono celular"
                                : "Sin teléfono validado"}
                          </span>
                        </div>
                        <span
                          className={`${paso2Styles.taskAction} ${contactoOk ? paso2Styles.taskActionEdit : ""}`}
                        >
                          {!puedeEditarTelefono ? (
                            <>
                              <FiLock size={12} /> Solo administradores
                            </>
                          ) : contactoOk ? (
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
                    </div>

                    <UbicacionModal
                      isOpen={modalUbicacionOpen}
                      onClose={() => setUbicacionModalOpen(false)}
                      onGuardar={handleGuardarUbicacion}
                      bloquearSinCambios
                    />
                    <ContactoModal
                      isOpen={modalContactoOpen}
                      onClose={() => setContactoModalOpen(false)}
                      onGuardar={handleGuardarContacto}
                    />
                  </FormProvider>
                ))}

        {seccionActiva.key === "cuenta" &&
          (renderEstadoUsuario(["5.5rem"]) || (
            <form
              className={styles.formCard}
              onSubmit={handleUsernameSubmit(onSubmitUsername)}
              noValidate
            >
              <h4 className={styles.formTitulo}>
                <FiUser aria-hidden="true" /> Nombre de usuario
              </h4>
              <div className={styles.filaInline}>
                <div className={styles.filaInlineCampo}>
                  <InputSimple
                    name="denominacion"
                    control={usernameControl}
                    label="Nombre de usuario"
                    variant="client"
                    error={usernameErrors.denominacion}
                    disabled={actualizarUsuarioMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={actualizarUsuarioMutation.isPending}
                  disabled={!usernameIsDirty}
                >
                  Guardar
                </Button>
              </div>
            </form>
          ))}

        {seccionActiva.key === "seguridad" &&
          (renderEstadoUsuario(["16rem"]) || (
            <form
              className={styles.formCard}
              onSubmit={handlePasswordSubmit(onSubmitPassword)}
              noValidate
            >
              <h4 className={styles.formTitulo}>
                <FiLock aria-hidden="true" /> Cambiar contraseña
              </h4>
              <div className={styles.passwordCampos}>
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
              <div className={styles.passwordAcciones}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={cambiarPasswordMutation.isPending}
                  disabled={!isPasswordValid}
                >
                  Actualizar contraseña
                </Button>
              </div>
            </form>
          ))}
      </section>

      <div className={styles.modalFoot}>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};

export default PerfilModal;
