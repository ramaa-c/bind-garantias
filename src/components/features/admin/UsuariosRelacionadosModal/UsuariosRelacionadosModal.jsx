import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, Button, InputSimple, Skeleton, Switch } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import {
  useObtenerUsuariosRelacionados,
  useCrearUsuarioCadenaValor,
  useActualizarUsuarioCadenaValor,
} from "../../../../hooks/useUsuario";
import { usuarioService } from "../../../../services/usuarioService";
import { sociosService } from "../../../../services/sociosService";
import styles from "./UsuariosRelacionadosModal.module.css";
import { FiUserPlus, FiAlertCircle, FiUsers } from "react-icons/fi";

const EMPTY_ARRAY = [];

const esAdministradorActivo = (registro) => {
  const valor = registro?.esadministrador ?? registro?.EsAdministrador;
  return valor === "1" || valor === 1 || valor === true;
};

const extraerListaSocios = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return typeof data === "object" && Object.keys(data).length > 0 ? [data] : [];
};

const verificarSociosVinculados = async (usuarioWebId) => {
  try {
    const data = await sociosService.obtenerSocioUsuarioPorUsuarioId(usuarioWebId);
    return extraerListaSocios(data).length > 0 ? "con_socios" : "sin_socios";
  } catch (error) {
    return error?.response?.status === 404 ? "sin_socios" : "error";
  }
};

export const UsuariosRelacionadosModal = ({ isOpen, onClose, activeItem }) => {
  const [searchEmail, setSearchEmail] = useState("");
  const [isVinculando, setIsVinculando] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");

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
    setErrorEmail("");

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
        setErrorEmail(
          "No hay ningún usuario registrado con ese correo. Debe registrarse primero desde el login de su banco.",
        );
        return;
      }

      // Un Administrador General ya tiene acceso a todas las cadenas de
      // valor: no tiene sentido (ni corresponde) vincularlo a una en
      // particular como usuario de cadena.
      if (esAdministradorActivo(targetUser)) {
        setErrorEmail(
          "Es Administrador General: ya tiene acceso a todas las cadenas de valor.",
        );
        return;
      }

      const verificacionSocios = await verificarSociosVinculados(userId);

      if (verificacionSocios === "error") {
        toast.error("No se pudo verificar el usuario", {
          description:
            "No pudimos confirmar si tiene empresas vinculadas. Reintentá en unos minutos.",
        });
        return;
      }

      if (verificacionSocios === "con_socios") {
        setErrorEmail(
          "Ya opera como cliente con una empresa vinculada. Para administrar la cadena debe registrarse con otro correo.",
        );
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

  const emailDe = (relation) =>
    userEmails[relation.usuariowebid] || relation.email || relation.username || `Cargando email (ID: #${relation.usuariowebid})`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Usuarios autorizados"
      subtitle="Usuarios autorizados a interactuar con esta cadena de valor en la plataforma web."
      icono={<FiUsers />}
      maxWidth="640px"
      variant="blue"
      footer={
        <Button variant="adminNeutro" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className={styles.modalBody}>
        <CadenaHeaderCard
          compacta
          denominacion={activeItem?.denominacion}
          logo={activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
        />

        <div className={styles.formContainer}>
          <div className={styles.formRow}>
            <div className={styles.inputWrap}>
              <InputSimple
                className={styles.inputNoPadding}
                label="Vincular usuario existente (email)"
                value={searchEmail}
                onChange={(val) => {
                  setSearchEmail(val);
                  if (errorEmail) setErrorEmail("");
                }}
                disabled={isVinculando}
                error={!!errorEmail}
                hideErrorSpace
                aria-invalid={!!errorEmail}
                aria-describedby={errorEmail ? "error-email-vinculo" : undefined}
              />
            </div>
            <Button
              variant="blue"
              onClick={handleVincular}
              isLoading={isVinculando}
              disabled={!searchEmail.trim()}
            >
              <FiUserPlus aria-hidden="true" /> Vincular
            </Button>
          </div>
          {errorEmail && (
            <p id="error-email-vinculo" className={styles.errorVinculo} role="alert">
              <FiAlertCircle aria-hidden="true" />
              {errorEmail}
            </p>
          )}
        </div>

        <div className={styles.seccionTitulo}>
          <span>Con acceso</span>
          {!loadingRelations && !errorRelations && <span className={styles.contador}>{relationsList.length}</span>}
          <span className={styles.linea} aria-hidden="true" />
        </div>

        {loadingRelations ? (
          <div className={styles.lista}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.fila}>
                <Skeleton width="2rem" height="2rem" radius="0.55rem" />
                <Skeleton width="55%" height="0.85rem" />
              </div>
            ))}
          </div>
        ) : errorRelations ? (
          <div className={`${styles.emptyContainer} ${styles.emptyError}`}>
            <p className={styles.errorText}>Error al cargar los usuarios relacionados. Reintente más tarde.</p>
          </div>
        ) : relationsList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No hay usuarios vinculados a esta cadena de valor.</p>
          </div>
        ) : (
          <ul className={styles.lista}>
            {relationsList.map((relation) => {
              const activa = relation.activa === "1";
              const email = emailDe(relation);
              return (
                <li key={relation.usuariocadenavalorid} className={styles.fila}>
                  <span className={styles.avatar} aria-hidden="true">
                    {email.slice(0, 2).toUpperCase()}
                  </span>
                  <span className={styles.userMailText} title={email}>{email}</span>
                  <span className={`${styles.estado} ${activa ? styles.estadoActivo : ""}`}>
                    {activa ? "Habilitado" : "Deshabilitado"}
                  </span>
                  <Switch
                    checked={activa}
                    onChange={() => handleToggleStatus(relation)}
                    variant="admin"
                    disabled={updateMutation.isPending}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};
