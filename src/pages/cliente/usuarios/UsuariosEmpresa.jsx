import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  FiUsers,
  FiUserPlus,
  FiMail,
  FiShield,
  FiUserX,
  FiClock,
  FiInfo,
  FiMoreVertical,
  FiSend,
  FiBriefcase,
} from "react-icons/fi";
import { Button, Skeleton, SelectSimple } from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useChannel } from "../../../context/useChannel";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  useUsuariosEmpresa,
  ROL_ADMIN,
  ROL_USUARIO,
  ROL_VENDOR,
  ESTADO_INVITACION,
} from "../../../hooks/useUsuariosEmpresa";
import { InvitarUsuarioModal } from "../../../components/features/shared/InvitarUsuarioModal/InvitarUsuarioModal";
import styles from "./UsuariosEmpresa.module.css";


const formatearFecha = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(fecha);
};

const inicialesDeEmail = (email) => {
  const local = String(email || "").split("@")[0];
  const partes = local.split(/[._\-+]+/).filter(Boolean);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || partes[0]?.[1] || "")).toUpperCase() || "?";
};

const ETIQUETA_ROL = {
  [ROL_ADMIN]: "Administrador",
  [ROL_USUARIO]: "Usuario",
  [ROL_VENDOR]: "Vendor",
};

const CLASE_PILL_ROL = {
  [ROL_ADMIN]: styles.pillAdmin,
  [ROL_USUARIO]: styles.pillUsuario,
  [ROL_VENDOR]: styles.pillVendor,
};

const OPCIONES_ROL = [
  { value: ROL_ADMIN, label: "Administrador" },
  { value: ROL_USUARIO, label: "Usuario" },
];

export default function UsuariosEmpresa() {
  const navigate = useNavigate();
  const { basePath } = useChannel();
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);
  const { socioIdActivo, nombreEmpresa, cuitActivo, isVendor } = useEmpresaActiva();
  const {
    usuarios,
    cargando,
    soyAdmin,
    puedeInvitar,
    soyAsistente,
    cantidadAdmins,
    empresaSinCeder,
    invitar,
    reenviar,
    cambiarRol,
    quitarAcceso,
  } = useUsuariosEmpresa({
    socioId: socioIdActivo,
    cuit: cuitActivo,
    esVendor: isVendor,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const pideInvitar = searchParams.get("invitar") === "1";
  const [invitarAbierto, setInvitarAbierto] = useState(false);
  const modalInvitarAbierta = invitarAbierto || (pideInvitar && !cargando && puedeInvitar);

  const cerrarInvitar = () => {
    setInvitarAbierto(false);
    if (!pideInvitar) return;
    setSearchParams(
      (previos) => {
        const nuevos = new URLSearchParams(previos);
        nuevos.delete("invitar");
        return nuevos;
      },
      { replace: true },
    );
  };
  const [aQuitar, setAQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);
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

  const vinculados = usuarios.filter((u) => u.estado !== ESTADO_INVITACION);
  const invitaciones = usuarios.filter((u) => u.estado === ESTADO_INVITACION);
  const admins = vinculados.filter((u) => u.rol === ROL_ADMIN).length;
  const comunes = vinculados.filter((u) => u.rol === ROL_USUARIO).length;
  const vendors = vinculados.filter((u) => u.rol === ROL_VENDOR).length;

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
              <span className={`${styles.pill} ${CLASE_PILL_ROL[usuario.rol]}`}>
                {usuario.rol === ROL_ADMIN && <FiShield aria-hidden="true" />}
                {usuario.rol === ROL_VENDOR && <FiBriefcase aria-hidden="true" />}
                {usuario.rol === ROL_VENDOR && !isVendor ? "Asesor" : ETIQUETA_ROL[usuario.rol]}
              </span>
            </span>
          </span>
          <span className={styles.meta}>
            {usuario.desde ? `Con acceso desde el ${formatearFecha(usuario.desde)}` : "Con acceso"}
          </span>
        </span>

        {soyAdmin && usuario.rol !== ROL_VENDOR && (
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
        {puedeInvitar && (
          <Button type="button" variant="primary" size="sm" onClick={() => setInvitarAbierto(true)}>
            <FiUserPlus /> Invitar usuario
          </Button>
        )}
      </header>

      {!soyAdmin && !cargando && (
        <p className={styles.avisoComun}>
          <FiInfo aria-hidden="true" />
          {isVendor
            ? empresaSinCeder
              ? "Como vendor podés invitar a la persona que va a administrar la empresa. Los roles los administra la empresa."
              : "La empresa ya tiene su administrador: las invitaciones y los roles los maneja la empresa."
            : "Solo los administradores de la empresa pueden invitar personas o cambiar roles."}
        </p>
      )}

      <section className={styles.seccion} aria-labelledby="usuarios-lista">
        <div className={styles.seccionCabecera}>
          <h2 id="usuarios-lista" className={styles.seccionTitulo}>
            Con acceso {!cargando && <span className={styles.cuenta}>{vinculados.length}</span>}
          </h2>
          {!cargando && (
            <span className={styles.contador}>
              {[
                `${admins} ${admins === 1 ? "administrador" : "administradores"}`,
                `${comunes} ${comunes === 1 ? "usuario" : "usuarios"}`,
                vendors > 0 &&
                  (isVendor
                    ? `${vendors} ${vendors === 1 ? "vendor" : "vendors"}`
                    : `${vendors} ${vendors === 1 ? "asesor" : "asesores"}`),
              ]
                .filter(Boolean)
                .join(" · ")}
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

      {puedeInvitar && !cargando && invitaciones.length > 0 && (
        <section className={styles.seccion} aria-labelledby="usuarios-invitaciones">
          <div className={styles.seccionCabecera}>
            <h2 id="usuarios-invitaciones" className={styles.seccionTitulo}>
              Invitaciones pendientes <span className={styles.cuenta}>{invitaciones.length}</span>
            </h2>
          </div>
          <ul className={styles.lista}>{invitaciones.map(renderInvitacion)}</ul>
        </section>
      )}

      <InvitarUsuarioModal
        isOpen={modalInvitarAbierta}
        onClose={cerrarInvitar}
        onInvitar={invitar}
        entraComoAdmin={empresaSinCeder}
        invitacionPendiente={invitaciones[0]?.email}
      />

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
          aQuitar ? { titulo: aQuitar.email, subtitulo: ETIQUETA_ROL[aQuitar.rol] } : undefined
        }
        confirmText={aQuitar?.esVos ? "Dejar la empresa" : "Quitar acceso"}
        cancelText="Volver"
      />
    </section>
  );
}
