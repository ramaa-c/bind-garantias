import React, { useRef, useState } from "react";
import { FiBell, FiBold } from "react-icons/fi";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { useNotificarUsuario } from "../../../../hooks/useUsuario";
import styles from "./NotificarSocioModal.module.css";

// POST api/usuario/notificar (SGRPLUSPLA-201): le manda un mail al socio con
// el mensaje que escriba el admin. El backend interpreta HTML plano dentro
// de Mensaje - de ahí el editor contentEditable en vez de un textarea común:
// el admin ve la negrita real mientras escribe, pero lo que viaja en el
// payload sigue siendo <strong>texto</strong> (confirmado con Victor: es la
// única etiqueta que soporta por ahora).
//
// El botón "Negrita" es un toggle (se pidió expresamente: clickearlo activa
// el modo y todo lo que se tipee de ahí en más queda en negrita hasta
// desactivarlo, no un "seleccioná y envolvé"). Eso es exactamente lo que
// hace document.execCommand("bold") con el cursor colapsado - lo malo es
// que el tag que usa por default varía según el navegador (Chrome/Firefox
// suelen usar <b>, no <strong>), así que se normaliza a <strong> recién al
// armar el payload, sin tocar lo que el admin ve mientras escribe.
// El caller monta esto con key={socio?.socioid ?? "none"} para que el
// mensaje arranque vacío en cada apertura, mismo patrón que
// RechazarSolicitudModal.
function normalizarNegritas(html) {
  const contenedor = document.createElement("div");
  contenedor.innerHTML = html;
  contenedor.querySelectorAll("b").forEach((b) => {
    const strong = document.createElement("strong");
    strong.innerHTML = b.innerHTML;
    b.replaceWith(strong);
  });
  return contenedor.innerHTML;
}

export function NotificarSocioModal({ isOpen, onClose, socio, usuarioWebAdminId }) {
  const editorRef = useRef(null);
  const [estaVacio, setEstaVacio] = useState(true);
  const [negritaActiva, setNegritaActiva] = useState(false);
  const { mutate: notificar, isPending } = useNotificarUsuario();

  const email = socio?.email || "";
  const cuit = socio?.cuit || "";

  const sincronizarVacio = () => {
    setEstaVacio(!(editorRef.current?.textContent || "").trim());
  };

  // Refleja si la posición actual del cursor (al moverlo con el mouse/
  // teclado, no solo al tipear) está en negrita, para que el botón muestre
  // el estado real - igual que la barra de cualquier editor de texto.
  const sincronizarEstadoNegrita = () => {
    try {
      setNegritaActiva(document.queryCommandState("bold"));
    } catch {
      setNegritaActiva(false);
    }
  };

  const handleNegrita = () => {
    const editor = editorRef.current;
    if (!editor || isPending) return;
    editor.focus();
    document.execCommand("bold");
    sincronizarEstadoNegrita();
    sincronizarVacio();
  };

  const handleEnviar = () => {
    const editor = editorRef.current;
    if (!editor || isPending || !email || estaVacio) return;

    notificar(
      {
        email,
        cuit,
        mensaje: normalizarNegritas(editor.innerHTML),
        usuariowebadminid: usuarioWebAdminId,
      },
      {
        onSuccess: () => {
          toast.success("Notificación enviada", {
            description: `Se le envió un email a ${email}.`,
          });
          editor.innerHTML = "";
          setEstaVacio(true);
          setNegritaActiva(false);
          onClose();
        },
        onError: (err) => {
          toast.error("No se pudo enviar la notificación", {
            description: err.message,
          });
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notificar al socio"
      maxWidth="520px"
      variant="blue"
      preventClose={isPending}
    >
      <div className={styles.content}>
        <div className={styles.destinatario}>
          <FiBell size={16} className={styles.destinatarioIcon} />
          <p className={styles.lead}>
            Se le va a enviar un email a <strong>{email || "—"}</strong>
            {cuit && <> (CUIT {cuit})</>}. Usalo para avisarle algo que tiene
            que corregir o completar (ej. un documento mal cargado o
            vencido).
          </p>
        </div>

        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.negritaBtn} ${negritaActiva ? styles.negritaActiva : ""}`}
            onClick={handleNegrita}
            disabled={isPending}
            aria-pressed={negritaActiva}
            title="Activar/desactivar negrita: lo que tipees de acá en más queda en negrita hasta que lo vuelvas a apretar"
          >
            <FiBold size={14} />
            Negrita
          </button>
        </div>

        <div
          ref={editorRef}
          className={`${styles.editor} ${estaVacio ? styles.editorVacio : ""}`}
          contentEditable={!isPending}
          role="textbox"
          aria-multiline="true"
          aria-label="Mensaje para el socio"
          data-placeholder="Escribí acá el mensaje que va a recibir por mail..."
          onInput={sincronizarVacio}
          onKeyUp={sincronizarEstadoNegrita}
          onMouseUp={sincronizarEstadoNegrita}
          onFocus={sincronizarEstadoNegrita}
          suppressContentEditableWarning
        />

        <div className={styles.actions}>
          <Button variant="outlineBlue" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="blue"
            onClick={handleEnviar}
            isLoading={isPending}
            disabled={estaVacio || !email}
          >
            Enviar notificación
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default NotificarSocioModal;
