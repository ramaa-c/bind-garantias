import React, { useState, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiBriefcase,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiExternalLink,
  FiUsers,
  FiUser,
  FiMail,
  FiPercent,
  FiChevronDown,
} from "react-icons/fi";
import { toast } from "sonner";
import { CargaArchivos, Button } from "../../../../ui";
import { useEmpresaActiva } from "../../../../../hooks/useEmpresaActiva";
import { tercerosService } from "../../../../../services/tercerosService";
import { sociosService } from "../../../../../services/sociosService";
import { usuarioService } from "../../../../../services/usuarioService";
import styles from "./DocumentosLegajo.module.css";

const ESTRUCTURA_LEGAJO = [
  {
    category: "Empresa",
    key: "perfil",
    title: "Perfil corporativo",
    info: "Datos identificatorios registrados en la plataforma.",
  },
  {
    category: "Documentación",
    key: "certificadoPyme",
    title: "Certificado de PyME",
    info: "Acredita tu condición ante la AFIP y organismos. Si no lo tenés, podés ",
    linkText: "obtenerlo aquí.",
    url: "https://pyme.produccion.gob.ar/certificado/",
  },
  {
    category: "Documentación",
    key: "poderes",
    title: "Poderes",
    info: "Documento que autoriza a un representante legal.",
  },
  {
    category: "Documentación",
    key: "otrosDocumentos",
    title: "Otros documentos",
    info: "Adjuntá cualquier otro documento que consideres necesario.",
  },
  {
    category: "Socios",
    key: "socios",
    title: "Composición accionaria",
    info: "Administración del cuadro accionario y representantes.",
  },
  {
    category: "Socios",
    key: "usuarios",
    title: "Vincular usuarios",
    info: "Otorgá acceso a otros usuarios para operar con esta empresa.",
  },
];

export function DocumentosLegajo() {
  const { control, setValue } = useFormContext();
  const formValues = useWatch({ control });
  const [activeTab, setActiveTab] = useState(ESTRUCTURA_LEGAJO[0].key);
  const { intentoAvanzar } = formValues;

  const { socioIdActivo, nombreEmpresa, cuitActivo, direccion, telefono } =
    useEmpresaActiva();

  const [sociosEmpresa, setSociosEmpresa] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(true);
  const [expandedSocio, setExpandedSocio] = useState(null);

  const [emailVincular, setEmailVincular] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loadingVinculacion, setLoadingVinculacion] = useState(false);

  const cargarSocios = async () => {
    setLoadingSocios(true);
    try {
      const relaciones =
        await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
      const arr = Array.isArray(relaciones) ? relaciones : [];
      const lista = [];
      for (const rel of arr) {
        const tid =
          rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
        if (!tid) continue;
        try {
          const t = await tercerosService.obtenerTerceroPorId(tid);
          if (t)
            lista.push({
              id: tid,
              nombre: t.denominacion || t.Denominacion || "Sin nombre",
              cuit: t.cuit || t.Cuit || "—",
              email: t.mail || t.Mail || "",
              telefono: t.telefono || t.Telefono || "",
              direccion: t.calle || t.Calle || "",
              codpos: t.codpos || t.Codpos || "",
              participacion:
                rel.porcacciones || rel.participacion || rel.Participacion || 0,
            });
        } catch (_) {}
      }
      setSociosEmpresa(lista);
    } catch (e) {
      console.warn("Error cargando socios legajo:", e);
    } finally {
      setLoadingSocios(false);
    }
  };

  useEffect(() => {
    if (!socioIdActivo) {
      setLoadingSocios(false);
      return;
    }
    cargarSocios();
  }, [socioIdActivo]);

  const totalParticipacion = sociosEmpresa.reduce(
    (a, s) => a + Number(s.participacion || 0),
    0,
  );

  const handleFileUpload = (key, file) =>
    setValue(key, file, { shouldValidate: true, shouldDirty: true });
  const handleFileRemove = (key) =>
    setValue(key, null, { shouldValidate: true, shouldDirty: true });

  const handleVincularUsuario = async (e) => {
    if (e) e.preventDefault();
    setEmailError("");

    const emailNormalizado = emailVincular.trim();

    if (!emailNormalizado) {
      setEmailError("Por favor, ingresá un correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalizado)) {
      setEmailError("El formato del correo electrónico no es válido.");
      return;
    }

    // BLOQUE 0: BARRERA DE FRONTEND (Evita el error 500 del backend)
    // Verificamos si el email ya existe en la lista de usuarios/socios renderizada
    const yaEstaVinculado = sociosEmpresa.some(
      (socio) => socio.email?.toLowerCase() === emailNormalizado.toLowerCase(),
    );

    if (yaEstaVinculado) {
      setEmailError("Este usuario ya se encuentra vinculado a la empresa.");
      return;
    }

    setLoadingVinculacion(true);
    let targetUserId = null;

    try {
      const userData =
        await usuarioService.obtenerPorNombreOEmail(emailNormalizado);

      targetUserId =
        userData?.usuariowebid || userData?.UsuarioWebID || userData?.id;

      if (!targetUserId) {
        setEmailError("No se encontró un usuario registrado con este correo.");
        setLoadingVinculacion(false);
        return;
      }
    } catch (err) {
      console.warn("Error buscando usuario:", err);
      setEmailError("No se encontró un usuario registrado con este correo.");
      setLoadingVinculacion(false);
      return;
    }

    try {
      const date = new Date();
      const payloadVinculo = {
        usuariowebid: targetUserId,
        socioid: socioIdActivo,
        momentocreacion: date.toISOString().split(".")[0],
      };

      await sociosService.vincularSocioUsuario(payloadVinculo);

      toast.success("Usuario vinculado exitosamente a la empresa.");
      setEmailVincular("");

      cargarSocios();
    } catch (err) {
      console.error("Error al hacer POST de vinculación:", err);

      if (err.response?.status === 400 || err.response?.status === 409) {
        setEmailError("Este usuario ya se encuentra vinculado a la empresa.");
      } else {
        toast.error(
          "Ocurrió un error en el servidor al intentar vincular el usuario.",
        );
      }
    } finally {
      setLoadingVinculacion(false);
    }
  };

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        {ESTRUCTURA_LEGAJO.map((doc, index) => {
          const isNewCategory =
            index === 0 ||
            doc.category !== ESTRUCTURA_LEGAJO[index - 1].category;
          const isPerfil = doc.key === "perfil";
          const isSocios = doc.key === "socios";
          const isUsuarios = doc.key === "usuarios";
          const currentFile = formValues[doc.key];
          const isComplete =
            isPerfil || isSocios || isUsuarios || !!currentFile;
          const hasError =
            intentoAvanzar &&
            !isPerfil &&
            !isSocios &&
            !isUsuarios &&
            !currentFile;
          const isActive = activeTab === doc.key;

          return (
            <React.Fragment key={doc.key}>
              {isNewCategory && (
                <p className={styles.categoryLabel}>{doc.category}</p>
              )}
              <button
                type="button"
                onClick={() => setActiveTab(doc.key)}
                className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
              >
                {isActive && <span className={styles.activeBar} />}
                <span className={styles.tabTitle}>{doc.title}</span>
                <span
                  className={`${styles.statusDot} ${isComplete ? styles.dotGreen : hasError ? styles.dotRed : styles.dotGray}`}
                />
              </button>
            </React.Fragment>
          );
        })}
      </aside>

      {ESTRUCTURA_LEGAJO.map((doc) => {
        if (activeTab !== doc.key) return null;
        const isPerfil = doc.key === "perfil";
        const isSocios = doc.key === "socios";
        const isUsuarios = doc.key === "usuarios";
        const currentFile = formValues[doc.key];
        const hasError =
          intentoAvanzar &&
          !isPerfil &&
          !isSocios &&
          !isUsuarios &&
          !currentFile;

        return (
          <section key={doc.key} className={styles.viewer}>
            <header className={styles.viewerHeader}>
              <div className={styles.viewerMeta}>
                <span className={styles.viewerBadge}>{doc.category}</span>
              </div>
              <h4 className={styles.viewerTitle}>{doc.title}</h4>
              <p className={styles.viewerInfo}>
                {doc.info}
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.helperLink}
                  >
                    {doc.linkText} <FiExternalLink size={11} />
                  </a>
                )}
              </p>
            </header>

            {isPerfil ? (
              <div className={styles.perfilGrid}>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiBriefcase className={styles.perfilChipIcon} size={13} />
                    <span className={styles.perfilChipLabel}>Razón Social</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {nombreEmpresa || "—"}
                  </span>
                </div>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiCreditCard className={styles.perfilChipIcon} size={13} />
                    <span className={styles.perfilChipLabel}>CUIT</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {cuitActivo || "—"}
                  </span>
                </div>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiMapPin className={styles.perfilChipIcon} size={13} />
                    <span className={styles.perfilChipLabel}>Domicilio</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {direccion || "—"}
                  </span>
                </div>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiPhone className={styles.perfilChipIcon} size={13} />
                    <span className={styles.perfilChipLabel}>Teléfono</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {telefono || "—"}
                  </span>
                </div>
              </div>
            ) : isUsuarios ? (
              <div className={styles.usuariosContainer}>
                <div className={styles.vincularForm}>
                  <h5 className={styles.vincularFormTitle}>
                    Vincular nuevo usuario
                  </h5>
                  <p className={styles.vincularFormText}>
                    Ingresá el correo electrónico del usuario que deseás
                    vincular. Este usuario debe estar previamente registrado en
                    la plataforma Bind Garantías.
                  </p>

                  <div className={styles.vincularInputWrapper}>
                    <div className={styles.vincularInputGroup}>
                      <input
                        type="email"
                        className={`${styles.vincularInput} ${emailError ? styles.vincularInputError : ""}`}
                        placeholder="ejemplo@correo.com"
                        value={emailVincular}
                        onChange={(e) => {
                          setEmailVincular(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        disabled={loadingVinculacion}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleVincularUsuario();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleVincularUsuario}
                        disabled={loadingVinculacion}
                      >
                        {loadingVinculacion
                          ? "Vinculando..."
                          : "Vincular usuario"}
                      </Button>
                    </div>
                    <div className={styles.errorContainer}>
                      {emailError && (
                        <span className={styles.errorMessage}>
                          <FiAlertCircle size={12} /> {emailError}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : isSocios ? (
              <div className={styles.sociosContainer}>
                {loadingSocios ? (
                  <div className={styles.emptySlot}>
                    <FiUsers size={20} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>Cargando socios...</p>
                  </div>
                ) : sociosEmpresa.length === 0 ? (
                  <div className={styles.emptySlot}>
                    <FiUsers size={20} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>Sin socios registrados</p>
                    <span className={styles.emptyText}>
                      Se registran automáticamente al completar tu primera
                      operación.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={styles.sociosStats}>
                      <span className={styles.statBadge}>
                        {sociosEmpresa.length} socio
                        {sociosEmpresa.length > 1 ? "s" : ""}
                      </span>
                      <span
                        className={`${styles.statTotal} ${totalParticipacion === 100 ? styles.statTotalOk : ""}`}
                      >
                        Total: {totalParticipacion}%
                      </span>
                    </div>
                    <div className={styles.sociosList}>
                      {sociosEmpresa.map((socio) => (
                        <div key={socio.id} className={styles.socioCard}>
                          <button
                            type="button"
                            className={styles.socioCardBtn}
                            onClick={() =>
                              setExpandedSocio(
                                expandedSocio === socio.id ? null : socio.id,
                              )
                            }
                          >
                            <div className={styles.socioAvatar}>
                              <FiUser size={16} />
                            </div>
                            <div className={styles.socioMainInfo}>
                              <span className={styles.socioName}>
                                {socio.nombre}
                              </span>
                              <span className={styles.socioCuit}>
                                CUIT: {socio.cuit}
                              </span>
                            </div>
                            <span className={styles.socioPct}>
                              {socio.participacion}%
                            </span>
                            <FiChevronDown
                              className={`${styles.socioChevron} ${expandedSocio === socio.id ? styles.socioChevronOpen : ""}`}
                            />
                          </button>
                          <div
                            className={`${styles.socioExpand} ${expandedSocio === socio.id ? styles.socioExpandOpen : ""}`}
                          >
                            <div className={styles.socioDetailGrid}>
                              {socio.email && (
                                <div className={styles.socioDetail}>
                                  <FiMail className={styles.socioDetailIcon} />
                                  <div>
                                    <span className={styles.socioDetailLabel}>
                                      Email
                                    </span>
                                    <span className={styles.socioDetailVal}>
                                      {socio.email}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {socio.telefono && (
                                <div className={styles.socioDetail}>
                                  <FiPhone className={styles.socioDetailIcon} />
                                  <div>
                                    <span className={styles.socioDetailLabel}>
                                      Teléfono
                                    </span>
                                    <span className={styles.socioDetailVal}>
                                      {socio.telefono}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {socio.direccion && (
                                <div className={styles.socioDetail}>
                                  <FiMapPin
                                    className={styles.socioDetailIcon}
                                  />
                                  <div>
                                    <span className={styles.socioDetailLabel}>
                                      Dirección
                                    </span>
                                    <span className={styles.socioDetailVal}>
                                      {socio.direccion}
                                      {socio.codpos ? ` (${socio.codpos})` : ""}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className={styles.socioDetail}>
                                <FiPercent className={styles.socioDetailIcon} />
                                <div>
                                  <span className={styles.socioDetailLabel}>
                                    Participación
                                  </span>
                                  <span className={styles.socioDetailVal}>
                                    {socio.participacion}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.dropzoneContainer}>
                <CargaArchivos
                  title={doc.title}
                  hasError={hasError}
                  file={
                    currentFile
                      ? { name: currentFile.name, size: currentFile.size }
                      : null
                  }
                  onClick={() =>
                    document.getElementById(`file-input-${doc.key}`).click()
                  }
                  onRemove={() => handleFileRemove(doc.key)}
                />
                <input
                  type="file"
                  id={`file-input-${doc.key}`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      handleFileUpload(doc.key, e.target.files[0]);
                  }}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
