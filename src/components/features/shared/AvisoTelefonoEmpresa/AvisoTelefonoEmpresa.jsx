import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiPhone, FiMail, FiUserPlus, FiAlertCircle, FiClock } from "react-icons/fi";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useSocioWebPorId, useActualizarSocio, useUsuariosVinculadosASocio } from "../../../../hooks/useSocios";
import { usuarioVinculacionService } from "../../../../services/usuarioVinculacionService";
import { obtenerDatosTokenApi } from "../../../../api/tokenApi";
import { useChannel } from "../../../../context/useChannel";
import ContactoModal from "../ContactoModal/ContactoModal";
import FacturacionModal from "../FacturacionModal/FacturacionModal";
import styles from "./AvisoTelefonoEmpresa.module.css";

const esquemaFacturacion = z.object({
  emailfacturacion: z.string().trim().min(1, "Ingresá un email").email("Ingresá un email válido"),
});

const claveTelefonoOmitido = (socioId) => `bind_telefono_omitido_${socioId}`;

const telefonoYaOmitido = (socioId) => {
  try {
    return sessionStorage.getItem(claveTelefonoOmitido(socioId)) === "1";
  } catch {
    return false;
  }
};

const marcarTelefonoOmitido = (socioId) => {
  try {
    sessionStorage.setItem(claveTelefonoOmitido(socioId), "1");
  } catch {
    return;
  }
};

export const AvisoTelefonoEmpresa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { basePath } = useChannel();
  const queryClient = useQueryClient();
  const [contactoAbierto, setContactoAbierto] = useState(false);
  const [omitidoEnSesion, setOmitidoEnSesion] = useState(null);
  const [facturacionAbierta, setFacturacionAbierta] = useState(false);
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
    { conDetalle: false },
  );
  const cuitLimpio = String(cuitActivo || "").replace(/\D/g, "");
  const { data: invitaciones } = useQuery({
    queryKey: ["usuarioVinculacion", "lista", cuitLimpio],
    queryFn: () => usuarioVinculacionService.listarInvitaciones(cuitLimpio),
    enabled: isVendor && !!cuitLimpio,
    staleTime: 1000 * 60,
  });

  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const enUsuarios = location.pathname.endsWith("/usuarios");
  const faltaTelefono = !telefono;
  const faltaEmailFacturacion = !emailFacturacion;
  const puedeValidarTelefono = esAdminEmpresa && !isVendor;
  const faltaUsuario =
    isVendor && !cargandoUsuarios && !usuariosVinculados.some((u) => String(u.usuarioWebId) !== String(miUsuarioWebId));
  const hayInvitacionPendiente = (invitaciones || []).some((inv) => String(inv.vinculado ?? "") !== "1");

  const visible = !isLoading && !!socioIdActivo && !!nombreEmpresa && !enAltaDatosEmpresa;
  const omitido = omitidoEnSesion === socioIdActivo || telefonoYaOmitido(socioIdActivo);
  const modalTelefonoAbierta =
    visible && puedeValidarTelefono && faltaTelefono && (contactoAbierto || !omitido);

  const pendienteTelefono = faltaTelefono && !isVendor;

  if (!visible || (!pendienteTelefono && !faltaEmailFacturacion && !faltaUsuario)) {
    return null;
  }

  const textoPrincipal = isVendor
    ? "Para que la empresa pueda avanzar falta:"
    : "Para avanzar con tus solicitudes y la migración a SGR+ falta:";

  const omitirTelefono = () => {
    marcarTelefonoOmitido(socioIdActivo);
    setOmitidoEnSesion(socioIdActivo);
    setContactoAbierto(false);
  };

  const abrirContacto = () => {
    metodosContacto.reset({ celular: "", celularVerificado: "" });
    setContactoAbierto(true);
  };

  const guardarTelefono = () => {
    const celular = metodosContacto.getValues("celular");
    setContactoAbierto(false);
    marcarTelefonoOmitido(socioIdActivo);
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

  const abrirFacturacion = () => {
    metodosFacturacion.reset({ emailfacturacion: "" });
    setFacturacionAbierta(true);
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

  return (
    <div className={styles.contenedor}>
      <div className={styles.aviso} role="alert">
        <span className={styles.icono} aria-hidden="true">
          <FiAlertCircle />
        </span>
        <p className={styles.texto}>{textoPrincipal}</p>
        <div className={styles.pendientes}>
          {faltaUsuario &&
            (hayInvitacionPendiente ? (
              <button
                type="button"
                className={`${styles.pendiente} ${styles.pendienteEspera}`}
                onClick={() => navigate(`${basePath}/usuarios`)}
                disabled={enUsuarios}
                title="Ya invitaste a un usuario de la empresa: falta que acepte la invitación."
              >
                <FiClock aria-hidden="true" /> Usuario invitado: falta que acepte
              </button>
            ) : (
              <button
                type="button"
                className={styles.pendiente}
                onClick={() => navigate(`${basePath}/usuarios`)}
                disabled={enUsuarios}
                title="El primer usuario que vincules queda como administrador y su email pasa a ser el de la empresa."
              >
                <FiUserPlus aria-hidden="true" /> Vincular un usuario
              </button>
            ))}
          {pendienteTelefono &&
            (puedeValidarTelefono ? (
              <button
                type="button"
                className={styles.pendiente}
                onClick={abrirContacto}
                disabled={!socioWeb || actualizarSocioMutation.isPending}
                title="Sin teléfono validado no se puede aceptar la solicitud ni migrar a SGR+."
              >
                <FiPhone aria-hidden="true" /> Validar teléfono
              </button>
            ) : (
              <span
                className={`${styles.pendiente} ${styles.pendienteEspera}`}
                title="Lo valida un administrador de la empresa desde Mi perfil."
              >
                <FiPhone aria-hidden="true" /> Teléfono: lo valida un administrador
              </span>
            ))}
          {faltaEmailFacturacion && (
            <button
              type="button"
              className={styles.pendiente}
              onClick={abrirFacturacion}
              disabled={!socioWeb || actualizarSocioMutation.isPending}
              title={
                isVendor
                  ? "Cargalo si lo conocés, o lo va a completar el usuario de la empresa."
                  : "Sin email de facturación no se puede aceptar la solicitud ni migrar a SGR+."
              }
            >
              <FiMail aria-hidden="true" /> Cargar email de facturación
            </button>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default AvisoTelefonoEmpresa;
