import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiPhone, FiMail, FiUserPlus, FiChevronRight } from "react-icons/fi";
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

  if (!visible || (!faltaTelefono && !faltaEmailFacturacion && !faltaUsuario)) {
    return null;
  }

  const textoTelefono = isVendor
    ? "La empresa todavía no tiene un teléfono validado. Lo valida el administrador de la empresa cuando ingresa a su cuenta: sin teléfono no se puede aceptar la solicitud ni migrar a SGR+."
    : puedeValidarTelefono
      ? "Tu empresa no tiene un teléfono validado. Hasta que lo valides no vas a poder avanzar con tus solicitudes ni con la migración a SGR+."
      : "Tu empresa no tiene un teléfono validado y sin él no se puede avanzar. Pedile a un administrador de la empresa que lo valide desde Mi perfil.";

  const textoEmail = isVendor
    ? "La empresa todavía no tiene email de facturación: sin él no se puede aceptar la solicitud ni migrar a SGR+. Cargalo si lo conocés, o lo va a completar el usuario de la empresa."
    : "Tu empresa no tiene email de facturación. Hasta que lo cargues no vas a poder avanzar con tus solicitudes ni con la migración a SGR+.";

  const textoUsuario = hayInvitacionPendiente
    ? "Ya invitaste a un usuario de la empresa: falta que acepte la invitación. Hasta que haya un usuario vinculado la empresa no puede migrar a SGR+."
    : "Tenés que vincular al menos un usuario de la empresa. El primero que vincules queda como administrador y su email pasa a ser el de la empresa.";

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
      {faltaUsuario && (
        <div className={styles.aviso} role="alert">
          <span className={styles.icono} aria-hidden="true">
            <FiUserPlus />
          </span>
          <p className={styles.texto}>{textoUsuario}</p>
          {!enUsuarios && (
            <button type="button" className={styles.accion} onClick={() => navigate(`${basePath}/usuarios`)}>
              {hayInvitacionPendiente ? "Ver usuarios" : "Vincular usuario"} <FiChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {faltaTelefono && (
        <div className={styles.aviso} role="alert">
          <span className={styles.icono} aria-hidden="true">
            <FiPhone />
          </span>
          <p className={styles.texto}>{textoTelefono}</p>
          {puedeValidarTelefono && (
            <button
              type="button"
              className={styles.accion}
              onClick={abrirContacto}
              disabled={!socioWeb || actualizarSocioMutation.isPending}
            >
              Validar teléfono <FiChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {faltaEmailFacturacion && (
        <div className={styles.aviso} role="alert">
          <span className={styles.icono} aria-hidden="true">
            <FiMail />
          </span>
          <p className={styles.texto}>{textoEmail}</p>
          <button
            type="button"
            className={styles.accion}
            onClick={abrirFacturacion}
            disabled={!socioWeb || actualizarSocioMutation.isPending}
          >
            Cargar email <FiChevronRight aria-hidden="true" />
          </button>
        </div>
      )}

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
