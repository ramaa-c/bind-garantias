import React, { useState } from "react";
import { toast } from "sonner";
import {
  FiUsers,
  FiUserPlus,
  FiMail,
  FiShield,
  FiUserX,
  FiLifeBuoy,
  FiClock,
  FiEye,
  FiInfo,
} from "react-icons/fi";
import { Button, Modal, Switch, Skeleton } from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import {
  useUsuariosEmpresa,
  ROL_ADMIN,
  ROL_USUARIO,
  ESTADO_INVITACION,
} from "../../../hooks/useUsuariosEmpresa";
import styles from "./UsuariosEmpresa.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatearFecha = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(fecha);
};

const formatearFechaHora = (fecha) =>
  new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(fecha);

const inicialesDeEmail = (email) => {
  const local = String(email || "").split("@")[0];
  const partes = local.split(/[._\-+]+/).filter(Boolean);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || partes[0]?.[1] || "")).toUpperCase() || "?";
};

function InvitarUsuarioModal({ isOpen, onClose, onInvitar }) {
  const [email, setEmail] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    if (enviando) return;
    setEmail("");
    setEsAdmin(false);
    setError("");
    onClose();
  };

  const enviar = async (e) => {
    e.preventDefault();
    const normalizado = email.trim();
    if (!EMAIL_REGEX.test(normalizado)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }
    setEnviando(true);
    try {
      await onInvitar({ email: normalizado, esAdmin });
      toast.success("Invitación enviada", { description: normalizado });
      setEnviando(false);
      setEmail("");
      setEsAdmin(false);
      setError("");
      onClose();
    } catch (err) {
      setEnviando(false);
      setError(err.message || "No pudimos enviar la invitación. Probá de nuevo.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={cerrar}
      title="Invitar usuario"
      subtitle="Va a poder operar en esta empresa"
      maxWidth="30rem"
      preventClose={enviando}
      footer={
        <div className={styles.modalAcciones}>
          <Button type="button" variant="outline" size="md" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-invitar-usuario" variant="primary" size="md" isLoading={enviando}>
            <FiMail /> Enviar invitación
          </Button>
        </div>
      }
    >
      <form id="form-invitar-usuario" className={styles.formInvitar} onSubmit={enviar} noValidate>
        <label className={styles.campo}>
          <span className={styles.campoLabel}>Correo electrónico</span>
          <input
            type="email"
            className={`${styles.campoInput} ${error ? styles.campoInputError : ""}`}
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            autoFocus
          />
          {error && <span className={styles.campoError}>{error}</span>}
        </label>

        <div className={styles.opcionAdmin}>
          <div className={styles.opcionAdminTexto}>
            <span className={styles.opcionAdminTitulo}>Darle permisos de administrador</span>
            <span className={styles.opcionAdminAyuda}>Va a poder invitar a otras personas y cambiar roles.</span>
          </div>
          <Switch checked={esAdmin} onChange={setEsAdmin} variant="client" />
        </div>

        <p className={styles.notaInvitar}>
          <FiInfo aria-hidden="true" />
          Si la persona ya tiene una cuenta, la vinculamos y le avisamos por mail. Si no, le enviamos una invitación
          para que se registre.
        </p>
      </form>
    </Modal>
  );
}

export default function UsuariosEmpresa() {
  const { socioIdActivo, nombreEmpresa, tipoCanalComercializacionId } = useEmpresaActiva();
  const {
    usuarios,
    cargando,
    soyAdmin,
    cantidadAdmins,
    asistenciaDisponible,
    asistencia,
    invitar,
    cambiarRol,
    quitarAcceso,
    solicitarAsistencia,
    esDemo,
    verComoUsuario,
    setVerComoUsuario,
  } = useUsuariosEmpresa(socioIdActivo, tipoCanalComercializacionId);

  const [invitarAbierto, setInvitarAbierto] = useState(false);
  const [aQuitar, setAQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);
  const [confirmarAsistencia, setConfirmarAsistencia] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [mostrarAsistenciaDemo, setMostrarAsistenciaDemo] = useState(false);

  const asistenciaVisible = asistenciaDisponible || (esDemo && mostrarAsistenciaDemo);

  const alternarRol = async (usuario) => {
    const nuevoRol = usuario.rol === ROL_ADMIN ? ROL_USUARIO : ROL_ADMIN;
    await cambiarRol(usuario, nuevoRol);
    toast.success(
      nuevoRol === ROL_ADMIN ? "Ahora es administrador" : "Ya no es administrador",
      { description: usuario.email },
    );
  };

  const confirmarQuitar = async () => {
    if (!aQuitar) return;
    setQuitando(true);
    await quitarAcceso(aQuitar);
    toast.success(aQuitar.estado === ESTADO_INVITACION ? "Invitación cancelada" : "Acceso quitado", {
      description: aQuitar.email,
    });
    setQuitando(false);
    setAQuitar(null);
  };

  const pedirAsistencia = async () => {
    setSolicitando(true);
    await solicitarAsistencia();
    setSolicitando(false);
    setConfirmarAsistencia(false);
    toast.success("Pedimos asistencia para tu empresa");
  };

  const vinculados = usuarios.filter((u) => u.estado !== ESTADO_INVITACION);
  const invitaciones = usuarios.filter((u) => u.estado === ESTADO_INVITACION);
  const admins = vinculados.filter((u) => u.rol === ROL_ADMIN).length;
  const comunes = vinculados.length - admins;

  const renderFila = (usuario) => {
    const invitacion = usuario.estado === ESTADO_INVITACION;
    const esUltimoAdmin = usuario.rol === ROL_ADMIN && !invitacion && cantidadAdmins <= 1;
    return (
      <li key={usuario.id} className={`${styles.fila} ${invitacion ? styles.filaInvitacion : ""}`}>
        <span className={styles.avatar} aria-hidden="true">
          {invitacion ? <FiMail /> : inicialesDeEmail(usuario.email)}
        </span>

        <span className={styles.info}>
          <span className={styles.linea}>
            <span className={styles.email} title={usuario.email}>
              {usuario.email}
            </span>
            <span className={styles.etiquetas}>
              {usuario.esVos && <span className={`${styles.pill} ${styles.pillVos}`}>Vos</span>}
              <span className={`${styles.pill} ${usuario.rol === ROL_ADMIN ? styles.pillAdmin : styles.pillUsuario}`}>
                {usuario.rol === ROL_ADMIN && <FiShield aria-hidden="true" />}
                {usuario.rol === ROL_ADMIN ? "Administrador" : "Usuario"}
              </span>
              {invitacion && (
                <span className={`${styles.pill} ${styles.pillInvitacion}`}>
                  <FiClock aria-hidden="true" /> Pendiente
                </span>
              )}
            </span>
          </span>
          <span className={styles.meta}>
            {invitacion
              ? `Invitación enviada el ${formatearFecha(usuario.desde)}`
              : usuario.desde
                ? `Con acceso desde el ${formatearFecha(usuario.desde)}`
                : "Con acceso"}
          </span>
        </span>

        {soyAdmin && (
          <span className={styles.acciones}>
            {esUltimoAdmin ? (
              <span className={styles.unicoAdmin}>
                <FiInfo aria-hidden="true" /> Único administrador
              </span>
            ) : (
              <>
                <button type="button" className={styles.accion} onClick={() => alternarRol(usuario)}>
                  <FiShield aria-hidden="true" />
                  {usuario.rol === ROL_ADMIN ? "Quitar administrador" : "Hacer administrador"}
                </button>
                <button
                  type="button"
                  className={`${styles.accion} ${styles.accionPeligro}`}
                  onClick={() => setAQuitar(usuario)}
                >
                  <FiUserX aria-hidden="true" />
                  {invitacion ? "Cancelar invitación" : "Quitar acceso"}
                </button>
              </>
            )}
          </span>
        )}
      </li>
    );
  };

  return (
    <section className={styles.pagina}>
      <header className={styles.cabecera}>
        <div className={styles.cabeceraIzq}>
          <span className={styles.cabeceraIcono} aria-hidden="true">
            <FiUsers />
          </span>
          <div>
            <h1 className={styles.titulo}>Usuarios</h1>
            <p className={styles.subtitulo}>
              Quiénes pueden operar en {nombreEmpresa || "esta empresa"}.
            </p>
          </div>
        </div>
        {soyAdmin && (
          <Button type="button" variant="primary" size="sm" onClick={() => setInvitarAbierto(true)}>
            <FiUserPlus /> Invitar usuario
          </Button>
        )}
      </header>

      {esDemo && (
        <div className={styles.demo}>
          <span className={styles.demoTexto}>
            <FiEye aria-hidden="true" />
            Vista previa: los usuarios vinculados son reales; roles, invitaciones y asistencia todavía son de prueba y
            no se guardan.
          </span>
          <div className={styles.demoControles}>
            <Switch
              checked={verComoUsuario}
              onChange={setVerComoUsuario}
              variant="client"
              size="md"
              label="Ver como usuario común"
            />
            <Switch
              checked={mostrarAsistenciaDemo}
              onChange={setMostrarAsistenciaDemo}
              variant="client"
              size="md"
              label="Simular canal con asistencia"
            />
          </div>
        </div>
      )}

      {!soyAdmin && !cargando && (
        <p className={styles.avisoComun}>
          <FiInfo aria-hidden="true" />
          Solo los administradores de la empresa pueden invitar personas o cambiar roles.
        </p>
      )}

      <section className={styles.seccion} aria-labelledby="usuarios-lista">
        <div className={styles.seccionCabecera}>
          <h2 id="usuarios-lista" className={styles.seccionTitulo}>
            Con acceso {!cargando && <span className={styles.cuenta}>{vinculados.length}</span>}
          </h2>
          {!cargando && (
            <span className={styles.contador}>
              {admins} {admins === 1 ? "administrador" : "administradores"} · {comunes}{" "}
              {comunes === 1 ? "usuario" : "usuarios"}
            </span>
          )}
        </div>
        <ul className={styles.lista}>
          {cargando
            ? Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className={styles.filaEsqueleto}>
                  <Skeleton height="3.25rem" radius="0.85rem" />
                </li>
              ))
            : vinculados.map(renderFila)}
        </ul>
      </section>

      {!cargando && invitaciones.length > 0 && (
        <section className={styles.seccion} aria-labelledby="usuarios-invitaciones">
          <div className={styles.seccionCabecera}>
            <h2 id="usuarios-invitaciones" className={styles.seccionTitulo}>
              Invitaciones pendientes <span className={styles.cuenta}>{invitaciones.length}</span>
            </h2>
          </div>
          <ul className={styles.lista}>{invitaciones.map(renderFila)}</ul>
        </section>
      )}

      {asistenciaVisible && (
        <section className={styles.asistencia} aria-labelledby="usuarios-asistencia">
          <span className={styles.asistenciaIcono} aria-hidden="true">
            <FiLifeBuoy />
          </span>
          <div className={styles.asistenciaTexto}>
            <h2 id="usuarios-asistencia" className={styles.asistenciaTitulo}>
              Asistencia de BIND Garantías
            </h2>
            {asistencia ? (
              <p className={styles.asistenciaDescripcion}>
                Pediste asistencia el {formatearFechaHora(new Date(asistencia.solicitadaEl))}. Una persona de BIND
                Garantías va a poder ingresar durante {asistencia.horas} horas desde su primer ingreso.
              </p>
            ) : (
              <p className={styles.asistenciaDescripcion}>
                Si algo no se puede resolver, una persona de BIND Garantías puede ingresar como usuario, por un tiempo
                limitado, para ayudarte.
              </p>
            )}
          </div>
          {!asistencia && (
            <button type="button" className={styles.asistenciaBoton} onClick={() => setConfirmarAsistencia(true)}>
              Solicitar asistencia
            </button>
          )}
        </section>
      )}

      <InvitarUsuarioModal isOpen={invitarAbierto} onClose={() => setInvitarAbierto(false)} onInvitar={invitar} />

      <ConfirmacionModal
        isOpen={!!aQuitar}
        onClose={() => !quitando && setAQuitar(null)}
        onConfirm={confirmarQuitar}
        isLoading={quitando}
        tone="danger"
        icono={<FiUserX />}
        titulo={aQuitar?.estado === ESTADO_INVITACION ? "¿Cancelar la invitación?" : "¿Quitarle el acceso?"}
        mensaje={
          aQuitar?.estado === ESTADO_INVITACION
            ? "El enlace de la invitación deja de funcionar."
            : "Ya no va a poder ver ni operar esta empresa. Podés volver a invitarla cuando quieras."
        }
        detalle={aQuitar ? { titulo: aQuitar.email, subtitulo: aQuitar.rol === ROL_ADMIN ? "Administrador" : "Usuario" } : undefined}
        confirmText={aQuitar?.estado === ESTADO_INVITACION ? "Cancelar invitación" : "Quitar acceso"}
        cancelText="Volver"
      />

      <ConfirmacionModal
        isOpen={confirmarAsistencia}
        onClose={() => !solicitando && setConfirmarAsistencia(false)}
        onConfirm={pedirAsistencia}
        isLoading={solicitando}
        tone="warning"
        icono={<FiLifeBuoy />}
        titulo="¿Solicitar asistencia interna?"
        mensaje="Una persona de BIND Garantías va a poder ingresar a tu empresa con el mismo acceso que un usuario, por un tiempo limitado. No se puede cancelar antes de que venza."
        confirmText="Solicitar asistencia"
        cancelText="Volver"
      />
    </section>
  );
}
