import React, { useState, useEffect, useMemo } from "react";
import { useFormContext, useWatch, useForm } from "react-hook-form";
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
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiSearch,
} from "react-icons/fi";
import { toast } from "sonner";
import { CargaArchivos, Button, Modal, SelectSocio, InputSocioMasked } from "../../../ui";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { tercerosService } from "../../../../services/tercerosService";
import { sociosService } from "../../../../services/sociosService";
import { usuarioService } from "../../../../services/usuarioService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { afipService } from "../../../../services/afipService";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { useObtenerTerceros } from "../../../../hooks/useTerceros";
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

  const [accionistas, setAccionistas] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [agentesBolsa, setAgentesBolsa] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(true);
  const [expandedSocio, setExpandedSocio] = useState(null);
  const [expandedRep, setExpandedRep] = useState(null);
  const [archivosBackend, setArchivosBackend] = useState([]);
  const [uploadingKey, setUploadingKey] = useState(null);

  // Modal open states
  const [modalAccionistaOpen, setModalAccionistaOpen] = useState(false);
  const [modalRepresentanteOpen, setModalRepresentanteOpen] = useState(false);
  const [modalBolsaOpen, setModalBolsaOpen] = useState(false);

  // Edit target states
  const [editAccionista, setEditAccionista] = useState(null);
  const [editRepresentante, setEditRepresentante] = useState(null);
  const [editBolsa, setEditBolsa] = useState(null);

  const [emailVincular, setEmailVincular] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loadingVinculacion, setLoadingVinculacion] = useState(false);

  const cargarSocios = async () => {
    if (!socioIdActivo) return;
    setLoadingSocios(true);
    try {
      const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
      const arr = Array.isArray(relaciones) ? relaciones : [];
      
      const accList = [];
      const repList = [];
      const bolsaList = [];
      
      for (const rel of arr) {
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") continue;
        
        const tid = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
        if (!tid) continue;
        
        try {
          const t = await tercerosService.obtenerTerceroPorId(tid);
          if (t) {
            const tiporel = rel.tiporelacionsocioid || rel.TipoRelacionSocioID || rel.tiporelacionsocioId;
            const item = {
              id: tid,
              relacionId: rel.sociotercerorelacionid || rel.SocioTerceroRelacionID,
              relacion: rel,
              nombre: t.denominacion || t.Denominacion || t.razonsocial || t.RazonSocial || t.nombre || t.Nombre || "Sin nombre",
              cuit: t.cuit || t.Cuit || t.numerodocumento || t.documento || "—",
              email: t.mail || t.Mail || "",
              telefono: t.telefono || t.Telefono || "",
              direccion: t.calle || t.Calle || "",
              codpos: t.codpos || t.Codpos || "",
              participacion: Number(rel.porcacciones || rel.participacion || rel.Participacion || 0),
              rolId: tiporel,
              nrosubcuentacaja: rel.nrosubcuentacaja || rel.NroSubcuentaCaja || "",
              calle: t.calle || "",
              numero: t.numero || 0,
              piso: t.piso || "",
              departamento: t.departamento || "",
              ciudadid: t.ciudadid || 0,
              provinciaid: rel.provinciaid || rel.ProvinciaID || t.provinciaid || 0,
              tipopersonaid: t.tipopersonaid || 1,
            };
            
            if (tiporel === 25) {
              accList.push(item);
            } else if (tiporel === 210 || tiporel === 230) {
              repList.push(item);
            } else if (tiporel === 21) {
              bolsaList.push(item);
            }
          }
        } catch (e) {
          console.warn("Error fetching third party detail:", tid, e);
        }
      }
      
      setAccionistas(accList);
      setRepresentantes(repList);
      setAgentesBolsa(bolsaList);
    } catch (e) {
      console.error("Error loading relations:", e);
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

  const totalParticipacion = useMemo(() => {
    return accionistas.reduce((a, s) => a + Number(s.participacion || 0), 0);
  }, [accionistas]);

  // Handler to delete (deactivate) a relationship by setting fechahasta to now
  const handleEliminarRelacion = async (item) => {
    const isBolsa = item.rolId === 21;
    const confirmMessage = isBolsa 
      ? `¿Está seguro de que desea desvincular al Agente de Bolsa ${item.nombre}?`
      : `¿Está seguro de que desea eliminar a ${item.nombre} del legajo?`;
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const ahora = new Date().toISOString().split(".")[0];
      const payload = {
        ...item.relacion,
        fechahasta: ahora,
        FechaHasta: ahora,
      };
      await tercerosService.actualizarRelacionDeSocio(payload);
      toast.success(isBolsa ? "Agente de bolsa desvinculado exitosamente." : "Registro eliminado exitosamente del legajo.");
      cargarSocios();
    } catch (err) {
      console.error("Error al eliminar relación:", err);
      toast.error("Ocurrió un error al procesar la desvinculación.");
    }
  };

  // Handler to save or update an Accionista
  const handleSaveAccionista = async (formData) => {
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");
      
      // 1. Check if third party exists
      let terceroId = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
        const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
        if (arr.length > 0) {
          terceroId = arr[0].tercerorelacionadoid || arr[0].TerceroRelacionadoID || arr[0].id;
        }
      } catch (err) {
        console.warn("Error buscando tercero existente:", err);
      }

      // 2. Create or update the third party record
      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid: cuitLimpio.startsWith("30") || cuitLimpio.startsWith("33") ? 2 : 1,
        tipodocumentoid: 0,
        numerodocumento: cuitLimpio,
        estadocivilid: 0,
        ciudadid: 0,
        telefono: formData.telefono || "",
        conyuge: "",
        actividad: "",
        contacto: "",
        nrocuenta: "",
        codigomercado: "",
        calle: formData.calle || "",
        numero: Number(formData.numero) || 0,
        piso: formData.piso || "",
        departamento: formData.departamento || "",
        codpos: formData.codpos || "",
        descripcionreducida: formData.nombre.substring(0, 20),
        mail: formData.email || "",
      };

      if (terceroId) {
        await tercerosService.actualizarTercero(payloadTercero);
      } else {
        const res = await tercerosService.crearTercero(payloadTercero);
        terceroId = res.tercerorelacionadoid || res.id;
      }

      // 3. Save or update the relationship
      const ahora = new Date().toISOString().split(".")[0];
      if (formData.relacionId) {
        const payloadRel = {
          ...formData.relacionOriginal,
          porcacciones: Number(formData.participacion),
          provinciaid: Number(formData.provinciaid) || 0,
          telefono: formData.telefono || "",
          momento: ahora,
        };
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
        toast.success("Accionista actualizado correctamente.");
      } else {
        const payloadRel = {
          socioid: socioIdActivo,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: socioIdActivo,
              terceroid: terceroId,
              tiporelacionsocioid: 25,
              fechadesde: ahora,
              fechahasta: null,
              porcacciones: Number(formData.participacion),
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              provinciaid: Number(formData.provinciaid) || 0,
              nrosubcuentacaja: "",
              sucursalid: 0,
              default: "0",
              subtiporelacionsocioid: 0,
              telefono: formData.telefono || "",
              momento: ahora,
            }
          ]
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Accionista agregado al legajo.");
      }
      cargarSocios();
    } catch (err) {
      console.error("Error guardando accionista:", err);
      toast.error("Ocurrió un error al guardar el accionista.");
      throw err;
    }
  };

  // Handler to save or update a Representante
  const handleSaveRepresentante = async (formData) => {
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");
      
      // 1. Check if third party exists
      let terceroId = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
        const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
        if (arr.length > 0) {
          terceroId = arr[0].tercerorelacionadoid || arr[0].TerceroRelacionadoID || arr[0].id;
        }
      } catch (err) {
        console.warn("Error buscando tercero existente:", err);
      }

      // 2. Create or update the third party
      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid: 1, // Representatives are always natural persons
        tipodocumentoid: 0,
        numerodocumento: cuitLimpio,
        estadocivilid: 0,
        ciudadid: 0,
        telefono: formData.telefono || "",
        conyuge: "",
        actividad: "",
        contacto: "",
        nrocuenta: "",
        codigomercado: "",
        calle: "",
        numero: 0,
        piso: "",
        departamento: "",
        codpos: "",
        descripcionreducida: formData.nombre.substring(0, 20),
        mail: formData.email || "",
      };

      if (terceroId) {
        await tercerosService.actualizarTercero(payloadTercero);
      } else {
        const res = await tercerosService.crearTercero(payloadTercero);
        terceroId = res.tercerorelacionadoid || res.id;
      }

      // 3. Create or update relationship
      const ahora = new Date().toISOString().split(".")[0];
      const targetRolId = formData.rol === "Apoderado" ? 210 : 230;

      if (formData.relacionId) {
        const payloadRel = {
          ...formData.relacionOriginal,
          tiporelacionsocioid: targetRolId,
          telefono: formData.telefono || "",
          momento: ahora,
        };
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
        toast.success("Representante actualizado correctamente.");
      } else {
        const payloadRel = {
          socioid: socioIdActivo,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: socioIdActivo,
              terceroid: terceroId,
              tiporelacionsocioid: targetRolId,
              fechadesde: ahora,
              fechahasta: null,
              porcacciones: 0,
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              provinciaid: 0,
              nrosubcuentacaja: "",
              sucursalid: 0,
              default: "0",
              subtiporelacionsocioid: 0,
              telefono: formData.telefono || "",
              momento: ahora,
            }
          ]
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Representante agregado correctamente.");
      }
      cargarSocios();
    } catch (err) {
      console.error("Error guardando representante:", err);
      toast.error("Ocurrió un error al guardar el representante.");
      throw err;
    }
  };

  // Handler to save or update an Agente de Bolsa
  const handleSaveBolsa = async (formData) => {
    try {
      const ahora = new Date().toISOString().split(".")[0];
      
      if (formData.relacionId) {
        const payloadRel = {
          ...formData.relacionOriginal,
          nrosubcuentacaja: String(formData.numeroCuentaBolsa),
          momento: ahora,
        };
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
        toast.success("Cuenta comitente actualizada correctamente.");
      } else {
        const payloadRel = {
          socioid: socioIdActivo,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: socioIdActivo,
              terceroid: Number(formData.sociedadBolsa),
              tiporelacionsocioid: 21,
              fechadesde: ahora,
              fechahasta: null,
              porcacciones: 0,
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              provinciaid: 0,
              nrosubcuentacaja: String(formData.numeroCuentaBolsa),
              sucursalid: 0,
              default: "1",
              subtiporelacionsocioid: 0,
              telefono: "",
              momento: ahora,
            }
          ]
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Agente de bolsa vinculado exitosamente.");
      }
      cargarSocios();
    } catch (err) {
      console.error("Error guardando agente de bolsa:", err);
      toast.error("Ocurrió un error al guardar el agente de bolsa.");
      throw err;
    }
  };

  const handleFileUpload = async (key, file) => {
    setValue(key, file, { shouldValidate: true, shouldDirty: true });

    if (socioIdActivo && file instanceof File) {
      setUploadingKey(key);
      try {
        const docTitle =
          ESTRUCTURA_LEGAJO.find((d) => d.key === key)?.title || key;
        const resultado = await socioArchivoService.subirOActualizar(
          socioIdActivo,
          file,
          key,
          archivosBackend,
          docTitle,
        );
        file._uploaded = true;
        file._backendId = resultado?.socioarchivoid || resultado?.id;

        if (resultado) {
          setArchivosBackend((prev) => {
            const tipoId = socioArchivoService.getTipoDocumentoId(key);
            const filtered = prev.filter(
              (a) => a.tipodocumentoarchivoid !== tipoId,
            );
            return [...filtered, resultado];
          });
        }

        toast.success("Archivo guardado", {
          description: `${docTitle} se guardó correctamente.`,
        });
      } catch (err) {
        console.error(`❌ Error subiendo ${key}:`, err);
        toast.error("Error al guardar archivo", {
          description: "No se pudo subir el archivo. Reintentá más tarde.",
        });
      } finally {
        setUploadingKey(null);
      }
    }
  };
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
                    <FiBriefcase className={styles.perfilChipIcon} size={20} />
                    <span className={styles.perfilChipLabel}>Razón Social</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {nombreEmpresa || "—"}
                  </span>
                </div>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiCreditCard className={styles.perfilChipIcon} size={20} />
                    <span className={styles.perfilChipLabel}>CUIT</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {cuitActivo || "—"}
                  </span>
                </div>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiMapPin className={styles.perfilChipIcon} size={20} />
                    <span className={styles.perfilChipLabel}>Domicilio</span>
                  </div>
                  <span className={styles.perfilChipValue}>
                    {direccion || "—"}
                  </span>
                </div>
                <div className={styles.perfilChip}>
                  <div className={styles.perfilChipHeader}>
                    <FiPhone className={styles.perfilChipIcon} size={20} />
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
                    <p className={styles.emptyTitle}>Cargando composición accionaria...</p>
                  </div>
                ) : (
                  <>
                    {/* 1. SECCIÓN ACCIONISTAS */}
                    <div className={styles.sectionBlock}>
                      <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderLeft}>
                          <FiUsers className={styles.sectionIcon} size={18} />
                          <h5 className={styles.sectionTitle}>Accionistas (Composición Accionaria)</h5>
                        </div>
                        <button
                          type="button"
                          className={styles.addButton}
                          onClick={() => {
                            setEditAccionista(null);
                            setModalAccionistaOpen(true);
                          }}
                        >
                          <FiPlus size={14} /> Agregar Accionista
                        </button>
                      </div>

                      {/* BARRA DE PROGRESO */}
                      <div className={styles.progressContainer}>
                        <div className={styles.progressLabelRow}>
                          <span>Total Participación</span>
                          <span style={{ color: totalParticipacion === 100 ? "#4caf50" : "#ff9800" }}>
                            {totalParticipacion}% / 100%
                          </span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressBar}
                            style={{
                              width: `${Math.min(totalParticipacion, 100)}%`,
                              backgroundColor: totalParticipacion === 100 ? "#4caf50" : "#ff9800",
                            }}
                          />
                        </div>
                      </div>

                      {/* ALERTA BANNER DE 100% */}
                      {totalParticipacion !== 100 ? (
                        <div className={`${styles.alertBanner} ${styles.alertBannerWarning}`}>
                          <FiAlertCircle className={styles.alertIcon} size={16} />
                          <p className={styles.alertText}>
                            La composición accionaria actual debe sumar exactamente el 100% (Actual: {totalParticipacion}%).
                          </p>
                        </div>
                      ) : (
                        <div className={`${styles.alertBanner} ${styles.alertBannerSuccess}`}>
                          <FiCheckCircle className={styles.alertIcon} size={16} />
                          <p className={styles.alertText}>
                            Composición accionaria completa al 100%.
                          </p>
                        </div>
                      )}

                      {accionistas.length === 0 ? (
                        <div className={styles.emptySlot} style={{ minHeight: "6rem", padding: "1.5rem" }}>
                          <p className={styles.emptyTitle}>Sin accionistas registrados</p>
                          <span className={styles.emptyText}>Haga click en "Agregar Accionista" para dar de alta.</span>
                        </div>
                      ) : (
                        <div className={styles.sociosList}>
                          {accionistas.map((socio) => (
                            <div key={socio.id} className={styles.socioCard}>
                              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
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
                                    <span className={styles.socioName}>{socio.nombre}</span>
                                    <span className={styles.socioCuit}>CUIT: {socio.cuit}</span>
                                  </div>
                                  <span className={styles.socioPct}>{socio.participacion}%</span>
                                  <FiChevronDown
                                    className={`${styles.socioChevron} ${expandedSocio === socio.id ? styles.socioChevronOpen : ""}`}
                                  />
                                </button>
                                <div className={styles.socioHeaderActions} style={{ paddingRight: "1rem" }}>
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                                    onClick={() => {
                                      setEditAccionista(socio);
                                      setModalAccionistaOpen(true);
                                    }}
                                    title="Editar Accionista"
                                  >
                                    <FiEdit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                    onClick={() => handleEliminarRelacion(socio)}
                                    title="Eliminar Accionista"
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className={`${styles.socioExpand} ${expandedSocio === socio.id ? styles.socioExpandOpen : ""}`}>
                                <div className={styles.socioDetailGrid}>
                                  {socio.email && (
                                    <div className={styles.socioDetail}>
                                      <FiMail className={styles.socioDetailIcon} />
                                      <div>
                                        <span className={styles.socioDetailLabel}>Email</span>
                                        <span className={styles.socioDetailVal}>{socio.email}</span>
                                      </div>
                                    </div>
                                  )}
                                  {socio.telefono && (
                                    <div className={styles.socioDetail}>
                                      <FiPhone className={styles.socioDetailIcon} />
                                      <div>
                                        <span className={styles.socioDetailLabel}>Teléfono</span>
                                        <span className={styles.socioDetailVal}>{socio.telefono}</span>
                                      </div>
                                    </div>
                                  )}
                                  {socio.direccion && (
                                    <div className={styles.socioDetail}>
                                      <FiMapPin className={styles.socioDetailIcon} />
                                      <div>
                                        <span className={styles.socioDetailLabel}>Dirección</span>
                                        <span className={styles.socioDetailVal}>
                                          {socio.direccion} {socio.codpos ? ` (${socio.codpos})` : ""}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className={styles.socioDetail}>
                                    <FiPercent className={styles.socioDetailIcon} />
                                    <div>
                                      <span className={styles.socioDetailLabel}>Participación</span>
                                      <span className={styles.socioDetailVal}>{socio.participacion}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. SECCIÓN REPRESENTANTES Y APODERADOS */}
                    <div className={styles.sectionBlock}>
                      <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderLeft}>
                          <FiUser className={styles.sectionIcon} size={18} />
                          <h5 className={styles.sectionTitle}>Representantes Legales y Apoderados</h5>
                        </div>
                        <button
                          type="button"
                          className={styles.addButton}
                          onClick={() => {
                            setEditRepresentante(null);
                            setModalRepresentanteOpen(true);
                          }}
                        >
                          <FiPlus size={14} /> Agregar Representante
                        </button>
                      </div>

                      {representantes.length === 0 ? (
                        <div className={styles.emptySlot} style={{ minHeight: "6rem", padding: "1.5rem" }}>
                          <p className={styles.emptyTitle}>Sin representantes registrados</p>
                          <span className={styles.emptyText}>Haga click en "Agregar Representante" para dar de alta.</span>
                        </div>
                      ) : (
                        <div className={styles.sociosList}>
                          {representantes.map((rep) => (
                            <div key={rep.id} className={styles.socioCard}>
                              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                <button
                                  type="button"
                                  className={styles.socioCardBtn}
                                  onClick={() =>
                                    setExpandedRep(
                                      expandedRep === rep.id ? null : rep.id,
                                    )
                                  }
                                >
                                  <div className={styles.socioAvatar}>
                                    <FiUser size={16} />
                                  </div>
                                  <div className={styles.socioMainInfo}>
                                    <span className={styles.socioName}>{rep.nombre}</span>
                                    <span className={styles.socioCuit}>CUIT: {rep.cuit}</span>
                                  </div>
                                  <span className={`${styles.roleBadge} ${rep.rolId === 230 ? styles.roleRepresentante : styles.roleApoderado}`}>
                                    {rep.rolId === 230 ? "Representante Legal" : "Apoderado"}
                                  </span>
                                  <FiChevronDown
                                    className={`${styles.socioChevron} ${expandedRep === rep.id ? styles.socioChevronOpen : ""}`}
                                  />
                                </button>
                                <div className={styles.socioHeaderActions} style={{ paddingRight: "1rem" }}>
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                                    onClick={() => {
                                      setEditRepresentante(rep);
                                      setModalRepresentanteOpen(true);
                                    }}
                                    title="Editar Representante"
                                  >
                                    <FiEdit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                    onClick={() => handleEliminarRelacion(rep)}
                                    title="Eliminar Representante"
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className={`${styles.socioExpand} ${expandedRep === rep.id ? styles.socioExpandOpen : ""}`}>
                                <div className={styles.socioDetailGrid}>
                                  {rep.email && (
                                    <div className={styles.socioDetail}>
                                      <FiMail className={styles.socioDetailIcon} />
                                      <div>
                                        <span className={styles.socioDetailLabel}>Email</span>
                                        <span className={styles.socioDetailVal}>{rep.email}</span>
                                      </div>
                                    </div>
                                  )}
                                  {rep.telefono && (
                                    <div className={styles.socioDetail}>
                                      <FiPhone className={styles.socioDetailIcon} />
                                      <div>
                                        <span className={styles.socioDetailLabel}>Celular / Teléfono</span>
                                        <span className={styles.socioDetailVal}>{rep.telefono}</span>
                                      </div>
                                    </div>
                                  )}
                                  <div className={styles.socioDetail}>
                                    <FiInfo className={styles.socioDetailIcon} />
                                    <div>
                                      <span className={styles.socioDetailLabel}>Relación</span>
                                      <span className={styles.socioDetailVal}>
                                        {rep.rolId === 230 ? "Representante Legal (Gerente Gral)" : "Apoderado de Socio"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. SECCIÓN AGENTES DE BOLSA */}
                    <div className={styles.sectionBlock}>
                      <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderLeft}>
                          <FiBriefcase className={styles.sectionIcon} size={18} />
                          <h5 className={styles.sectionTitle}>Agentes de Bolsa</h5>
                        </div>
                        <button
                          type="button"
                          className={styles.addButton}
                          onClick={() => {
                            setEditBolsa(null);
                            setModalBolsaOpen(true);
                          }}
                        >
                          <FiPlus size={14} /> Vincular Agente de Bolsa
                        </button>
                      </div>

                      {agentesBolsa.length === 0 ? (
                        <div className={styles.emptySlot} style={{ minHeight: "6rem", padding: "1.5rem" }}>
                          <p className={styles.emptyTitle}>Sin agentes de bolsa vinculados</p>
                          <span className={styles.emptyText}>Haga click en "Vincular Agente" para asociar su cuenta.</span>
                        </div>
                      ) : (
                        <div className={styles.sociosList}>
                          {agentesBolsa.map((bolsa) => (
                            <div key={bolsa.id} className={styles.socioCard} style={{ padding: "0.875rem 1rem" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <div className={styles.socioAvatar}>
                                    <FiBriefcase size={16} />
                                  </div>
                                  <div>
                                    <span className={styles.socioName} style={{ display: "block" }}>{bolsa.nombre}</span>
                                    <span className={styles.socioCuit} style={{ display: "block", marginTop: "0.15rem" }}>
                                      Comitente: <strong style={{ color: "#fff" }}>{bolsa.nrosubcuentacaja || "—"}</strong>
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                                    onClick={() => {
                                      setEditBolsa(bolsa);
                                      setModalBolsaOpen(true);
                                    }}
                                    title="Editar Cuenta Comitente"
                                  >
                                    <FiEdit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                    onClick={() => handleEliminarRelacion(bolsa)}
                                    title="Desvincular Agente"
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* MODALES CRUD AUTOCONTENIDOS */}
                <SocioAccionistaModal
                  isOpen={modalAccionistaOpen}
                  onClose={() => {
                    setModalAccionistaOpen(false);
                    setEditAccionista(null);
                  }}
                  onSave={handleSaveAccionista}
                  socio={editAccionista}
                  socioIdActivo={socioIdActivo}
                />

                <RepresentanteModal
                  isOpen={modalRepresentanteOpen}
                  onClose={() => {
                    setModalRepresentanteOpen(false);
                    setEditRepresentante(null);
                  }}
                  onSave={handleSaveRepresentante}
                  representante={editRepresentante}
                  socioIdActivo={socioIdActivo}
                />

                <BolsaModal
                  isOpen={modalBolsaOpen}
                  onClose={() => {
                    setModalBolsaOpen(false);
                    setEditBolsa(null);
                  }}
                  onSave={handleSaveBolsa}
                  agenteBolsa={editBolsa}
                />
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

function SocioAccionistaModal({ isOpen, onClose, onSave, socio, socioIdActivo }) {
  const [validando, setValidando] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      participacion: "",
      email: "",
      telefono: "",
      calle: "",
      numero: "",
      piso: "",
      departamento: "",
      codpos: "",
      provinciaid: "",
    }
  });

  const cuitValue = watch("cuit");
  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  useEffect(() => {
    if (isOpen) {
      if (socio) {
        reset({
          cuit: socio.cuit,
          nombre: socio.nombre,
          participacion: socio.participacion,
          email: socio.email,
          telefono: socio.telefono,
          calle: socio.calle || "",
          numero: socio.numero || "",
          piso: socio.piso || "",
          departamento: socio.departamento || "",
          codpos: socio.codpos || "",
          provinciaid: String(socio.provinciaid || ""),
        });
        setAfipValidado(true);
      } else {
        reset({
          cuit: "",
          nombre: "",
          participacion: "",
          email: "",
          telefono: "",
          calle: "",
          numero: "",
          piso: "",
          departamento: "",
          codpos: "",
          provinciaid: "",
        });
        setAfipValidado(false);
      }
    }
  }, [isOpen, socio, reset]);

  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      toast.error("Por favor, ingrese un CUIT de 11 dígitos válido.");
      return;
    }
    setValidando(true);
    try {
      const res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
      if (res && res.datosgenerales) {
        const dg = res.datosgenerales;
        const nombreSocio = dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Socio AFIP";
        setValue("nombre", nombreSocio, { shouldValidate: true });
        
        if (dg.domicilio) {
          const dom = dg.domicilio;
          if (dom.calle) setValue("calle", dom.calle);
          if (dom.numero) setValue("numero", String(dom.numero));
          if (dom.piso) setValue("piso", dom.piso);
          if (dom.oficinaDepto) setValue("departamento", dom.oficinaDepto);
          if (dom.codigoPostal) setValue("codpos", String(dom.codigoPostal));
        }
        setAfipValidado(true);
        toast.success("CUIT validado en AFIP exitosamente.");
      } else {
        toast.warning("CUIT no encontrado en AFIP, pero puede cargarlo manualmente.");
        setAfipValidado(true);
      }
    } catch (err) {
      console.error("Error validando CUIT en AFIP:", err);
      toast.error("Error al conectar con AFIP. Ingrese los datos manualmente.");
      setAfipValidado(true);
    } finally {
      setValidando(false);
    }
  };

  const onSubmit = (data) => {
    onSave({
      ...data,
      relacionId: socio?.relacionId,
      relacionOriginal: socio?.relacion,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={socio ? "Editar Accionista" : "Agregar Accionista"}
      maxWidth="700px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.modalForm}>
        {!afipValidado && !socio ? (
          <div className={styles.afipSearchWrapper}>
            <div className={styles.afipSearchInput}>
              <InputSocioMasked
                control={control}
                name="cuit"
                label="CUIT"
                icon={<FiCreditCard />}
                mask="00-00000000-0"
                error={errors.cuit}
              />
            </div>
            <button
              type="button"
              className={styles.afipSearchButton}
              onClick={handleAfipLookup}
              disabled={validando}
            >
              {validando ? "Buscando..." : <><FiSearch size={16} style={{ marginRight: "0.25rem" }} /> Buscar CUIT</>}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.modalRow2}>
              <InputSocioMasked
                control={control}
                name="cuit"
                label="CUIT"
                icon={<FiCreditCard />}
                mask="00-00000000-0"
                disabled={true}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <InputSocioMasked
                  control={control}
                  name="nombre"
                  label="Nombre / Razón Social"
                  icon={<FiUser />}
                  error={errors.nombre}
                />
                <span className={styles.afipSuccessBadge}>
                  <FiCheckCircle size={10} /> Validado con AFIP
                </span>
              </div>
            </div>

            <div className={styles.modalRow2}>
              <InputSocioMasked
                control={control}
                name="participacion"
                label="Participación %"
                icon={<FiPercent />}
                type="number"
                step="0.01"
                error={errors.participacion}
              />
              <InputSocioMasked
                control={control}
                name="email"
                label="Correo Electrónico"
                icon={<FiMail />}
                error={errors.email}
              />
            </div>

            <div className={styles.modalRow2}>
              <InputSocioMasked
                control={control}
                name="telefono"
                label="Teléfono"
                icon={<FiPhone />}
                error={errors.telefono}
              />
              <SelectSocio
                control={control}
                name="provinciaid"
                label={cargandoProvincias ? "Cargando provincias..." : "Provincia"}
                icon={<FiMapPin />}
                options={opcionesProvincias}
                error={errors.provinciaid}
              />
            </div>

            <div className={styles.modalRow3}>
              <InputSocioMasked
                control={control}
                name="calle"
                label="Calle"
                icon={<FiMapPin />}
              />
              <InputSocioMasked
                control={control}
                name="numero"
                label="Número"
                type="number"
              />
              <InputSocioMasked
                control={control}
                name="piso"
                label="Piso"
              />
            </div>

            <div className={styles.modalRow2}>
              <InputSocioMasked
                control={control}
                name="departamento"
                label="Departamento / Oficina"
              />
              <InputSocioMasked
                control={control}
                name="codpos"
                label="Código Postal"
              />
            </div>
          </>
        )}

        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {(afipValidado || socio) && (
            <Button type="submit" variant="primary">
              {socio ? "Guardar Cambios" : "Agregar Accionista"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function RepresentanteModal({ isOpen, onClose, onSave, representante, socioIdActivo }) {
  const [validando, setValidando] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      rol: "Representante Legal",
      email: "",
      telefono: "",
    }
  });

  const cuitValue = watch("cuit");

  useEffect(() => {
    if (isOpen) {
      if (representante) {
        reset({
          cuit: representante.cuit,
          nombre: representante.nombre,
          rol: representante.rolId === 230 ? "Representante Legal" : "Apoderado",
          email: representante.email,
          telefono: representante.telefono,
        });
        setAfipValidado(true);
      } else {
        reset({
          cuit: "",
          nombre: "",
          rol: "Representante Legal",
          email: "",
          telefono: "",
        });
        setAfipValidado(false);
      }
    }
  }, [isOpen, representante, reset]);

  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      toast.error("Por favor, ingrese un CUIT de 11 dígitos válido.");
      return;
    }
    setValidando(true);
    try {
      const res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
      if (res && res.datosgenerales) {
        const dg = res.datosgenerales;
        const nombreRep = dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Representante AFIP";
        setValue("nombre", nombreRep, { shouldValidate: true });
        setAfipValidado(true);
        toast.success("CUIT validado en AFIP exitosamente.");
      } else {
        toast.warning("CUIT no encontrado en AFIP, puede cargarlo manualmente.");
        setAfipValidado(true);
      }
    } catch (err) {
      console.error("Error validando representante en AFIP:", err);
      toast.error("Error al conectar con AFIP. Ingrese los datos manualmente.");
      setAfipValidado(true);
    } finally {
      setValidando(false);
    }
  };

  const onSubmit = (data) => {
    onSave({
      ...data,
      relacionId: representante?.relacionId,
      relacionOriginal: representante?.relacion,
    });
    onClose();
  };

  const opcionesRoles = [
    { value: "Representante Legal", label: "Representante Legal" },
    { value: "Apoderado", label: "Apoderado" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={representante ? "Editar Representante" : "Agregar Representante"}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.modalForm}>
        {!afipValidado && !representante ? (
          <div className={styles.afipSearchWrapper}>
            <div className={styles.afipSearchInput}>
              <InputSocioMasked
                control={control}
                name="cuit"
                label="CUIT"
                icon={<FiCreditCard />}
                mask="00-00000000-0"
                error={errors.cuit}
              />
            </div>
            <button
              type="button"
              className={styles.afipSearchButton}
              onClick={handleAfipLookup}
              disabled={validando}
            >
              {validando ? "Buscando..." : <><FiSearch size={16} style={{ marginRight: "0.25rem" }} /> Buscar CUIT</>}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.modalRow2}>
              <InputSocioMasked
                control={control}
                name="cuit"
                label="CUIT"
                icon={<FiCreditCard />}
                mask="00-00000000-0"
                disabled={true}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <InputSocioMasked
                  control={control}
                  name="nombre"
                  label="Nombre Completo"
                  icon={<FiUser />}
                  error={errors.nombre}
                />
                <span className={styles.afipSuccessBadge}>
                  <FiCheckCircle size={10} /> Validado con AFIP
                </span>
              </div>
            </div>

            <div className={styles.modalRow2}>
              <SelectSocio
                control={control}
                name="rol"
                label="Rol / Tipo Relación"
                icon={<FiUser />}
                options={opcionesRoles}
                error={errors.rol}
              />
              <InputSocioMasked
                control={control}
                name="email"
                label="Correo Electrónico"
                icon={<FiMail />}
                error={errors.email}
              />
            </div>

            <div className={styles.modalRow2}>
              <InputSocioMasked
                control={control}
                name="telefono"
                label="Celular / Teléfono"
                icon={<FiPhone />}
                error={errors.telefono}
              />
            </div>
          </>
        )}

        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {(afipValidado || representante) && (
            <Button type="submit" variant="primary">
              {representante ? "Guardar Cambios" : "Agregar Representante"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function BolsaModal({ isOpen, onClose, onSave, agenteBolsa }) {
  const { data: agentesData, isLoading: cargandoAgentes } = useObtenerTerceros({
    TipoTerceroRelacionadoID: 8,
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      sociedadBolsa: "",
      numeroCuentaBolsa: "",
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (agenteBolsa) {
        reset({
          sociedadBolsa: String(agenteBolsa.id),
          numeroCuentaBolsa: agenteBolsa.nrosubcuentacaja,
        });
      } else {
        reset({
          sociedadBolsa: "",
          numeroCuentaBolsa: "",
        });
      }
    }
  }, [isOpen, agenteBolsa, reset]);

  const onSubmit = (data) => {
    onSave({
      ...data,
      relacionId: agenteBolsa?.relacionId,
      relacionOriginal: agenteBolsa?.relacion,
    });
    onClose();
  };

  const rawAgentes = agentesData?.items || agentesData?.data || agentesData || [];
  const opcionesAgentes = Array.isArray(rawAgentes)
    ? rawAgentes.map((a) => ({
        value: String(a.tercerorelacionadoid || a.id),
        label: a.denominacion || a.Denominacion || a.razonsocial || a.nombre || "Sociedad de Bolsa",
      }))
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agenteBolsa ? "Editar Agente de Bolsa" : "Vincular Agente de Bolsa"}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.modalForm}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SelectSocio
            control={control}
            name="sociedadBolsa"
            label={cargandoAgentes ? "Cargando sociedades..." : "Sociedad de Bolsa"}
            icon={<FiBriefcase />}
            options={opcionesAgentes}
            disabled={cargandoAgentes || !!agenteBolsa}
            error={errors.sociedadBolsa}
          />

          <InputSocioMasked
            control={control}
            name="numeroCuentaBolsa"
            label="Número de Cuenta Comitente"
            icon={<FiCreditCard />}
            error={errors.numeroCuentaBolsa}
          />
        </div>

        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={cargandoAgentes}>
            {agenteBolsa ? "Guardar Cambios" : "Vincular Agente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
