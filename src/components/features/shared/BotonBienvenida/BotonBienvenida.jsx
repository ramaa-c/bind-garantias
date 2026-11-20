import React, { useState } from "react";
import { toast } from "sonner";
import { FiMail, FiSend } from "react-icons/fi";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useCadenaActiva } from "../../../../hooks/useCadenaActiva";
import { useBloqueoLegajo } from "../../../../hooks/useSocios";
import {
  useUsuariosEmpresa,
  ESTADO_INVITACION,
  ESTADO_VINCULADO,
} from "../../../../hooks/useUsuariosEmpresa";
import { InvitarUsuarioModal } from "../InvitarUsuarioModal/InvitarUsuarioModal";
import styles from "./BotonBienvenida.module.css";

export function BotonBienvenida() {
  const [modalAbierta, setModalAbierta] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const {
    socioIdActivo,
    cuitActivo,
    tipoCanalComercializacionId,
    isVendor,
    isLoading,
  } = useEmpresaActiva();
  const { cadenaId } = useCadenaActiva();
  const { bloqueado, cargando: cargandoBloqueo } = useBloqueoLegajo(
    isVendor ? socioIdActivo : null,
    cadenaId,
    isVendor ? cuitActivo : null,
  );
  const { usuarios, cargando, primerUsuarioEsAdmin, invitar, reenviar } = useUsuariosEmpresa({
    socioId: isVendor ? socioIdActivo : null,
    cuit: isVendor ? cuitActivo : null,
    tipoCanalSocioId: tipoCanalComercializacionId,
    esVendor: isVendor,
  });

  const tieneUsuario = usuarios.some((u) => u.estado === ESTADO_VINCULADO && !u.esVos);
  const invitacionPendiente = usuarios.find((u) => u.estado === ESTADO_INVITACION);

  const visible =
    isVendor &&
    !!socioIdActivo &&
    !isLoading &&
    !cargando &&
    !cargandoBloqueo &&
    !bloqueado &&
    !tieneUsuario;

  if (!visible && !modalAbierta) return null;

  const reenviarBienvenida = async () => {
    setReenviando(true);
    try {
      await reenviar(invitacionPendiente);
      toast.success("Mail de bienvenida reenviado", { description: invitacionPendiente.email });
    } catch (error) {
      toast.error(error?.message || "No pudimos reenviar el mail. Probá de nuevo.");
    } finally {
      setReenviando(false);
    }
  };

  const alClick = () => {
    if (invitacionPendiente) {
      reenviarBienvenida();
      return;
    }
    setModalAbierta(true);
  };

  const texto = invitacionPendiente
    ? reenviando
      ? "Reenviando…"
      : "Reenviar mail de bienvenida"
    : "Enviar mail de bienvenida";

  return (
    <>
      {visible && (
        <button
          type="button"
          className={styles.boton}
          onClick={alClick}
          disabled={reenviando}
          title={invitacionPendiente ? `Reenviar a ${invitacionPendiente.email}` : texto}
          aria-label={texto}
        >
          <span className={styles.icono} aria-hidden="true">
            {invitacionPendiente ? <FiSend /> : <FiMail />}
          </span>
          <span className={styles.texto}>{texto}</span>
        </button>
      )}

      <InvitarUsuarioModal
        isOpen={modalAbierta}
        onClose={() => setModalAbierta(false)}
        onInvitar={invitar}
        entraComoAdmin={primerUsuarioEsAdmin}
      />
    </>
  );
}

export default BotonBienvenida;
