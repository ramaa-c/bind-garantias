import React, { useState } from "react";
import {
  FiUser,
  FiShield,
  FiLock,
  FiUnlock,
  FiRotateCcw,
  FiSearch,
} from "react-icons/fi";
import { useDebounce } from "use-debounce";
import {
  useBuscarUsuarios,
  useBloquearUsuario,
  useReactivarUsuario,
  useResetearPassword,
} from "../../hooks/useUsuario";
import { BuscadorListado, Paginacion } from "../../components/ui";
import Spinner from "../../components/ui/Spinner/Spinner";
import styles from "./PantallaGestionUsuarios.module.css";

export const PantallaGestionUsuarios = () => {
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [debouncedBusqueda] = useDebounce(terminoBusqueda, 400);
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const isEmailSearch = debouncedBusqueda.includes("@");
  const {
    data: usuariosData,
    isLoading,
    isFetching,
  } = useBuscarUsuarios(
    paginaActual,
    elementosPorPagina,
    isEmailSearch ? debouncedBusqueda : "",
    !isEmailSearch ? debouncedBusqueda : "",
  );

  const mutationBloquear = useBloquearUsuario();
  const mutationReactivar = useReactivarUsuario();
  const mutationReset = useResetearPassword();

  const rawUsuarios =
    usuariosData?.items ||
    usuariosData?.data ||
    usuariosData?.resultados ||
    usuariosData;
  const usuarios = Array.isArray(rawUsuarios) ? rawUsuarios : [];

  const hasMoreData = usuarios.length === elementosPorPagina;

  const handleBloquear = async (id) => {
    if (
      window.confirm("¿Estás seguro de que deseas bloquear a este usuario?")
    ) {
      await mutationBloquear.mutateAsync(id);
    }
  };

  const handleReactivar = async (id) => {
    if (window.confirm("¿Deseas reactivar el acceso de este usuario?")) {
      await mutationReactivar.mutateAsync(id);
    }
  };

  const handleResetPassword = async (identificador) => {
    if (
      window.confirm(
        "Se enviará un correo de reseteo a este usuario. ¿Continuar?",
      )
    ) {
      await mutationReset.mutateAsync(identificador);
      alert("Solicitud de reseteo enviada con éxito.");
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer}>
            <FiShield />
          </div>
          <div>
            <h1 className={styles.title}>Gestión de Usuarios</h1>
            <p className={styles.subtitle}>
              Administrá los accesos y credenciales de la plataforma.
            </p>
          </div>
        </div>
      </header>

      {/* BARRA DE BÚSQUEDA */}
      <div className={styles.toolbar}>
        <BuscadorListado
          valor={terminoBusqueda}
          onChangeText={(t) => {
            setTerminoBusqueda(t);
            setPaginaActual(1);
          }}
          onLimpiar={() => {
            setTerminoBusqueda("");
            setPaginaActual(1);
          }}
          placeholder="Buscar por nombre o email..."
        />
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.thLeftAlign}`}>Usuario</th>
              <th className={`${styles.th} ${styles.thLeftAlign}`}>Email</th>
              <th className={styles.th}>Estado</th>
              <th className={`${styles.th} ${styles.thRightAlign}`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4">
                  <div className={styles.loadingContainer}>
                    <Spinner size={40} />
                    <p className={styles.tdMuted}>Cargando usuarios...</p>
                  </div>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan="4">
                  <div className={styles.emptyContainer}>
                    <FiSearch className={styles.emptyIcon} />
                    <p className={styles.emptyText}>
                      No se encontraron usuarios.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const isBlocked = u.activo && u.activo.toUpperCase() === "N"; // o distinto de 'S'
                const fullName = [u.nombre, u.apellido]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr
                    key={u.usuarioid || u.id}
                    className={`${styles.tr} ${isBlocked ? styles.rowBlocked : ""}`}
                  >
                    <td className={styles.td}>
                      <div className={styles.userNameContainer}>
                        <FiUser className={styles.userIcon} />
                        <span>{fullName || "Sin Nombre Especificado"}</span>
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>
                      {u.email || "No especificado"}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.badge} ${isBlocked ? styles.badgeBlocked : styles.badgeActive}`}
                      >
                        {isBlocked ? "INACTIVO/BLOQUEADO" : "ACTIVO"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        {isBlocked ? (
                          <button
                            className={styles.actionButton}
                            title="Reactivar Usuario"
                            onClick={() => handleReactivar(u.usuarioid || u.id)}
                            disabled={mutationReactivar.isPending}
                          >
                            <FiUnlock />
                          </button>
                        ) : (
                          <button
                            className={`${styles.actionButton} ${styles.actionDanger}`}
                            title="Bloquear Usuario"
                            onClick={() => handleBloquear(u.usuarioid || u.id)}
                            disabled={mutationBloquear.isPending}
                          >
                            <FiLock />
                          </button>
                        )}
                        <button
                          className={styles.actionButton}
                          title="Reinicio de Contraseña"
                          onClick={() =>
                            handleResetPassword(u.email || u.usuarioid || u.id)
                          }
                          disabled={mutationReset.isPending}
                        >
                          <FiRotateCcw />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {(usuarios.length > 0 || paginaActual > 1) && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPaginaActual}
          hasMoreData={hasMoreData}
          isLoading={isFetching}
        />
      )}
    </div>
  );
};
