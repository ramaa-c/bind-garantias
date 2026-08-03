import React, { useState } from "react";
import { FiShield, FiUserPlus, FiLock, FiCheck, FiX, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./RolesPermisos.module.css";

const administradoresBase = [
  {
    id: "adm-1",
    nombre: "Matías General",
    email: "admin@bind.com.ar",
    rol: "Super Administrador",
    permisos: {
      tasas: true,
      solicitudes: true,
      roles: true,
      banners: true,
      terminos: true,
    },
    ultimoAcceso: "Hoy, 12:50",
    activo: true,
  },
  {
    id: "adm-2",
    nombre: "Lucía Fernández",
    email: "lfernandez@bind.com.ar",
    rol: "Oficial de Crédito",
    permisos: {
      tasas: false,
      solicitudes: true,
      roles: false,
      banners: false,
      terminos: false,
    },
    ultimoAcceso: "Ayer, 16:30",
    activo: true,
  },
  {
    id: "adm-3",
    nombre: "Carlos Auditor",
    email: "riesgos@bind.com.ar",
    rol: "Auditor de Cuentas",
    permisos: {
      tasas: false,
      solicitudes: false,
      roles: false,
      banners: false,
      terminos: false,
    },
    ultimoAcceso: "10/05/2026",
    activo: true,
  },
  {
    id: "adm-4",
    nombre: "Equipo Marketing",
    email: "promociones@bind.com.ar",
    rol: "Soporte Técnico",
    permisos: {
      tasas: false,
      solicitudes: false,
      roles: false,
      banners: true,
      terminos: false,
    },
    ultimoAcceso: "02/05/2026",
    activo: false,
  },
];

export default function RolesPermisos() {
  const [administradores, setAdministradores] = useState(administradoresBase);
  const [selectedAdmin, setSelectedAdmin] = useState(administradoresBase[0]);

  const handleTogglePermiso = (adminId, clavePermiso) => {
    setAdministradores((prev) =>
      prev.map((adm) => {
        if (adm.id === adminId) {
          const updated = {
            ...adm,
            permisos: {
              ...adm.permisos,
              [clavePermiso]: !adm.permisos[clavePermiso],
            },
          };
          // Actualizar el seleccionado si coincide
          if (selectedAdmin?.id === adminId) {
            setSelectedAdmin(updated);
          }
          return updated;
        }
        return adm;
      })
    );
    toast.success("Permiso modificado exitosamente");
  };

  const handleChangeRol = (adminId, nuevoRol) => {
    setAdministradores((prev) =>
      prev.map((adm) => {
        if (adm.id === adminId) {
          const updated = { ...adm, rol: nuevoRol };
          if (selectedAdmin?.id === adminId) setSelectedAdmin(updated);
          return updated;
        }
        return adm;
      })
    );
    toast.info(`Rol asignado: ${nuevoRol}`);
  };

  const handleToggleActivo = (adminId) => {
    setAdministradores((prev) =>
      prev.map((adm) => {
        if (adm.id === adminId) {
          const updated = { ...adm, activo: !adm.activo };
          if (selectedAdmin?.id === adminId) setSelectedAdmin(updated);
          return updated;
        }
        return adm;
      })
    );
    toast.info("Estado de acceso del administrador modificado");
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Control de Roles y Permisos Internos</h1>
          <p>
            Administrá los niveles de acceso a la consola de administración, autorizaciones para
            modificar tasas, validar CUITs y gestionar solicitudes.
          </p>
        </div>
        <button type="button"
          onClick={() => {
            toast.info("Apertura de formulario para invitar nuevo administrador");
          }}
          className={styles.btnAdd}
        >
          <FiUserPlus /> Nuevo Administrador
        </button>
      </div>

      <div className={styles.splitLayout}>
        {/* Lista de Administradores */}
        <div className={styles.adminListCol}>
          <h3 className={styles.sectionLabel}>Cuentas de Administración</h3>
          <div className={styles.listContainer}>
            {administradores.map((adm) => {
              const isSelected = selectedAdmin?.id === adm.id;
              return (
                <div
                  key={adm.id}
                  onClick={() => setSelectedAdmin(adm)}
                  className={`${styles.adminCard} ${isSelected ? styles.cardSelected : ""}`}
                >
                  <div className={styles.cardHeaderInfo}>
                    <div className={styles.avatarBox}>
                      {adm.nombre.charAt(0)}
                    </div>
                    <div className={styles.textStack}>
                      <span className={styles.adminName}>{adm.nombre}</span>
                      <span className={styles.adminEmail}>{adm.email}</span>
                    </div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.roleTag}>{adm.rol}</span>
                    <span
                      className={`${styles.statusDotTag} ${
                        adm.activo ? styles.dotActive : styles.dotInactive
                      }`}
                    >
                      {adm.activo ? "Activo" : "Bloqueado"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Permisos Detallado */}
        <div className={styles.permisosPanelCol}>
          {selectedAdmin ? (
            <div className={styles.permisosInner}>
              <div className={styles.panelHead}>
                <div className={styles.avatarLarge}>
                  <FiShield size={24} />
                </div>
                <div>
                  <h2>Configuración de Seguridad</h2>
                  <p>Cuenta actual: <strong>{selectedAdmin.nombre}</strong></p>
                </div>
              </div>

              {/* Opciones de Rol Base */}
              <div className={styles.configBlock}>
                <label className={styles.blockTitle}>Nivel de Rol Global</label>
                <select
                  value={selectedAdmin.rol}
                  onChange={(e) => handleChangeRol(selectedAdmin.id, e.target.value)}
                  className={styles.rolSelect}
                >
                  <option value="Super Administrador">Super Administrador (Acceso Total)</option>
                  <option value="Oficial de Crédito">Oficial de Crédito (Gestión Solicitudes)</option>
                  <option value="Auditor de Cuentas">Auditor de Cuentas (Solo Lectura)</option>
                  <option value="Soporte Técnico">Soporte Técnico (Banners y Textos)</option>
                </select>
                <span className={styles.helpNote}>
                  Define plantillas de permisos preconfiguradas aplicadas al equipo.
                </span>
              </div>

              {/* Permisos Granulares Toggles */}
              <div className={styles.configBlock}>
                <label className={styles.blockTitle}>Permisos Específicos Granulares</label>
                <div className={styles.togglesList}>
                  {/* Modificar Tasas */}
                  <div className={styles.toggleRow}>
                    <div>
                      <span className={styles.toggleLabel}>Modificar Tasas y Límites</span>
                      <span className={styles.toggleDesc}>
                        Habilita la pestaña de Herramientas para cambiar TNAs y montos.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermiso(selectedAdmin.id, "tasas")}
                      className={styles.btnToggleSwitch}
                    >
                      {selectedAdmin.permisos.tasas ? (
                        <FiToggleRight size={32} className={styles.switchOn} />
                      ) : (
                        <FiToggleLeft size={32} className={styles.switchOff} />
                      )}
                    </button>
                  </div>

                  {/* Gestionar Solicitudes */}
                  <div className={styles.toggleRow}>
                    <div>
                      <span className={styles.toggleLabel}>Aprobar / Rechazar Solicitudes</span>
                      <span className={styles.toggleDesc}>
                        Permite tomar decisiones finales sobre las líneas en Mis Pendientes.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermiso(selectedAdmin.id, "solicitudes")}
                      className={styles.btnToggleSwitch}
                    >
                      {selectedAdmin.permisos.solicitudes ? (
                        <FiToggleRight size={32} className={styles.switchOn} />
                      ) : (
                        <FiToggleLeft size={32} className={styles.switchOff} />
                      )}
                    </button>
                  </div>

                  {/* Configurar Roles */}
                  <div className={styles.toggleRow}>
                    <div>
                      <span className={styles.toggleLabel}>Administrar Roles y Cuentas</span>
                      <span className={styles.toggleDesc}>
                        Acceso a esta misma pantalla para invitar o bloquear usuarios administradores.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermiso(selectedAdmin.id, "roles")}
                      className={styles.btnToggleSwitch}
                    >
                      {selectedAdmin.permisos.roles ? (
                        <FiToggleRight size={32} className={styles.switchOn} />
                      ) : (
                        <FiToggleLeft size={32} className={styles.switchOff} />
                      )}
                    </button>
                  </div>

                  {/* Insertar Banners */}
                  <div className={styles.toggleRow}>
                    <div>
                      <span className={styles.toggleLabel}>Insertar y Editar Banners</span>
                      <span className={styles.toggleDesc}>
                        Gestión visual de promociones para el portal de clientes.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermiso(selectedAdmin.id, "banners")}
                      className={styles.btnToggleSwitch}
                    >
                      {selectedAdmin.permisos.banners ? (
                        <FiToggleRight size={32} className={styles.switchOn} />
                      ) : (
                        <FiToggleLeft size={32} className={styles.switchOff} />
                      )}
                    </button>
                  </div>

                  {/* Modificar Términos */}
                  <div className={styles.toggleRow}>
                    <div>
                      <span className={styles.toggleLabel}>Criterios y Términos Legales</span>
                      <span className={styles.toggleDesc}>
                        Edición de TyC, disclaimers y notificaciones legales.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermiso(selectedAdmin.id, "terminos")}
                      className={styles.btnToggleSwitch}
                    >
                      {selectedAdmin.permisos.terminos ? (
                        <FiToggleRight size={32} className={styles.switchOn} />
                      ) : (
                        <FiToggleLeft size={32} className={styles.switchOff} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Acciones de Cuenta */}
              <div className={styles.panelFooter}>
                <div className={styles.lastAccessText}>
                  Última actividad registrada: {selectedAdmin.ultimoAcceso}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActivo(selectedAdmin.id)}
                  className={`${styles.btnBlockAccount} ${
                    selectedAdmin.activo ? styles.btnDanger : styles.btnSuccess
                  }`}
                >
                  <FiLock /> {selectedAdmin.activo ? "Bloquear Acceso" : "Desbloquear Acceso"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptySelection}>
              <p>Seleccioná un administrador del listado izquierdo para configurar sus permisos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
