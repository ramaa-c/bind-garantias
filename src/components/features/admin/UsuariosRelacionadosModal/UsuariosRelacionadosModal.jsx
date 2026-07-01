import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, Button, InputSimple, Spinner } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import {
  useObtenerUsuariosRelacionados,
  useCrearUsuarioCadenaValor,
  useActualizarUsuarioCadenaValor,
  useCrearUsuario
} from "../../../../hooks/useUsuario";
import { usuarioService } from "../../../../services/usuarioService";
import { useChannel } from "../../../../context/ChannelContext";
import styles from "./UsuariosRelacionadosModal.module.css";
import { FiPlus, FiX, FiUserPlus } from "react-icons/fi";

const EMPTY_ARRAY = [];

export const UsuariosRelacionadosModal = ({ isOpen, onClose, activeItem }) => {
  const { channelInfo } = useChannel();
  const [showForm, setShowForm] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Queries & Mutations
  const { data: relationsData, isLoading: loadingRelations, error: errorRelations } =
    useObtenerUsuariosRelacionados(activeItem?.cadenavalorid);

  const linkMutation = useCrearUsuarioCadenaValor();
  const updateMutation = useActualizarUsuarioCadenaValor();
  const createUserMutation = useCrearUsuario();

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

  const getCSharpIsoDate = (addYears = 0) => {
    const date = new Date();
    if (addYears) date.setFullYear(date.getFullYear() + addYears);
    return date.toISOString().split(".")[0];
  };

  const handleCreateAndLink = async () => {
    const trimmedEmail = searchEmail.trim().toLowerCase();
    if (!trimmedEmail) return;

    setIsCreatingUser(true);

    const canalId = (channelInfo?.id && channelInfo.id !== "default" && channelInfo.id !== "bind") ? channelInfo.id : "canal1";

    const payloadNuevoUsuario = {
      email: trimmedEmail,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: canalId,
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: canalId,
    };

    try {
      let userId = null;
      let targetUser = null;

      // 1. Check if user already exists
      try {
        const userData = await usuarioService.obtenerPorNombreOEmail(trimmedEmail);
        targetUser = Array.isArray(userData)
          ? userData[0]
          : (userData?.items?.[0] || userData?.data?.[0] || userData?.resultados?.[0] || userData?.list?.[0] || userData);
        userId = targetUser?.usuariowebid || targetUser?.usuarioid || targetUser?.id || targetUser?.UsuarioWebID;
      } catch (e) {
        // User not found, we will create them below
      }

      if (!userId) {
        // 2. Call create endpoint only if user doesn't exist
        try {
          const createdUser = await createUserMutation.mutateAsync(payloadNuevoUsuario);
          userId = createdUser?.usuariowebid || createdUser?.usuarioid || createdUser?.id || createdUser?.data?.usuariowebid || createdUser?.data?.usuarioid || createdUser?.data?.id || createdUser?.UsuarioWebID;
        } catch (createErr) {
          const errMsg = createErr.response?.data?.message || createErr.response?.data || createErr.message || "";
          const isAlreadyExists =
            createErr.response?.status === 409 ||
            createErr.response?.status === 400 ||
            errMsg.toLowerCase().includes("existe") ||
            errMsg.toLowerCase().includes("vinculado");

          if (isAlreadyExists) {
            // User already exists, retrieve ID to proceed with linking
            const userData = await usuarioService.obtenerPorNombreOEmail(trimmedEmail);
            targetUser = Array.isArray(userData)
              ? userData[0]
              : (userData?.items?.[0] || userData?.data?.[0] || userData?.resultados?.[0] || userData?.list?.[0] || userData);
            userId = targetUser?.usuariowebid || targetUser?.usuarioid || targetUser?.id || targetUser?.UsuarioWebID;
          } else {
            throw createErr;
          }
        }
        
        if (!userId) {
          // Fallback query
          const userData = await usuarioService.obtenerPorNombreOEmail(trimmedEmail);
          targetUser = Array.isArray(userData)
            ? userData[0]
            : (userData?.items?.[0] || userData?.data?.[0] || userData?.resultados?.[0] || userData?.list?.[0] || userData);
          userId = targetUser?.usuariowebid || targetUser?.usuarioid || targetUser?.id || targetUser?.UsuarioWebID;
        }
      }

      if (!userId) {
        throw new Error("No se pudo obtener el ID del usuario.");
      }

      // 3. Link user to value chain
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
      console.error("Error creating and linking user:", err);
      toast.error(err.response?.data?.message || err.message || "Ocurrió un error al vincular el usuario.");
    } finally {
      setIsCreatingUser(false);
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

        {/* Inline Registration and Link Form */}
        {showForm && (
          <div className={styles.formContainer}>
            <h4 className={styles.formTitle}>Registrar y Vincular Nuevo Usuario</h4>
            <div className={styles.formRow}>
              <div className={styles.inputWrap}>
                <InputSimple
                  className={styles.inputNoPadding}
                  label="Email de usuario"
                  value={searchEmail}
                  onChange={(val) => {
                    setSearchEmail(val);
                  }}
                  disabled={isCreatingUser}
                />
              </div>
              <Button
                variant="blue"
                onClick={handleCreateAndLink}
                isLoading={isCreatingUser}
                disabled={!searchEmail.trim()}
              >
                <FiUserPlus style={{ marginRight: "0.25rem", verticalAlign: "middle" }} /> VINCULAR
              </Button>
            </div>
          </div>
        )}

        {/* Relations List */}
        {loadingRelations ? (
          <div className={styles.loadingContainer}>
            <Spinner size={30} />
            <p className={styles.loadingText}>Cargando usuarios relacionados...</p>
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
