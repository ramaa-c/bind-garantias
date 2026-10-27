import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FiUsers,
  FiUserPlus,
  FiMail,
  FiShield,
  FiUserX,
  FiLifeBuoy,
  FiClock,
  FiInfo,
  FiMoreVertical,
  FiSend,
} from "react-icons/fi";
import { Button, Modal, Skeleton, SelectSimple } from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useChannel } from "../../../context/useChannel";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  useUsuariosEmpresa,
  ROL_ADMIN,
  ROL_USUARIO,
  ESTADO_INVITACION,
  RESULTADO_VINCULADA,
} from "../../../hooks/useUsuariosEmpresa";
import { ASISTENCIA_ACTIVA } from "../../../hooks/useAsistenciaInterna";
import styles from "./UsuariosEmpresa.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MAXIMO_NOMBRE = 75;
const LARGO_MAXIMO_EMAIL = 100;

const formatearFecha = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(fecha);
};

const formatearFechaHora = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(fecha);
};

const inicialesDeEmail = (email) => {
  const local = String(email || "").split("@")[0];
  const partes = local.split(/[._\-+]+/).filter(Boolean);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || partes[0]?.[1] || "")).toUpperCase() || "?";
};

function InvitarUsuarioModal({ isOpen, onClose, onInvitar }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const limpiar = () => {
    setNombre("");
    setEmail("");
    setErrores({});
  };

  const cerrar = () => {
    if (enviando) return;
    limpiar();
    onClose();
  };

  const enviar = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    const nuevosErrores = {};
    if (!nombreLimpio) nuevosErrores.nombre = "Ingresá el nombre de la persona.";
    if (!EMAIL_REGEX.test(emailLimpio)) nuevosErrores.email = "Ingresá un correo electrónico válido.";
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setEnviando(true);
    try {
      const resultado = await onInvitar({ email: emailLimpio, nombre: nombreLimpio });
      if (resultado === RESULTADO_VINCULADA) {
        toast.success("Le dimos acceso a la empresa", {
          description: `${emailLimpio} ya tenía cuenta: puede ingresar cuando quiera.`,
        });
      } else {
        toast.success("Invitación enviada", { description: emailLimpio });
      }
      setEnviando(false);
      limpiar();
      onClose();
    } catch (err) {
      setEnviando(false);
      setErrores({ general: err.message || "No pudimos enviar la invitación. Probá de nuevo." });
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
          <span className={styles.campoLabel}>Nombre y apellido</span>
          <input
            type="text"
            className={`${styles.campoInput} ${errores.nombre ? styles.campoInputError : ""}`}
            placeholder="Ana Pérez"
            value={nombre}
            maxLength={LARGO_MAXIMO_NOMBRE}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrores({});
            }}
            autoFocus
          />
          {errores.nombre && <span className={styles.campoError}>{errores.nombre}</span>}
        </label>

        <label className={styles.campo}>
          <span className={styles.campoLabel}>Correo electrónico</span>
          <input
            type="email"
            className={`${styles.campoInput} ${errores.email ? styles.campoInputError : ""}`}
            placeholder="nombre@empresa.com"
            value={email}
            maxLength={LARGO_MAXIMO_EMAIL}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrores({});
            }}
          />
          {errores.email && <span className={styles.campoError}>{errores.email}</span>}
        </label>

        {errores.general && <p className={styles.errorGeneral}>{errores.general}</p>}

        <p className={styles.notaInvitar}>
          <FiInfo aria-hidden="true" />
          Si la persona ya tiene una cuenta, le damos acceso directamente. Si no, le enviamos un mail para que se
          registre. Entra como usuario; una vez vinculada, podés hacerla administradora.
        </p>
      </form>
    </Modal>
  );
}

const OPCIONES_ROL = [
  { value: ROL_ADMIN, label: "Administrador" },
  { value: ROL_USUARIO, label: "Usuario" },
];

export default function UsuariosEmpresa() {
  const navigate = useNavigate();
  const { basePath } = useChannel();
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);
  const { socioIdActivo, nombreEmpresa, cuitActivo, tipoCanalComercializacionId } = useEmpresaActiva();
  const {
    usuarios,
    cargando,
    soyAdmin,
    soyAsistente,
    cantidadAdmins,
    asistenciaDisponible,
    asistencia,
    invitar,
    reenviar,
    cambiarRol,
    quitarAcceso,
    solicitarAsistencia,
  } = useUsuariosEmpresa({
    socioId: socioIdActivo,
    cuit: cuitActivo,
    tipoCanalSocioId: tipoCanalComercializacionId,
  });

  const [invitarAbierto, setInvitarAbierto] = useState(false);
  const [aQuitar, setAQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);
  const [confirmarAsistencia, setConfirmarAsistencia] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [cambiandoRol, setCambiandoRol] = useState(null);
  const [reenviando, setReenviando] = useState(null);

  useEffect(() => {
    if (!menuAbierto) return undefined;
    const cerrar = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      if (e.type === "mousedown" && e.target.closest?.(`.${styles.accionesMovil}`)) return;
      setMenuAbierto(null);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrar);
    };
  }, [menuAbierto]);

  const alternarRol = async (usuario) => {
    const nuevoRol = usuario.rol === ROL_ADMIN ? ROL_USUARIO : ROL_ADMIN;
    setCambiandoRol(usuario.id);
    try {
      await cambiarRol(usuario, nuevoRol);
      toast.success(nuevoRol === ROL_ADMIN ? "Ahora es administrador" : "Ya no es administrador", {
        description: usuario.email,
      });
    } catch (error) {
      toast.error(error?.message || "No pudimos cambiar el rol. Probá de nuevo.");
    } finally {
      setCambiandoRol(null);
    }
  };

  const reenviarInvitacion = async (usuario) => {
    setReenviando(usuario.id);
    try {
      await reenviar(usuario);
      toast.success("Invitación reenviada", { description: usuario.email });
    } catch (error) {
      toast.error(error?.message || "No pudimos reenviar la invitación. Probá de nuevo.");
    } finally {
      setReenviando(null);
    }
  };

  const confirmarQuitar = async () => {
    if (!aQuitar) return;
    setQuitando(true);
    try {
      await quitarAcceso(aQuitar);
      if (aQuitar.esVos) {
        toast.success("Dejaste de tener acceso a la empresa", { description: nombreEmpresa || undefined });
        cambiarEmpresa();
        navigate(basePath || "/", { replace: true });
        return;
      }
      toast.success("Acceso quitado", { description: aQuitar.email });
      setAQuitar(null);
    } catch (error) {
      toast.error(error?.message || "No pudimos quitarle el acceso. Probá de nuevo.");
    } finally {
      setQuitando(false);
    }
  };

  const pedirAsistencia = async () => {
    setSolicitando(true);
    try {
      await solicitarAsistencia();
      toast.success("Pedimos asistencia para tu empresa", {
        description: "Le avisamos por mail al equipo de tu entidad.",
      });
      setConfirmarAsistencia(false);
    } catch (error) {
      toast.error(error?.message || "No pudimos pedir la asistencia. Probá de nuevo.");
    } finally {
      setSolicitando(false);
    }
  };

  const vinculados = usuarios.filter((u) => u.estado !== ESTADO_INVITACION);
  const invitaciones = usuarios.filter((u) => u.estado === ESTADO_INVITACION);
  const admins = vinculados.filter((u) => u.rol === ROL_ADMIN).length;
  const comunes = vinculados.length - admins;

  const renderInvitacion = (usuario) => (
    <li key={usuario.id} className={`${styles.fila} ${styles.filaInvitacion}`}>
      <span className={styles.avatar} aria-hidden="true">
        <FiMail />
      </span>

      <span className={styles.info}>
        <span className={styles.linea}>
          <span className={styles.email} title={usuario.email}>
            {usuario.nombre || usuario.email}
          </span>
          <span className={styles.etiquetas}>
            <span className={`${styles.pill} ${styles.pillInvitacion}`}>
              <FiClock aria-hidden="true" /> Pendiente
            </span>
          </span>
        </span>
        <span className={styles.meta}>
          {usuario.nombre ? `${usuario.email} · ` : ""}Todavía no se registró
        </span>
      </span>

      <span className={styles.acciones}>
        <button
          type="button"
          className={styles.botonReenviar}
          onClick={() => reenviarInvitacion(usuario)}
          disabled={reenviando === usuario.id}
          aria-label={`Reenviar invitación a ${usuario.email}`}
        >
          <FiSend aria-hidden="true" />
          <span className={styles.botonReenviarTexto}>
            {reenviando === usuario.id ? "Reenviando…" : "Reenviar invitación"}
          </span>
        </button>
      </span>
    </li>
  );

  const renderVinculado = (usuario) => {
    const esUltimoAdmin = usuario.rol === ROL_ADMIN && cantidadAdmins <= 1;
    const textoQuitar = usuario.esVos ? "Dejar la empresa" : "Quitar acceso";
    return (
      <li key={usuario.id} className={styles.fila}>
        <span className={styles.avatar} aria-hidden="true">
          {inicialesDeEmail(usuario.email)}
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
            </span>
          </span>
          <span className={styles.meta}>
            {usuario.desde ? `Con acceso desde el ${formatearFecha(usuario.desde)}` : "Con acceso"}
          </span>
        </span>

        {soyAdmin && (
          <span className={styles.acciones}>
            {esUltimoAdmin && <span className={styles.unicoAdmin}>Único administrador</span>}
            <span className={styles.accionesEscritorio}>
              <SelectSimple
                label="Rol"
                options={OPCIONES_ROL}
                value={usuario.rol}
                onChange={(valor) => valor && valor !== usuario.rol && alternarRol(usuario)}
                disabled={esUltimoAdmin || cambiandoRol === usuario.id}
                variant="client"
                compact
                hideErrorSpace
                className={styles.selectRol}
              />
              {!esUltimoAdmin && (
                <button type="button" className={styles.botonQuitar} onClick={() => setAQuitar(usuario)}>
                  <FiUserX aria-hidden="true" />
                  {textoQuitar}
                </button>
              )}
            </span>
            {!esUltimoAdmin && (
              <span className={styles.accionesMovil}>
                <button
                  type="button"
                  className={styles.botonMenu}
                  onClick={() => setMenuAbierto(menuAbierto === usuario.id ? null : usuario.id)}
                  aria-haspopup="menu"
                  aria-expanded={menuAbierto === usuario.id}
                  aria-label={`Acciones para ${usuario.email}`}
                >
                  <FiMoreVertical aria-hidden="true" />
                </button>
                {menuAbierto === usuario.id && (
                  <span className={styles.menu} role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.menuItem}
                      disabled={cambiandoRol === usuario.id}
                      onClick={() => {
                        setMenuAbierto(null);
                        alternarRol(usuario);
                      }}
                    >
                      <FiShield aria-hidden="true" />
                      {usuario.rol === ROL_ADMIN ? "Quitar administrador" : "Hacer administrador"}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${styles.menuItem} ${styles.menuItemPeligro}`}
                      onClick={() => {
                        setMenuAbierto(null);
                        setAQuitar(usuario);
                      }}
                    >
                      <FiUserX aria-hidden="true" />
                      {textoQuitar}
                    </button>
                  </span>
                )}
              </span>
            )}
          </span>
        )}
      </li>
    );
  };

  if (soyAsistente) {
    return (
      <section className={styles.pagina}>
        <header className={styles.cabecera}>
          <div className={styles.cabeceraIzq}>
            <span className={styles.cabeceraIcono} aria-hidden="true">
              <FiUsers />
            </span>
            <div>
              <h1 className={styles.titulo}>Usuarios</h1>
              <p className={styles.subtitulo}>Quiénes pueden operar en {nombreEmpresa || "esta empresa"}.</p>
            </div>
          </div>
        </header>
        <p className={styles.avisoComun}>
          <FiInfo aria-hidden="true" />
          Estás ingresando como asistencia: la gestión de usuarios queda a cargo de la empresa.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.pagina}>
      <header className={styles.cabecera}>
        <div className={styles.cabeceraIzq}>
          <span className={styles.cabeceraIcono} aria-hidden="true">
            <FiUsers />
          </span>
          <div>
            <h1 className={styles.titulo}>Usuarios</h1>
            <p className={styles.subtitulo}>Quiénes pueden operar en {nombreEmpresa || "esta empresa"}.</p>
          </div>
        </div>
        {soyAdmin && (
          <Button type="button" variant="primary" size="sm" onClick={() => setInvitarAbierto(true)}>
            <FiUserPlus /> Invitar usuario
          </Button>
        )}
      </header>

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
            : vinculados.map(renderVinculado)}
        </ul>
      </section>

      {soyAdmin && !cargando && invitaciones.length > 0 && (
        <section className={styles.seccion} aria-labelledby="usuarios-invitaciones">
          <div className={styles.seccionCabecera}>
            <h2 id="usuarios-invitaciones" className={styles.seccionTitulo}>
              Invitaciones pendientes <span className={styles.cuenta}>{invitaciones.length}</span>
            </h2>
          </div>
          <ul className={styles.lista}>{invitaciones.map(renderInvitacion)}</ul>
        </section>
      )}

      {(asistenciaDisponible || asistencia) && (
        <section className={styles.asistencia} aria-labelledby="usuarios-asistencia">
          <span className={styles.asistenciaIcono} aria-hidden="true">
            <FiLifeBuoy />
          </span>
          <div className={styles.asistenciaTexto}>
            <h2 id="usuarios-asistencia" className={styles.asistenciaTitulo}>
              Asistencia de tu entidad
            </h2>
            {asistencia?.estado === ASISTENCIA_ACTIVA ? (
              <p className={styles.asistenciaDescripcion}>
                Una persona de tu entidad está asistiendo a la empresa
                {asistencia.vencimiento ? ` hasta el ${formatearFechaHora(asistencia.vencimiento)}` : ""}.
              </p>
            ) : asistencia ? (
              <p className={styles.asistenciaDescripcion}>
                Pediste asistencia el {formatearFechaHora(asistencia.solicitadaEl)}. Cuando la persona ingrese, va a
                tener acceso por un tiempo limitado.
              </p>
            ) : (
              <p className={styles.asistenciaDescripcion}>
                Si algo no se puede resolver, una persona de tu entidad puede ingresar como usuario, por un tiempo
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
        titulo={aQuitar?.esVos ? "¿Dejar la empresa?" : "¿Quitarle el acceso?"}
        mensaje={
          aQuitar?.esVos
            ? "Vas a dejar de ver y operar esta empresa. Para volver, otro administrador tiene que invitarte."
            : "Ya no va a poder ver ni operar esta empresa. Los datos que cargó quedan en el legajo."
        }
        detalle={
          aQuitar ? { titulo: aQuitar.email, subtitulo: aQuitar.rol === ROL_ADMIN ? "Administrador" : "Usuario" } : undefined
        }
        confirmText={aQuitar?.esVos ? "Dejar la empresa" : "Quitar acceso"}
        cancelText="Volver"
      />

      <ConfirmacionModal
        isOpen={confirmarAsistencia}
        onClose={() => !solicitando && setConfirmarAsistencia(false)}
        onConfirm={pedirAsistencia}
        isLoading={solicitando}
        tone="warning"
        icono={<FiLifeBuoy />}
        titulo="¿Solicitar asistencia?"
        mensaje="Una persona de tu entidad va a poder ingresar a la empresa con el mismo acceso que un usuario, por un tiempo limitado desde su primer ingreso. No se puede cortar antes de que venza."
        confirmText="Solicitar asistencia"
        cancelText="Volver"
      />
    </section>
  );
}
