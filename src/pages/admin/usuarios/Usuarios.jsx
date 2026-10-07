import React, { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { FiInbox, FiSearch, FiX, FiUsers, FiLock, FiUnlock } from "react-icons/fi";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { SelectSimple } from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import {
  useListarUsuarios,
  useBloquearUsuario,
  useDesbloquearUsuario,
} from "../../../hooks/useUsuario";
import { useAuthStore } from "../../../store/useAuthStore";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import {
  ESTADO_USUARIO,
  esAdministradorActivo,
  esUsuarioBloqueadoPorAdmin,
} from "../../../utils/usuarioUtils";
import styles from "./Usuarios.module.css";

const ELEMENTOS_POR_PAGINA = 8;

const ESTADOS = {
  [ESTADO_USUARIO.ACTIVO]: { label: "Activo", tono: "activo" },
  [ESTADO_USUARIO.PENDIENTE_ACTIVACION]: { label: "Pendiente de activación", tono: "pendiente" },
  [ESTADO_USUARIO.BLOQUEADO]: { label: "Bloqueado por intentos", tono: "intentos" },
  [ESTADO_USUARIO.BLOQUEADO_ADMIN]: { label: "Bloqueado por admin", tono: "admin" },
};

const ESTADO_DESCONOCIDO = { label: "Sin definir", tono: "indefinido" };

const FILTROS_POR_DEFECTO = {
  tipo: "todos",
  estado: "todos",
  orden: "recientes",
};

const OPCIONES_TIPO = [
  { value: "todos", label: "Todos los tipos" },
  { value: "admin", label: "Administrador" },
  { value: "usuario", label: "Usuario" },
];

const OPCIONES_ESTADO = [
  { value: "todos", label: "Todos los estados" },
  ...Object.entries(ESTADOS).map(([value, { label }]) => ({ value, label })),
];

const OPCIONES_ORDEN = [
  { value: "recientes", label: "Más recientes" },
  { value: "antiguos", label: "Más antiguos" },
  { value: "az", label: "Email A-Z" },
  { value: "za", label: "Email Z-A" },
];

const normalizarLista = (data) => {
  if (Array.isArray(data)) return data;
  return data?.items || data?.data || data?.resultados || data?.list || [];
};

const leerId = (u) => u?.usuariowebid ?? u?.id ?? null;

const leerEstado = (u) => String(u?.estado ?? "");

const getEstado = (u) => ESTADOS[leerEstado(u)] || ESTADO_DESCONOCIDO;

const formatearFecha = (valor) => {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "-";
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getIniciales = (email) => (email ? email.slice(0, 2).toUpperCase() : "?");

const mensajeErrorAccion = (error, accion) => {
  const status = error?.response?.status;
  if (!error?.response || status >= 500) return "Ocurrió un error en el servidor. Intentá más tarde.";
  if (status === 403) return "No tenés permisos para realizar esta acción.";
  if (status === 404) return "No se encontró el usuario.";
  if (status === 409 && accion === "desbloquear") {
    return "El usuario no estaba bloqueado por un administrador.";
  }
  return `No se pudo ${accion} al usuario.`;
};

const UsuarioRowSkeleton = () => (
  <tr>
    <td>
      <div className={styles.usuarioCell}>
        <Skeleton width="2.35rem" height="2.35rem" radius="50%" />
        <div className={styles.usuarioInfo}>
          <Skeleton height="0.9rem" width="70%" />
          <Skeleton height="0.7rem" width="30%" style={{ marginTop: "0.4rem" }} />
        </div>
      </div>
    </td>
    <td><Skeleton width="5.5rem" height="1.4rem" radius="pill" /></td>
    <td><Skeleton width="7rem" height="1.4rem" radius="pill" /></td>
    <td><Skeleton width="4.5rem" height="0.8rem" /></td>
    <td><Skeleton width="6.5rem" height="1.9rem" radius="0.5rem" /></td>
  </tr>
);

export default function Usuarios() {
  const bloqueado = useBloqueoAdminRestringido();
  const emailActual = useAuthStore((state) => state.user?.email || "");
  const [busqueda, setBusqueda] = useState("");
  const [debouncedBusqueda] = useDebounce(busqueda, 300);
  const [tipo, setTipo] = useState(FILTROS_POR_DEFECTO.tipo);
  const [estado, setEstado] = useState(FILTROS_POR_DEFECTO.estado);
  const [orden, setOrden] = useState(FILTROS_POR_DEFECTO.orden);
  const [pagina, setPagina] = useState(1);
  const [accionPendiente, setAccionPendiente] = useState(null);

  const { data, isLoading, isFetching, isError } = useListarUsuarios();
  const bloquearMutation = useBloquearUsuario();
  const desbloquearMutation = useDesbloquearUsuario();

  const usuarios = useMemo(() => {
    const termino = debouncedBusqueda.trim().toLowerCase();
    let lista = normalizarLista(data);

    if (termino) {
      lista = lista.filter((u) => String(u.email || "").toLowerCase().includes(termino));
    }

    if (tipo !== FILTROS_POR_DEFECTO.tipo) {
      lista = lista.filter((u) => esAdministradorActivo(u) === (tipo === "admin"));
    }

    if (estado !== FILTROS_POR_DEFECTO.estado) {
      lista = lista.filter((u) => leerEstado(u) === estado);
    }

    return [...lista].sort((a, b) => {
      if (orden === "az") return String(a.email || "").localeCompare(String(b.email || ""));
      if (orden === "za") return String(b.email || "").localeCompare(String(a.email || ""));
      if (orden === "antiguos") return Number(leerId(a)) - Number(leerId(b));
      return Number(leerId(b)) - Number(leerId(a));
    });
  }, [data, debouncedBusqueda, tipo, estado, orden]);

  const totalPaginas = Math.max(1, Math.ceil(usuarios.length / ELEMENTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const usuariosPagina = usuarios.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA,
  );

  const conReinicioDePagina = (setter) => (valor) => {
    setter(valor);
    setPagina(1);
  };

  const hayFiltrosActivos =
    !!busqueda ||
    tipo !== FILTROS_POR_DEFECTO.tipo ||
    estado !== FILTROS_POR_DEFECTO.estado ||
    orden !== FILTROS_POR_DEFECTO.orden;

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setTipo(FILTROS_POR_DEFECTO.tipo);
    setEstado(FILTROS_POR_DEFECTO.estado);
    setOrden(FILTROS_POR_DEFECTO.orden);
    setPagina(1);
  };

  const handleConfirmarAccion = async () => {
    if (!accionPendiente) return;
    const { usuario, accion } = accionPendiente;
    const mutation = accion === "bloquear" ? bloquearMutation : desbloquearMutation;
    try {
      await mutation.mutateAsync(leerId(usuario));
      toast.success(
        accion === "bloquear" ? "Usuario bloqueado" : "Usuario desbloqueado",
        { description: usuario.email },
      );
      setAccionPendiente(null);
    } catch (error) {
      toast.error(
        accion === "bloquear" ? "No se pudo bloquear" : "No se pudo desbloquear",
        { description: mensajeErrorAccion(error, accion) },
      );
    }
  };

  if (bloqueado) return null;

  const esBloqueo = accionPendiente?.accion === "bloquear";
  const emailPendiente = accionPendiente?.usuario?.email || "este usuario";

  return (
    <div className={styles.container}>
      <div className={styles.headerTitle}>
        <div>
          <h1>Usuarios</h1>
          <p>Cuentas registradas en la plataforma. Desde acá podés bloquear o desbloquear el acceso.</p>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={busqueda}
            onChange={(e) => conReinicioDePagina(setBusqueda)(e.target.value)}
            className={styles.inputSearch}
          />
        </div>

        <div className={styles.filterFieldsRow}>
          <SelectSimple
            label="Tipo"
            value={tipo}
            onChange={conReinicioDePagina(setTipo)}
            options={OPCIONES_TIPO}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
          <SelectSimple
            label="Estado"
            value={estado}
            onChange={conReinicioDePagina(setEstado)}
            options={OPCIONES_ESTADO}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
          <SelectSimple
            label="Orden"
            value={orden}
            onChange={conReinicioDePagina(setOrden)}
            options={OPCIONES_ORDEN}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
        </div>

        <button
          type="button"
          className={`${styles.clearFiltersBtn} ${hayFiltrosActivos ? styles.clearFiltersBtnVisible : ""}`}
          onClick={handleLimpiarFiltros}
          disabled={!hayFiltrosActivos}
          tabIndex={hayFiltrosActivos ? 0 : -1}
          title="Limpiar filtros"
          aria-label="Limpiar filtros"
        >
          <FiX />
        </button>

        {!isLoading && (
          <span className={styles.listCount}>
            <FiUsers />
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Usuario</th>
                <th style={{ width: "15%" }}>Tipo</th>
                <th style={{ width: "19%" }}>Estado</th>
                <th style={{ width: "11%" }}>Alta</th>
                <th style={{ width: "15%" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <UsuarioRowSkeleton key={i} />)
              ) : isError || usuariosPagina.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 0 }}>
                    <div className={styles.emptyState}>
                      <FiInbox className={styles.emptyStateIcon} />
                      <span>
                        {isError
                          ? "No se pudo cargar el listado de usuarios. Intentá más tarde."
                          : "No se encontraron usuarios que coincidan con los criterios de búsqueda."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                usuariosPagina.map((u, idx) => {
                  const estadoUsuario = getEstado(u);
                  const esAdmin = esAdministradorActivo(u);
                  const bloqueadoPorAdmin = esUsuarioBloqueadoPorAdmin(u);
                  const esUsuarioActual =
                    !!emailActual &&
                    String(u.email || "").toLowerCase() === emailActual.toLowerCase();
                  return (
                    <tr key={leerId(u) ?? `${u.email}-${idx}`}>
                      <td>
                        <div className={styles.usuarioCell}>
                          <div className={styles.avatar}>{getIniciales(u.email)}</div>
                          <div className={styles.usuarioInfo}>
                            <span className={styles.email} title={u.email}>
                              {u.email || "-"}
                            </span>
                            <span className={styles.usuarioId}>
                              ID {leerId(u) ?? "-"}
                              {esUsuarioActual && " · Vos"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${esAdmin ? styles.tipoAdmin : styles.tipoUsuario}`}>
                          {esAdmin ? "Administrador" : "Usuario"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[`estado-${estadoUsuario.tono}`]}`}>
                          {estadoUsuario.label}
                        </span>
                      </td>
                      <td className={styles.fecha}>{formatearFecha(u.fchalta)}</td>
                      <td className={styles.accionCell}>
                        {bloqueadoPorAdmin ? (
                          <button
                            type="button"
                            className={`${styles.accionBtn} ${styles.accionDesbloquear}`}
                            onClick={() => setAccionPendiente({ usuario: u, accion: "desbloquear" })}
                          >
                            <FiUnlock /> Desbloquear
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.accionBtn} ${styles.accionBloquear}`}
                            onClick={() => setAccionPendiente({ usuario: u, accion: "bloquear" })}
                            disabled={esUsuarioActual}
                            title={esUsuarioActual ? "No podés bloquear tu propia cuenta" : undefined}
                          >
                            <FiLock /> Bloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && usuarios.length > 0 && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPagina}
          hasMoreData={paginaActual < totalPaginas}
          isLoading={isFetching}
          knownEndPage={totalPaginas}
          variant="admin"
          totalItems={usuarios.length}
          pageSize={ELEMENTOS_POR_PAGINA}
          itemLabel="usuarios"
        />
      )}

      <ConfirmacionModal
        isOpen={!!accionPendiente}
        onClose={() => setAccionPendiente(null)}
        onConfirm={handleConfirmarAccion}
        isLoading={bloquearMutation.isPending || desbloquearMutation.isPending}
        variant="blue"
        tone={esBloqueo ? "danger" : "warning"}
        titulo={esBloqueo ? "Bloquear usuario" : "Desbloquear usuario"}
        mensaje={
          esBloqueo
            ? `${emailPendiente} no va a poder ingresar a la plataforma hasta que un administrador lo desbloquee. Los enlaces que tenga pendientes por mail dejan de funcionar.`
            : `${emailPendiente} va a poder volver a ingresar a la plataforma.`
        }
        confirmText={esBloqueo ? "Bloquear" : "Desbloquear"}
      />
    </div>
  );
}
