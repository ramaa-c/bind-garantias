import React, { useMemo, useRef, useState } from "react";
import { FiBell, FiBold } from "react-icons/fi";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { Switch } from "../../../ui/Switch/Switch";
import { useNotificarUsuario } from "../../../../hooks/useUsuario";
import styles from "./NotificarSocioModal.module.css";

// POST api/usuario/notificar (SGRPLUSPLA-201): le manda un mail con el
// mensaje que escriba el admin a uno o más destinatarios de la empresa - el
// email de la empresa (Socio.Email) y/o cualquiera de sus usuarios
// vinculados (ver useUsuariosVinculadosASocio). El backend interpreta HTML
// plano dentro de Mensaje - de ahí el editor contentEditable en vez de un
// textarea común: el admin ve la negrita real mientras escribe, pero lo que
// viaja en el payload sigue siendo <strong>texto</strong>.
//
// El botón "Negrita" es un toggle (se pidió expresamente: clickearlo activa
// el modo y todo lo que se tipee de ahí en más queda en negrita hasta
// desactivarlo, no un "seleccioná y envolvé"). Eso es exactamente lo que
// hace document.execCommand("bold") con el cursor colapsado - lo malo es
// que el tag que usa por default varía según el navegador (Chrome/Firefox
// suelen usar <b>, no <strong>), así que se normaliza a <strong> recién al
// armar el payload, sin tocar lo que el admin ve mientras escribe.
//
// El endpoint solo acepta un destinatario por llamada, así que "varios
// seleccionados" es una llamada por cada uno, en secuencia (no
// Promise.all/paralelo - mismo criterio que el resto de la app con este
// backend, que usa un pool de conexiones FireDAC limitado).
//
// El caller monta esto con key={socio?.socioid ?? "none"} para que el
// mensaje y la selección arranquen de cero en cada apertura, mismo patrón
// que RechazarSolicitudModal.
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

export function NotificarSocioModal({
  isOpen,
  onClose,
  socio,
  usuariosVinculados = [],
  usuarioWebAdminId,
}) {
  const editorRef = useRef(null);
  const [estaVacio, setEstaVacio] = useState(true);
  const [enfocado, setEnfocado] = useState(false);
  const [negritaActiva, setNegritaActiva] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { mutateAsync: notificar } = useNotificarUsuario();

  const cuit = socio?.cuit || "";

  const destinatariosDisponibles = useMemo(() => {
    const vistos = new Set();
    const lista = [];

    const agregar = (email, etiqueta) => {
      const limpio = (email || "").trim();
      if (!limpio) return;
      const clave = limpio.toLowerCase();
      if (vistos.has(clave)) return;
      vistos.add(clave);
      lista.push({ email: limpio, etiqueta });
    };

    agregar(socio?.email, "Email de la empresa");
    usuariosVinculados.forEach((u) => agregar(u.email, "Usuario vinculado"));

    return lista;
  }, [socio?.email, usuariosVinculados]);

  const seleccionInicial = () =>
    socio?.email ? [socio.email.trim()] : [];

  const [emailsSeleccionados, setEmailsSeleccionados] = useState(seleccionInicial);

  const toggleDestinatario = (email) => {
    setEmailsSeleccionados((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

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

  const handleFocusEditor = () => {
    setEnfocado(true);
    sincronizarEstadoNegrita();
  };

  const handleBlurEditor = () => {
    setEnfocado(false);
  };

  const handleNegrita = () => {
    const editor = editorRef.current;
    if (!editor || enviando) return;
    editor.focus();
    document.execCommand("bold");
    sincronizarEstadoNegrita();
    sincronizarVacio();
  };

  const handleEnviar = async () => {
    const editor = editorRef.current;
    if (!editor || enviando || estaVacio || emailsSeleccionados.length === 0) return;

    const mensaje = normalizarNegritas(editor.innerHTML);
    setEnviando(true);

    const exitosos = [];
    const fallidos = [];

    for (const destinatario of emailsSeleccionados) {
      try {
        await notificar({
          email: destinatario,
          cuit,
          mensaje,
          usuariowebadminid: usuarioWebAdminId,
        });
        exitosos.push(destinatario);
      } catch {
        fallidos.push(destinatario);
      }
    }

    setEnviando(false);

    if (fallidos.length === 0) {
      toast.success(
        exitosos.length > 1 ? "Notificaciones enviadas" : "Notificación enviada",
        {
          description:
            exitosos.length > 1
              ? `Se les envió un email a ${exitosos.length} destinatarios.`
              : `Se le envió un email a ${exitosos[0]}.`,
        },
      );
      editor.innerHTML = "";
      setEstaVacio(true);
      setNegritaActiva(false);
      setEmailsSeleccionados(seleccionInicial());
      onClose();
    } else {
      toast.error("No se pudo enviar a todos los destinatarios", {
        description:
          `No llegó a: ${fallidos.join(", ")}.` +
          (exitosos.length > 0 ? ` Sí se envió a: ${exitosos.join(", ")}.` : ""),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notificar al socio"
      maxWidth="520px"
      variant="blue"
      preventClose={enviando}
    >
      <div className={styles.content}>
        <div className={styles.destinatario}>
          <FiBell size={16} className={styles.destinatarioIcon} />
          <p className={styles.lead}>
            Elegí a quién le llega el mensaje (podés marcar más de uno).
            Usalo para avisar algo que hay que corregir o completar (ej. un
            documento mal cargado o vencido).
          </p>
        </div>

        {destinatariosDisponibles.length === 0 ? (
          <p className={styles.sinDestinatarios}>
            Esta empresa no tiene ningún email disponible para notificar.
          </p>
        ) : (
          <div className={styles.destinatariosLista}>
            {destinatariosDisponibles.map((d) => (
              <div key={d.email} className={styles.destinatarioRow}>
                <div className={styles.destinatarioInfo}>
                  <span className={styles.destinatarioEmail}>{d.email}</span>
                  <span className={styles.destinatarioEtiqueta}>{d.etiqueta}</span>
                </div>
                <Switch
                  checked={emailsSeleccionados.includes(d.email)}
                  onChange={() => toggleDestinatario(d.email)}
                  variant="admin"
                  disabled={enviando}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.negritaBtn} ${negritaActiva ? styles.negritaActiva : ""}`}
            onClick={handleNegrita}
            disabled={enviando}
            aria-pressed={negritaActiva}
            title="Activar/desactivar negrita: lo que tipees de acá en más queda en negrita hasta que lo vuelvas a apretar"
          >
            <FiBold size={14} />
            Negrita
          </button>
        </div>

        <div className={styles.editorWrapper}>
          {estaVacio && !enfocado && (
            <span className={styles.placeholder}>
              Escribí acá el mensaje que va a recibir por mail...
            </span>
          )}
          <div
            ref={editorRef}
            className={styles.editor}
            contentEditable={!enviando}
            role="textbox"
            aria-multiline="true"
            aria-label="Mensaje para el socio"
            onInput={sincronizarVacio}
            onKeyUp={sincronizarEstadoNegrita}
            onMouseUp={sincronizarEstadoNegrita}
            onFocus={handleFocusEditor}
            onBlur={handleBlurEditor}
            suppressContentEditableWarning
          />
        </div>

        <div className={styles.actions}>
          <Button variant="outlineBlue" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant="blue"
            onClick={handleEnviar}
            isLoading={enviando}
            disabled={estaVacio || emailsSeleccionados.length === 0}
          >
            {emailsSeleccionados.length > 1
              ? `Enviar a ${emailsSeleccionados.length} destinatarios`
              : "Enviar notificación"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default NotificarSocioModal;
