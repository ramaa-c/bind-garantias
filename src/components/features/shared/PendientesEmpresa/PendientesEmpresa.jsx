import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiMail,
  FiPhone,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useCadenaActiva } from "../../../../hooks/useCadenaActiva";
import {
  useSocioWebPorId,
  useActualizarSocio,
  useUsuariosVinculadosASocio,
  useTieneCertificadoPyme,
  useBloqueoLegajo,
} from "../../../../hooks/useSocios";
import { usuarioVinculacionService } from "../../../../services/usuarioVinculacionService";
import { obtenerDatosTokenApi } from "../../../../api/tokenApi";
import { useChannel } from "../../../../context/useChannel";
import ContactoModal from "../ContactoModal/ContactoModal";
import FacturacionModal from "../FacturacionModal/FacturacionModal";
import styles from "./PendientesEmpresa.module.css";

const esquemaFacturacion = z.object({
  emailfacturacion: z.string().trim().min(1, "Ingresá un email").email("Ingresá un email válido"),
});

const MEDIA_HOJA = "(max-width: 39.99rem)";
const DURACION_TODO_EN_ORDEN_MS = 5000;

const leerSesion = (clave) => {
  try {
    return sessionStorage.getItem(clave) === "1";
  } catch {
    return false;
  }
};

const marcarSesion = (clave) => {
  try {
    sessionStorage.setItem(clave, "1");
  } catch {
    return;
  }
};

const claveTelefonoOmitido = (socioId) => `bind_telefono_omitido_${socioId}`;
const claveAvisoBloqueo = (socioId) => `bind_pendientes_aviso_${socioId}`;

const SECCIONES = [
  { nivel: "bloqueo", titulo: "Frena el envío a BIND", icono: <FiX /> },
  { nivel: "pendiente", titulo: "Para completar", icono: <FiAlertCircle /> },
  { nivel: "espera", titulo: "En espera", icono: <FiClock /> },
];

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

const textosBoton = (items) => {
  const cuenta = (nivel) => items.filter((i) => i.nivel === nivel).length;
  const bloqueos = cuenta("bloqueo");
  const pendientes = cuenta("pendiente");
  const esperas = cuenta("espera");

  if (bloqueos > 0) {
    const resto = pendientes + esperas;
    return {
      tono: "bloqueo",
      etiqueta: "Acción requerida",
      texto:
        items.length === 1
          ? items[0].corto
          : [plural(bloqueos, "bloqueo", "bloqueos"), resto > 0 && plural(resto, "pendiente", "pendientes")]
              .filter(Boolean)
              .join(" · "),
    };
  }
  if (pendientes > 0) {
    return {
      tono: "pendiente",
      etiqueta: "Pendientes",
      texto:
        items.length === 1
          ? items[0].corto
          : [`${pendientes} para completar`, esperas > 0 && `${esperas} en espera`].filter(Boolean).join(" · "),
    };
  }
  return {
    tono: "espera",
    etiqueta: "En espera",
    texto: items.length === 1 ? items[0].corto : `${esperas} en espera`,
  };
};

const useEsHoja = () => {
  const [esHoja, setEsHoja] = useState(() => window.matchMedia(MEDIA_HOJA).matches);
  useEffect(() => {
    const media = window.matchMedia(MEDIA_HOJA);
    const actualizar = () => setEsHoja(media.matches);
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);
  return esHoja;
};

export const PendientesEmpresa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { basePath } = useChannel();
  const queryClient = useQueryClient();
  const esHoja = useEsHoja();
  const contenedorRef = useRef(null);
  const hojaRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [contactoAbierto, setContactoAbierto] = useState(false);
  const [omitidoEnSesion, setOmitidoEnSesion] = useState(null);
  const [facturacionAbierta, setFacturacionAbierta] = useState(false);
  const [avisoBloqueoVisto, setAvisoBloqueoVisto] = useState(null);
  const [todoEnOrden, setTodoEnOrden] = useState(false);

  const {
    socioIdActivo,
    cuitActivo,
    nombreEmpresa,
    telefono,
    emailFacturacion,
    esAdminEmpresa,
    isVendor,
    isLoading,
  } = useEmpresaActiva();
  const { cadenaId } = useCadenaActiva();
  const { data: socioWeb } = useSocioWebPorId(socioIdActivo);
  const actualizarSocioMutation = useActualizarSocio();
  const metodosFacturacion = useForm({
    resolver: zodResolver(esquemaFacturacion),
    mode: "onTouched",
    defaultValues: { emailfacturacion: "" },
  });
  const metodosContacto = useForm({ defaultValues: { celular: "", celularVerificado: "" } });

  const miUsuarioWebId = obtenerDatosTokenApi()?.usuarioWebId ?? null;
  const { usuariosVinculados, isLoading: cargandoUsuarios } = useUsuariosVinculadosASocio(
    isVendor ? socioIdActivo : null,
  );
  const cuitLimpio = String(cuitActivo || "").replace(/\D/g, "");
  const { data: invitaciones } = useQuery({
    queryKey: ["usuarioVinculacion", "lista", cuitLimpio],
    queryFn: () => usuarioVinculacionService.listarInvitaciones(cuitLimpio),
    enabled: isVendor && !!cuitLimpio,
    staleTime: 1000 * 60,
  });
  const { data: tieneCertificadoPyme, isLoading: cargandoCertificadoPyme } = useTieneCertificadoPyme(socioIdActivo);
  // Con la carga bloqueada (CDA / SGRPlusCore) el aviso de PyME ("podés
  // seguir completando el legajo") contradice al banner de bloqueo de
  // LegajoUniversalBar: en ese caso no se suma acá.
  const { bloqueado: cargaBloqueada, cargando: cargandoBloqueo } = useBloqueoLegajo(
    socioIdActivo,
    cadenaId,
    cuitActivo,
  );

  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const visible = !isLoading && !!socioIdActivo && !!nombreEmpresa && !enAltaDatosEmpresa;

  const faltaTelefono = !telefono && !isVendor;
  const puedeValidarTelefono = esAdminEmpresa && !isVendor;
  const faltaUsuario =
    isVendor && !cargandoUsuarios && !usuariosVinculados.some((u) => String(u.usuarioWebId) !== String(miUsuarioWebId));
  const hayInvitacionPendiente = (invitaciones || []).some((inv) => String(inv.vinculado ?? "") !== "1");
  const faltaCertificadoPyme =
    !cargandoCertificadoPyme && !tieneCertificadoPyme && !cargandoBloqueo && !cargaBloqueada;

  const omitido = omitidoEnSesion === socioIdActivo || leerSesion(claveTelefonoOmitido(socioIdActivo));
  const modalTelefonoAbierta =
    visible && puedeValidarTelefono && faltaTelefono && (contactoAbierto || !omitido);

  const cerrarYEjecutar = (accion) => () => {
    setAbierto(false);
    accion();
  };

  const abrirContacto = () => {
    metodosContacto.reset({ celular: "", celularVerificado: "" });
    setContactoAbierto(true);
  };

  const abrirFacturacion = () => {
    metodosFacturacion.reset({ emailfacturacion: "" });
    setFacturacionAbierta(true);
  };

  const irAUsuarios = () => navigate(`${basePath}/usuarios`);

  const items = !visible
    ? []
    : [
        faltaCertificadoPyme && {
          id: "pyme",
          nivel: "bloqueo",
          icono: <FiFileText />,
          titulo: "Falta el Certificado PyME",
          corto: "Falta Certificado PyME",
          descripcion: (
            <>
              Podés seguir completando el legajo, pero <strong>no lo vamos a poder enviar a BIND</strong> hasta que
              la empresa tenga su Certificado PyME.
            </>
          ),
        },
        faltaUsuario &&
          (hayInvitacionPendiente
            ? {
                id: "invitacion",
                nivel: "espera",
                icono: <FiClock />,
                titulo: "Invitación enviada",
                corto: "Invitación enviada",
                descripcion: "Ya invitaste a un usuario de la empresa: falta que acepte la invitación.",
                accion: { texto: "Ver usuarios", onClick: irAUsuarios, secundaria: true },
              }
            : {
                id: "usuario",
                nivel: "pendiente",
                icono: <FiUserPlus />,
                titulo: "Vincular un usuario de la empresa",
                corto: "Vincular un usuario",
                descripcion:
                  "El primer usuario que vincules queda como administrador y su email pasa a ser el de la empresa.",
                accion: { texto: "Vincular", onClick: irAUsuarios },
              }),
        faltaTelefono &&
          (puedeValidarTelefono
            ? {
                id: "telefono",
                nivel: "pendiente",
                icono: <FiPhone />,
                titulo: "Validar el teléfono de la empresa",
                corto: "Validar teléfono",
                descripcion: "Sin teléfono validado no se puede aceptar la solicitud ni migrar a SGR+.",
                accion: {
                  texto: "Validar teléfono",
                  onClick: abrirContacto,
                  disabled: !socioWeb || actualizarSocioMutation.isPending,
                },
              }
            : {
                id: "telefono",
                nivel: "espera",
                icono: <FiPhone />,
                titulo: "Teléfono sin validar",
                corto: "Teléfono por validar",
                descripcion: "Lo valida un administrador de la empresa desde Mi perfil.",
              }),
        !emailFacturacion && {
          id: "facturacion",
          nivel: "pendiente",
          icono: <FiMail />,
          titulo: "Cargar email de facturación",
          corto: "Email de facturación",
          descripcion: isVendor
            ? "Cargalo si lo conocés, o lo va a completar el usuario de la empresa."
            : "Sin email de facturación no se puede aceptar la solicitud ni migrar a SGR+.",
          accion: {
            texto: "Cargar email",
            onClick: abrirFacturacion,
            disabled: !socioWeb || actualizarSocioMutation.isPending,
          },
        },
      ].filter(Boolean);

  const total = items.length;
  const hayBloqueo = items.some((i) => i.nivel === "bloqueo");

  const cantidadVisible = visible ? total : null;
  const [cantidadAnterior, setCantidadAnterior] = useState(cantidadVisible);
  if (cantidadVisible !== cantidadAnterior) {
    setCantidadAnterior(cantidadVisible);
    setTodoEnOrden(cantidadAnterior > 0 && cantidadVisible === 0);
    if (!cantidadVisible) setAbierto(false);
  }

  useEffect(() => {
    if (!todoEnOrden) return undefined;
    const timer = setTimeout(() => setTodoEnOrden(false), DURACION_TODO_EN_ORDEN_MS);
    return () => clearTimeout(timer);
  }, [todoEnOrden]);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (contenedorRef.current?.contains(e.target) || hojaRef.current?.contains(e.target)) return;
      setAbierto(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const avisoBloqueoYaVisto =
    avisoBloqueoVisto === socioIdActivo || leerSesion(claveAvisoBloqueo(socioIdActivo));
  const mostrarAvisoBloqueo = hayBloqueo && !abierto && !modalTelefonoAbierta && !avisoBloqueoYaVisto;

  const marcarAvisoBloqueoVisto = () => {
    marcarSesion(claveAvisoBloqueo(socioIdActivo));
    setAvisoBloqueoVisto(socioIdActivo);
  };

  const alternar = () => {
    if (hayBloqueo) marcarAvisoBloqueoVisto();
    setAbierto((a) => !a);
  };

  const omitirTelefono = () => {
    marcarSesion(claveTelefonoOmitido(socioIdActivo));
    setOmitidoEnSesion(socioIdActivo);
    setContactoAbierto(false);
  };

  const guardarTelefono = () => {
    const celular = metodosContacto.getValues("celular");
    setContactoAbierto(false);
    marcarSesion(claveTelefonoOmitido(socioIdActivo));
    setOmitidoEnSesion(socioIdActivo);
    if (!socioWeb || !celular) return;
    actualizarSocioMutation.mutate(
      { ...socioWeb, socioid: Number(socioIdActivo), telefono: celular },
      {
        onSuccess: () => {
          toast.success("Teléfono validado");
          queryClient.invalidateQueries({ queryKey: ["sociosWeb", "detalle"] });
        },
        onError: () => {
          toast.error("No se pudo guardar", {
            description: "Ocurrió un error al guardar el teléfono. Intentá nuevamente.",
          });
        },
      },
    );
  };

  const guardarFacturacion = () => {
    if (!socioWeb) return;
    actualizarSocioMutation.mutate(
      {
        ...socioWeb,
        socioid: Number(socioIdActivo),
        emailfacturacion: metodosFacturacion.getValues("emailfacturacion").trim(),
      },
      {
        onSuccess: () => {
          toast.success("Email de facturación guardado");
          queryClient.invalidateQueries({ queryKey: ["sociosWeb", "detalle"] });
        },
        onError: () => {
          toast.error("No se pudo guardar", {
            description: "Ocurrió un error al guardar el email de facturación. Intentá nuevamente.",
          });
        },
      },
    );
    setFacturacionAbierta(false);
  };

  const modales = (
    <>
      <FormProvider {...metodosContacto}>
        <ContactoModal
          isOpen={modalTelefonoAbierta}
          onClose={omitirTelefono}
          onGuardar={guardarTelefono}
          textoCancelar="Omitir por ahora"
          descripcion="Tu empresa todavía no tiene un teléfono validado y sin él no vas a poder avanzar con tus solicitudes ni con la migración a SGR+. Ingresá el número y te enviamos un SMS con un código."
        />
      </FormProvider>
      <FormProvider {...metodosFacturacion}>
        <FacturacionModal
          isOpen={facturacionAbierta}
          onClose={() => setFacturacionAbierta(false)}
          onGuardar={guardarFacturacion}
        />
      </FormProvider>
    </>
  );

  if (total === 0) {
    return (
      <>
        {todoEnOrden && visible && (
          <span className={`${styles.boton} ${styles.tono_ok}`} role="status">
            <span className={styles.botonIcono} aria-hidden="true">
              <FiCheck />
            </span>
            <span className={styles.botonTextos}>
              <small>Empresa</small>
              <b>Todo en orden</b>
            </span>
          </span>
        )}
        {modales}
      </>
    );
  }

  const { tono, etiqueta, texto } = textosBoton(items);
  const iconoTono = tono === "bloqueo" ? <FiX /> : tono === "espera" ? <FiClock /> : <FiAlertCircle />;

  const panel = (
    <div
      ref={hojaRef}
      className={`${styles.panel} ${esHoja ? styles.panelHoja : ""}`}
      role="dialog"
      aria-label="Pendientes de la empresa"
    >
      {esHoja && <span className={styles.asa} aria-hidden="true" />}
      <div className={styles.panelCabecera}>
        <strong>Pendientes de la empresa</strong>
        <span className={styles.panelEmpresa}>{nombreEmpresa}</span>
        {esHoja && (
          <button type="button" className={styles.cerrar} onClick={() => setAbierto(false)} aria-label="Cerrar">
            <FiX />
          </button>
        )}
      </div>
      <div className={styles.panelCuerpo}>
        {SECCIONES.map((seccion) => {
          const delNivel = items.filter((i) => i.nivel === seccion.nivel);
          if (delNivel.length === 0) return null;
          return (
            <section key={seccion.nivel} className={`${styles.seccion} ${styles[`nivel_${seccion.nivel}`]}`}>
              <h3 className={styles.seccionTitulo}>
                <span aria-hidden="true">{seccion.icono}</span>
                {seccion.titulo}
                <span className={styles.seccionCantidad}>{delNivel.length}</span>
              </h3>
              {delNivel.map((item) => (
                <div key={item.id} className={styles.item}>
                  <span className={styles.itemIcono} aria-hidden="true">
                    {item.icono}
                  </span>
                  <div className={styles.itemTextos}>
                    <strong>{item.titulo}</strong>
                    <p>{item.descripcion}</p>
                    {item.accion && (
                      <Button
                        variant={item.accion.secundaria ? "outline" : "primary"}
                        size="sm"
                        className={styles.itemAccion}
                        disabled={item.accion.disabled}
                        onClick={cerrarYEjecutar(item.accion.onClick)}
                      >
                        {item.accion.texto}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <p className={styles.panelPie}>
        <FiAlertCircle aria-hidden="true" /> Cada aviso desaparece solo cuando se resuelve.
      </p>
    </div>
  );

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <button
        type="button"
        className={`${styles.boton} ${styles[`tono_${tono}`]} ${abierto ? styles.botonAbierto : ""}`}
        onClick={alternar}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        aria-label={`${etiqueta}: ${texto}. Ver pendientes de la empresa`}
      >
        {tono === "bloqueo" && <span className={styles.latido} aria-hidden="true" />}
        <span className={styles.botonIcono} aria-hidden="true">
          {iconoTono}
        </span>
        <span className={styles.botonTextos} aria-hidden="true">
          <small>{etiqueta}</small>
          <b>{texto}</b>
        </span>
        <span className={styles.botonCantidad} aria-hidden="true">
          {total}
        </span>
        <FiChevronDown className={styles.botonFlecha} aria-hidden="true" />
      </button>

      {mostrarAvisoBloqueo && (
        <div className={styles.avisoBloqueo} role="status">
          <strong>Tenés un pendiente que frena el envío</strong>
          <span>Acá vas a ver todo lo que le falta a la empresa.</span>
          <div className={styles.avisoBloqueoAcciones}>
            <button type="button" className={styles.avisoBloqueoSecundario} onClick={marcarAvisoBloqueoVisto}>
              Entendido
            </button>
            <button type="button" className={styles.avisoBloqueoPrincipal} onClick={alternar}>
              Ver pendientes
            </button>
          </div>
        </div>
      )}

      {abierto &&
        (esHoja
          ? createPortal(
              <>
                <div className={styles.fondoHoja} aria-hidden="true" onClick={() => setAbierto(false)} />
                {panel}
              </>,
              document.body,
            )
          : panel)}

      {modales}
    </div>
  );
};

export default PendientesEmpresa;
