import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, Button, InputSimple, Skeleton } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import {
  useObtenerUsuariosRelacionados,
  useCrearUsuarioCadenaValor,
  useActualizarUsuarioCadenaValor,
} from "../../../../hooks/useUsuario";
import { usuarioService } from "../../../../services/usuarioService";
import styles from "./UsuariosRelacionadosModal.module.css";
import { FiPlus, FiX, FiUserPlus } from "react-icons/fi";

const EMPTY_ARRAY = [];

const esAdministradorActivo = (registro) => {
  const valor = registro?.esadministrador ?? registro?.EsAdministrador;
  return valor === "1" || valor === 1 || valor === true;
};

export const UsuariosRelacionadosModal = ({ isOpen, onClose, activeItem }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [isVinculando, setIsVinculando] = useState(false);

  // Queries & Mutations
  const { data: relationsData, isLoading: loadingRelations, error: errorRelations } =
    useObtenerUsuariosRelacionados(activeItem?.cadenavalorid);

  const linkMutation = useCrearUsuarioCadenaValor();
  const updateMutation = useActualizarUsuarioCadenaValor();

  const relationsList = relationsData || EMPTY_ARRAY;

  const [userEmails, setUserEmails] = useState({});

  useEffect(() => {
    if (!relationsList || relationsList.length === 0) return;

    const fetchEmails = async () => {
      const newEmails = { ...userEmails };
      let changed = false;

      for (const relation of relationsList) {
        const uid = relation.usuariowebid;
        if (uid && !newEmails[uid]) {
          try {
            const uData = await usuarioService.obtenerUsuarioPorId(uid);
            const email = uData?.email || uData?.username || `ID: #${uid}`;
            newEmails[uid] = email;
            changed = true;
          } catch (err) {
            console.error(`Error fetching user details for ID ${uid}:`, err);
            newEmails[uid] = `ID: #${uid}`;
            changed = true;
          }
        }
      }

      if (changed) {
        setUserEmails(newEmails);
      }
    };

    fetchEmails();
  }, [relationsList]);

  // Los usuarios se autoregistran desde el login de su banco (ver
  // Registro.jsx) — el admin nunca los da de alta, solo busca y vincula a
  // uno que ya existe. Si no lo encuentra, hay que avisarle a la persona
  // que todavía no se registró en vez de crearle la cuenta desde acá.
  const handleVincular = async () => {
    const trimmedEmail = searchEmail.trim().toLowerCase();
    if (!trimmedEmail) return;

    setIsVinculando(true);

    try {
      let targetUser = null;
      try {
        const userData = await usuarioService.obtenerPorNombreOEmail(trimmedEmail);
        targetUser = Array.isArray(userData)
          ? userData[0]
          : (userData?.items?.[0] || userData?.data?.[0] || userData?.resultados?.[0] || userData?.list?.[0] || userData);
      } catch {
        targetUser = null;
      }

      const userId = targetUser?.usuariowebid || targetUser?.usuarioid || targetUser?.id || targetUser?.UsuarioWebID;

      if (!userId) {
        toast.error("Usuario no encontrado", {
          description: "Todavía no se registró. Pedile que entre al login de esta cadena y se registre primero.",
        });
        return;
      }

      // Un Administrador General ya tiene acceso a todas las cadenas de
      // valor: no tiene sentido (ni corresponde) vincularlo a una en
      // particular como usuario de cadena.
      if (esAdministradorActivo(targetUser)) {
        toast.error("No se puede vincular este usuario", {
          description:
            "Es Administrador General y ya tiene acceso a todas las cadenas de valor.",
        });
        return;
      }

      const payloadLink = {
        usuariocadenavalorid: 0,
        cadenavalorid: Number(activeItem.cadenavalorid),
        usuariowebid: Number(userId),
        activa: "1"
      };

      try {
        await linkMutation.mutateAsync(payloadLink);
        toast.success("Usuario vinculado exitosamente");
      } catch (linkErr) {
        const linkErrMsg = linkErr.response?.data?.message || linkErr.response?.data || linkErr.message || "";
        const isAlreadyLinked =
          linkErr.response?.status === 409 ||
          linkErr.response?.status === 400 ||
          linkErrMsg.toLowerCase().includes("vinculado") ||
          linkErrMsg.toLowerCase().includes("existe");

        if (isAlreadyLinked) {
          toast.info("El usuario ya se encuentra vinculado a esta cadena de valor.");
        } else {
          throw linkErr;
        }
      }

      setSearchEmail("");
      setShowForm(false);
    } catch (err) {
      console.error("Error linking user:", err);
      toast.error(err.response?.data?.message || err.message || "Ocurrió un error al vincular el usuario.");
    } finally {
      setIsVinculando(false);
    }
  };

  const handleToggleStatus = (relation) => {
    const newStatus = relation.activa === "1" ? "0" : "1";
    const payload = {
      usuariocadenavalorid: relation.usuariocadenavalorid,
      cadenavalorid: relation.cadenavalorid,
      usuariowebid: relation.usuariowebid,
      activa: newStatus
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Usuario ${newStatus === "1" ? "habilitado" : "deshabilitado"} exitosamente.`);
      },
      onError: (err) => {
        console.error("Error updating relation status:", err);
        toast.error("Ocurrió un error al actualizar el estado del usuario.");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="USUARIOS AUTORIZADOS"
      maxWidth="600px"
      variant="blue"
    >
      <div className={styles.modalBody}>
        <CadenaHeaderCard
          denominacion={activeItem?.denominacion}
          logo={activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
        />
        
        <div className={styles.introRow}>
          <p className={styles.introText}>
            Usuarios autorizados a interactuar con esta cadena de valor en la plataforma web.
          </p>
          <button type="button"
            className={styles.btnNuevoBlue}
            style={{ marginBottom: 0, flexShrink: 0 }}
            onClick={() => {
              setShowForm((prev) => !prev);
              setSearchEmail("");
            }}
          >
            {showForm ? <><FiX style={{ marginRight: "0.25rem", verticalAlign: "middle" }} /> CANCELAR</> : <><FiPlus style={{ marginRight: "0.25rem", verticalAlign: "middle" }} /> NUEVO</>}
          </button>
        </div>

        {/* Inline Link Form */}
        {showForm && (
          <div className={styles.formContainer}>
            <h4 className={styles.formTitle}>Vincular Usuario Existente</h4>
            <div className={styles.formRow}>
              <div className={styles.inputWrap}>
                <InputSimple
                  className={styles.inputNoPadding}
                  label="Email de usuario"
                  value={searchEmail}
                  onChange={(val) => {
                    setSearchEmail(val);
                  }}
                  disabled={isVinculando}
                />
              </div>
              <Button
                variant="blue"
                onClick={handleVincular}
                isLoading={isVinculando}
                disabled={!searchEmail.trim()}
              >
                <FiUserPlus style={{ marginRight: "0.25rem", verticalAlign: "middle" }} /> VINCULAR
              </Button>
            </div>
          </div>
        )}

        {/* Relations List */}
        {loadingRelations ? (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Nombre de usuario / Email</th>
                  <th>Habilitado</th>
                  <th style={{ textAlign: "right", width: "120px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton width="70%" height="0.85rem" /></td>
                    <td><Skeleton width="2.6rem" height="1.3rem" radius="pill" /></td>
                    <td>
                      <Skeleton width="6.5rem" height="1.8rem" radius="0.5rem" style={{ marginLeft: "auto" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : errorRelations ? (
          <div className={styles.emptyContainer} style={{ borderColor: "rgba(234, 74, 90, 0.2)" }}>
            <p className={styles.errorText}>Error al cargar los usuarios relacionados. Reintente más tarde.</p>
          </div>
        ) : relationsList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No hay usuarios vinculados a esta cadena de valor.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Nombre de usuario / Email</th>
                  <th>Habilitado</th>
                  <th style={{ textAlign: "right", width: "120px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {relationsList.map((relation) => (
                  <tr key={relation.usuariocadenavalorid}>
                    <td>
                      <span className={styles.userMailText}>
                        {userEmails[relation.usuariowebid] || relation.email || relation.username || `Cargando email (ID: #${relation.usuariowebid})`}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          relation.activa === "1"
                            ? styles.statusBadgeActive
                            : styles.statusBadgeInactive
                        }
                      >
                        {relation.activa === "1" ? "Sí" : "No"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className={
                          relation.activa === "1"
                            ? styles.btnActionDisable
                            : styles.btnActionEnable
                        }
                        onClick={() => handleToggleStatus(relation)}
                        disabled={updateMutation.isPending}
                      >
                        {relation.activa === "1" ? "Deshabilitar" : "Habilitar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div
        className={styles.modalFoot}
        style={{
          margin: "1.5rem -1.5rem -1.5rem -1.5rem",
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid rgba(43, 113, 200, 0.12)",
          display: "flex",
          justifyContent: "flex-end",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <Button variant="outlineBlue" onClick={onClose}>
          CERRAR
        </Button>
      </div>
    </Modal>
  );
};
