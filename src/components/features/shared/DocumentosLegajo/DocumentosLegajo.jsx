import React, { useState, useEffect, useMemo } from "react";
import { useFormContext, useWatch, useForm, Controller } from "react-hook-form";
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
  FiSmartphone,
  FiMap,
} from "react-icons/fi";
import { toast } from "sonner";
import {
  CargaArchivos,
  Button,
  Modal,
  SelectSocio,
  InputSocioMasked,
  BuscadorCuit,
} from "../../../ui";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { tercerosService } from "../../../../services/tercerosService";
import { sociosService } from "../../../../services/sociosService";
import { usuarioService } from "../../../../services/usuarioService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { afipService } from "../../../../services/afipService";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { useObtenerTerceros } from "../../../../hooks/useTerceros";
import styles from "./DocumentosLegajo.module.css";
import { SocioAccionistaModal } from "./components/SocioAccionistaModal/SocioAccionistaModal";
import { RepresentanteModal } from "./components/RepresentanteModal/RepresentanteModal";
import { BolsaModal } from "./components/BolsaModal/BolsaModal";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

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
    key: "accionistas",
    title: "Composición accionaria",
    info: "Administración del cuadro accionario y participaciones de socios.",
  },
  {
    category: "Socios",
    key: "representantes",
    title: "Representantes legales",
    info: "Administración de representantes legales y apoderados habilitados.",
  },
  {
    category: "Socios",
    key: "agentesBolsa",
    title: "Agentes de bolsa",
    info: "Vinculación y administración de agentes de bolsa y cuentas comitentes.",
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
  const [dniTerceros, setDniTerceros] = useState({});
  const [uploadingKey, setUploadingKey] = useState(null);

  // Modal open states
  const [modalAccionistaOpen, setModalAccionistaOpen] = useState(false);
  const [modalRepresentanteOpen, setModalRepresentanteOpen] = useState(false);
  const [modalBolsaOpen, setModalBolsaOpen] = useState(false);

  // Edit target states
  const [editAccionista, setEditAccionista] = useState(null);
  const [editRepresentante, setEditRepresentante] = useState(null);
  const [editBolsa, setEditBolsa] = useState(null);

  // Delete target states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [emailVincular, setEmailVincular] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loadingVinculacion, setLoadingVinculacion] = useState(false);

  const cargarSocios = async () => {
    if (!socioIdActivo) return;
    setLoadingSocios(true);
    try {
      const relaciones =
        await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
      const arr = Array.isArray(relaciones) ? relaciones : [];

      const accMap = {};
      const repMap = {};
      const bolsaMap = {};

      const now = new Date();

      for (const rel of arr) {
        const fd = rel.fechadesde || rel.FechaDesde;
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") {
          const expirationDate = new Date(fh);
          const startDate = fd ? new Date(fd) : null;

          const isSameAsStart =
            startDate &&
            (expirationDate.getTime() === startDate.getTime() ||
              expirationDate.toISOString().split("T")[0] ===
                startDate.toISOString().split("T")[0]);

          if (!isSameAsStart && expirationDate < now) {
            continue;
          }
        }

        const tid =
          rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
        if (!tid) continue;

        try {
          let t = null;
          try {
            t = await tercerosService.obtenerTerceroPorId(tid);
          } catch (apiErr) {
            console.warn(
              `⚠️ [LEGAJO] No se pudo obtener tercero ${tid} de la API estándar. Intentando SGRPlus...`,
            );
            try {
              t = await tercerosService.obtenerTerceroPorIdSGRPlus(tid);
            } catch (sgrErr) {
              console.error(
                `❌ [LEGAJO] Error total obteniendo tercero ${tid}:`,
                sgrErr,
              );
            }
          }

          if (t) {
            const tiporel =
              rel.tiporelacionsocioid ||
              rel.TipoRelacionSocioID ||
              rel.tiporelacionsocioId;
            const tiporelNum = Number(tiporel);

            const item = {
              id: tid,
              relacionId:
                rel.sociotercerorelacionid || rel.SocioTerceroRelacionID,
              relacion: rel,
              nombre:
                t.denominacion ||
                t.Denominacion ||
                t.razonsocial ||
                t.RazonSocial ||
                t.nombre ||
                t.Nombre ||
                "Sin nombre",
              cuit: t.cuit || t.Cuit || t.numerodocumento || t.documento || "—",
              email: t.mail || t.Mail || "",
              telefono: t.telefono || t.Telefono || "",
              direccion: t.calle || t.Calle || "",
              localidad: t.contacto || t.Contacto || "",
              codpos: t.codpos || t.Codpos || "",
              participacion: Number(
                rel.porcacciones || rel.participacion || rel.Participacion || 0,
              ),
              rolId: tiporelNum,
              nrosubcuentacaja:
                rel.nrosubcuentacaja || rel.NroSubcuentaCaja || "",
              calle: t.calle || "",
              numero: t.numero || 0,
              piso: t.piso || "",
              departamento: t.departamento || "",
              ciudadid: t.ciudadid || 0,
              provinciaid:
                rel.provinciaid || rel.ProvinciaID || t.provinciaid || 0,
              tipopersonaid: t.tipopersonaid || 1,
            };

            const identifier = item.cuit && item.cuit !== "—" ? item.cuit : item.id;

            if (tiporelNum === 25) {
              if (!accMap[identifier]) {
                accMap[identifier] = item;
              }
            } else if (tiporelNum === 210 || tiporelNum === 230) {
              const existing = repMap[identifier];
              if (!existing) {
                repMap[identifier] = item;
              } else {
                if (item.rolId === 230 && existing.rolId !== 230) {
                  repMap[identifier] = item;
                }
              }
            } else if (tiporelNum === 21) {
              const existing = bolsaMap[identifier];
              if (!existing) {
                bolsaMap[identifier] = item;
              } else {
                if (item.nrosubcuentacaja && !existing.nrosubcuentacaja) {
                  bolsaMap[identifier] = item;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Error fetching third party detail:", tid, e);
        }
      }

      setAccionistas(Object.values(accMap));
      setRepresentantes(Object.values(repMap));
      setAgentesBolsa(Object.values(bolsaMap));
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

  useEffect(() => {
    if (!socioIdActivo) return;

    const cargarArchivosExistentes = async () => {
      try {
        const archivos =
          await socioArchivoService.obtenerArchivos(socioIdActivo);
        console.log("📂 [LEGAJO] Archivos cargados del backend:", archivos);
        if (Array.isArray(archivos)) {
          setArchivosBackend(archivos);

          archivos.forEach((arch) => {
            const tipoId = arch.tipodocumentoarchivoid;
            let key = null;
            if (tipoId === 5) key = "certificadoPyme";
            else if (tipoId === 4) key = "poderes";
            else if (tipoId === 6) key = "otrosDocumentos";

            if (key) {
              setValue(
                key,
                {
                  name: arch.nombrearchivo,
                  size: "Cargado",
                  _uploaded: true,
                  _backendId: arch.socioarchivoid,
                  _tipodocumentoarchivoid: tipoId,
                },
                { shouldValidate: true },
              );
              setValue(`${key}_backendId`, arch.socioarchivoid);
            }
          });
        }
      } catch (err) {
        console.error("Error cargando archivos del legajo:", err);
      }
    };

    cargarArchivosExistentes();
  }, [socioIdActivo, setValue]);

  const totalParticipacion = useMemo(() => {
    return accionistas.reduce((a, s) => a + Number(s.participacion || 0), 0);
  }, [accionistas]);

  const handleEliminarRelacion = (item) => {
    setDeleteTarget(item);
  };

  const handleConfirmEliminar = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    const item = deleteTarget;
    const isBolsa = item.rolId === 21;

    try {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = ayer.toISOString().split(".")[0];
      
      const payload = {
        ...item.relacion,
        fechahasta: ayerStr,
        FechaHasta: ayerStr,
      };
      await tercerosService.actualizarRelacionDeSocio(payload);
      toast.success(
        isBolsa
          ? "Agente de bolsa desvinculado exitosamente."
          : "Registro eliminado exitosamente del legajo.",
      );
      cargarSocios();
      setDeleteTarget(null);
    } catch (err) {
      console.error("[LEGAJO] Error al eliminar relación:", err);
      toast.error("Ocurrió un error al procesar la desvinculación.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleSaveAccionista = async (formData, files) => {
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");

      let terceroId = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({
          Cuit: cuitLimpio,
        });
        const arr = Array.isArray(existentes)
          ? existentes
          : existentes?.data || [];
        if (arr.length > 0) {
          terceroId =
            arr[0].tercerorelacionadoid ||
            arr[0].TerceroRelacionadoID ||
            arr[0].id;
        }
      } catch (err) {
        console.warn(
          "[LEGAJO - ACCIONISTA] Error buscando tercero existente:",
          err,
        );
      }

      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid:
          cuitLimpio.startsWith("30") || cuitLimpio.startsWith("33") ? 2 : 1,
        tipodocumentoid: 0,
        numerodocumento: cuitLimpio,
        estadocivilid: 0,
        ciudadid: 0,
        telefono: formData.celular || "",
        conyuge: "",
        actividad: "",
        contacto: formData.localidad || "",
        nrocuenta: "",
        codigomercado: "",
        calle: formData.direccion || "",
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

      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];

      if (formData.relacionId) {
        const payloadRel = {
          ...formData.relacionOriginal,
          porcacciones: Number(formData.participacion),
          provinciaid: Number(formData.provinciaid) || 0,
          telefono: formData.celular || "",
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
              fechahasta: unAnioMasStr,
              porcacciones: Number(formData.participacion),
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              provinciaid: Number(formData.provinciaid) || 0,
              nrosubcuentacaja: "",
              sucursalid: 0,
              default: "0",
              subtiporelacionsocioid: 0,
              telefono: formData.celular || "",
              momento: ahora,
            },
          ],
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Accionista agregado al legajo.");
      }

      if (files) {
        console.log("💾 [LEGAJO - ACCIONISTA] Guardando DNI en memoria local (Visual):", {
          cuitLimpio,
          dniFrente: files.dniFrente?.name,
          dniDorso: files.dniDorso?.name,
        });
        setDniTerceros((prev) => ({
          ...prev,
          [cuitLimpio]: {
            dniFrente: files.dniFrente,
            dniDorso: files.dniDorso,
          },
        }));
      }

      cargarSocios();
    } catch (err) {
      console.error("[LEGAJO - ACCIONISTA] Error guardando accionista:", err);
      toast.error("Ocurrió un error al guardar el accionista.");
      throw err;
    }
  };

  const handleSaveRepresentante = async (formData) => {
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");

      let terceroId = null;
      try {
        console.log(
          `[LEGAJO - REPRESENTANTE] Buscando tercero por CUIT: ${cuitLimpio}`,
        );
        const existentes = await tercerosService.obtenerTerceros({
          Cuit: cuitLimpio,
        });
        const arr = Array.isArray(existentes)
          ? existentes
          : existentes?.data || [];
        if (arr.length > 0) {
          terceroId =
            arr[0].tercerorelacionadoid ||
            arr[0].TerceroRelacionadoID ||
            arr[0].id;
          console.log(
            `[LEGAJO - REPRESENTANTE] Tercero existente encontrado con ID: ${terceroId}`,
          );
        } else {
          console.log(
            "[LEGAJO - REPRESENTANTE] Tercero no encontrado. Se creará uno nuevo.",
          );
        }
      } catch (err) {
        console.warn(
          "[LEGAJO - REPRESENTANTE] Error buscando tercero existente:",
          err,
        );
      }

      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid: 1,
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

      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];
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
              fechahasta: unAnioMasStr,
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
            },
          ],
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Representante agregado correctamente.");
      }
      cargarSocios();
    } catch (err) {
      console.error(
        "❌ [LEGAJO - REPRESENTANTE] Error guardando representante:",
        err,
      );
      toast.error("Ocurrió un error al guardar el representante.");
      throw err;
    }
  };

  const handleSaveBolsa = async (formData) => {
    try {
      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];

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
              fechahasta: unAnioMasStr,
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
            },
          ],
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Agente de bolsa vinculado exitosamente.");
      }
      cargarSocios();
    } catch (err) {
      console.error(
        "[LEGAJO - AGENTE BOLSA] Error guardando agente de bolsa:",
        err,
      );
      toast.error("Ocurrió un error al guardar el agente de bolsa.");
      throw err;
    }
  };

  const handleFileUpload = (key, file) => {
    if (file instanceof File) {
      file._uploaded = false;
      setValue(key, file, { shouldValidate: true, shouldDirty: true });
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
          const isAccionistas = doc.key === "accionistas";
          const isRepresentantes = doc.key === "representantes";
          const isAgentesBolsa = doc.key === "agentesBolsa";
          const isUsuarios = doc.key === "usuarios";
          const currentFile = formValues[doc.key];
          const isComplete =
            isPerfil ||
            isAccionistas ||
            isRepresentantes ||
            isAgentesBolsa ||
            isUsuarios ||
            !!currentFile;
          const hasError =
            intentoAvanzar &&
            !isPerfil &&
            !isAccionistas &&
            !isRepresentantes &&
            !isAgentesBolsa &&
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
        const isAccionistas = doc.key === "accionistas";
        const isRepresentantes = doc.key === "representantes";
        const isAgentesBolsa = doc.key === "agentesBolsa";
        const isUsuarios = doc.key === "usuarios";
        const currentFile = formValues[doc.key];
        const hasError =
          intentoAvanzar &&
          !isPerfil &&
          !isAccionistas &&
          !isRepresentantes &&
          !isAgentesBolsa &&
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
            ) : isAccionistas ? (
              <div className={styles.sociosContainer}>
                {loadingSocios ? (
                  <div className={styles.emptySlot}>
                    <FiUsers size={20} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>
                      Cargando composición accionaria...
                    </p>
                  </div>
                ) : (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionHeaderLeft}>
                        <FiUsers className={styles.sectionIcon} size={18} />
                        <h5 className={styles.sectionTitle}>
                          Accionistas (Composición Accionaria)
                        </h5>
                      </div>
                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={() => {
                          setEditAccionista(null);
                          setModalAccionistaOpen(true);
                        }}
                        disabled={totalParticipacion >= 100}
                      >
                        <FiPlus size={14} /> Agregar Accionista
                      </button>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <div className={styles.progressContainer}>
                      <div className={styles.progressLabelRow}>
                        <span>Total Participación</span>
                        <span
                          style={{
                            color:
                              totalParticipacion === 100
                                ? "#4caf50"
                                : "#ff9800",
                          }}
                        >
                          {totalParticipacion}% / 100%
                        </span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressBar}
                          style={{
                            width: `${Math.min(totalParticipacion, 100)}%`,
                            backgroundColor:
                              totalParticipacion === 100
                                ? "#4caf50"
                                : "#ff9800",
                          }}
                        />
                      </div>
                    </div>

                    {/* ALERTA BANNER DE 100% */}
                    {totalParticipacion !== 100 && (
                      <div
                        className={`${styles.alertBanner} ${styles.alertBannerWarning}`}
                      >
                        <FiAlertCircle className={styles.alertIcon} size={16} />
                        <p className={styles.alertText}>
                          La composición accionaria actual debe sumar
                          exactamente el 100% (Actual: {totalParticipacion}%).
                        </p>
                      </div>
                    )}

                    {accionistas.length === 0 ? (
                      <div
                        className={styles.emptySlot}
                        style={{ minHeight: "6rem", padding: "1.5rem" }}
                      >
                        <p className={styles.emptyTitle}>
                          Sin accionistas registrados
                        </p>
                        <span className={styles.emptyText}>
                          Haga click en "Agregar Accionista" para dar de alta.
                        </span>
                      </div>
                    ) : (
                      <div className={styles.sociosList}>
                        {accionistas.map((socio) => (
                          <div key={socio.id} className={styles.socioCard}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <button
                                type="button"
                                className={styles.socioCardBtn}
                                onClick={() =>
                                  setExpandedSocio(
                                    expandedSocio === socio.id
                                      ? null
                                      : socio.id,
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
                                className={styles.socioHeaderActions}
                                style={{ paddingRight: "1rem" }}
                              >
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

                            <div
                              className={`${styles.socioExpand} ${expandedSocio === socio.id ? styles.socioExpandOpen : ""}`}
                            >
                              <div className={styles.socioDetailGrid}>
                                {socio.email && (
                                  <div className={styles.socioDetail}>
                                    <FiMail
                                      className={styles.socioDetailIcon}
                                    />
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
                                    <FiPhone
                                      className={styles.socioDetailIcon}
                                    />
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
                                        {socio.direccion}{" "}
                                        {socio.codpos
                                          ? ` (${socio.codpos})`
                                          : ""}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div className={styles.socioDetail}>
                                  <FiPercent
                                    className={styles.socioDetailIcon}
                                  />
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
                    )}
                  </div>
                )}

                <SocioAccionistaModal
                  isOpen={modalAccionistaOpen}
                  onClose={() => {
                    setModalAccionistaOpen(false);
                    setEditAccionista(null);
                  }}
                  onSave={handleSaveAccionista}
                  socio={editAccionista}
                  socioIdActivo={socioIdActivo}
                  archivosBackend={archivosBackend}
                  accionistas={accionistas}
                  dniTerceros={dniTerceros}
                />

                <ConfirmacionModal
                  isOpen={!!deleteTarget}
                  onClose={() => setDeleteTarget(null)}
                  onConfirm={handleConfirmEliminar}
                  titulo={deleteTarget?.rolId === 21 ? "Desvincular Agente" : "Eliminar del legajo"}
                  mensaje={
                    deleteTarget?.rolId === 21
                      ? `¿Está seguro de que desea desvincular al Agente de Bolsa ${deleteTarget?.nombre}?`
                      : `¿Está seguro de que desea eliminar a ${deleteTarget?.nombre} del legajo?`
                  }
                  isLoading={loadingDelete}
                />
              </div>
            ) : isRepresentantes ? (
              <div className={styles.sociosContainer}>
                {loadingSocios ? (
                  <div className={styles.emptySlot}>
                    <FiUsers size={20} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>
                      Cargando representantes legales...
                    </p>
                  </div>
                ) : (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionHeaderLeft}>
                        <FiUser className={styles.sectionIcon} size={18} />
                        <h5 className={styles.sectionTitle}>
                          Representantes Legales y Apoderados
                        </h5>
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
                      <div
                        className={styles.emptySlot}
                        style={{ minHeight: "6rem", padding: "1.5rem" }}
                      >
                        <p className={styles.emptyTitle}>
                          Sin representantes registrados
                        </p>
                        <span className={styles.emptyText}>
                          Haga click en "Agregar Representante" para dar de
                          alta.
                        </span>
                      </div>
                    ) : (
                      <div className={styles.sociosList}>
                        {representantes.map((rep) => (
                          <div key={rep.id} className={styles.socioCard}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
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
                                  <span className={styles.socioName}>
                                    {rep.nombre}
                                  </span>
                                  <span className={styles.socioCuit}>
                                    CUIT: {rep.cuit}
                                  </span>
                                </div>
                                <span
                                  className={`${styles.roleBadge} ${rep.rolId === 230 ? styles.roleRepresentante : styles.roleApoderado}`}
                                >
                                  {rep.rolId === 230
                                    ? "Representante Legal"
                                    : "Apoderado"}
                                </span>
                                <FiChevronDown
                                  className={`${styles.socioChevron} ${expandedRep === rep.id ? styles.socioChevronOpen : ""}`}
                                />
                              </button>
                              <div
                                className={styles.socioHeaderActions}
                                style={{ paddingRight: "1rem" }}
                              >
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

                            <div
                              className={`${styles.socioExpand} ${expandedRep === rep.id ? styles.socioExpandOpen : ""}`}
                            >
                              <div className={styles.socioDetailGrid}>
                                {rep.email && (
                                  <div className={styles.socioDetail}>
                                    <FiMail
                                      className={styles.socioDetailIcon}
                                    />
                                    <div>
                                      <span className={styles.socioDetailLabel}>
                                        Email
                                      </span>
                                      <span className={styles.socioDetailVal}>
                                        {rep.email}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {rep.telefono && (
                                  <div className={styles.socioDetail}>
                                    <FiPhone
                                      className={styles.socioDetailIcon}
                                    />
                                    <div>
                                      <span className={styles.socioDetailLabel}>
                                        Celular / Teléfono
                                      </span>
                                      <span className={styles.socioDetailVal}>
                                        {rep.telefono}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div className={styles.socioDetail}>
                                  <FiInfo className={styles.socioDetailIcon} />
                                  <div>
                                    <span className={styles.socioDetailLabel}>
                                      Relación
                                    </span>
                                    <span className={styles.socioDetailVal}>
                                      {rep.rolId === 230
                                        ? "Representante Legal (Gerente Gral)"
                                        : "Apoderado de Socio"}
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
                )}

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
              </div>
            ) : isAgentesBolsa ? (
              <div className={styles.sociosContainer}>
                {loadingSocios ? (
                  <div className={styles.emptySlot}>
                    <FiUsers size={20} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>
                      Cargando agentes de bolsa...
                    </p>
                  </div>
                ) : (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionHeaderLeft}>
                        <FiBriefcase className={styles.sectionIcon} size={18} />
                        <h5 className={styles.sectionTitle}>
                          Agentes de Bolsa
                        </h5>
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
                      <div
                        className={styles.emptySlot}
                        style={{ minHeight: "6rem", padding: "1.5rem" }}
                      >
                        <p className={styles.emptyTitle}>
                          Sin agentes de bolsa vinculados
                        </p>
                        <span className={styles.emptyText}>
                          Haga click en "Vincular Agente" para asociar su
                          cuenta.
                        </span>
                      </div>
                    ) : (
                      <div className={styles.sociosList}>
                        {agentesBolsa.map((bolsa) => (
                          <div
                            key={bolsa.id}
                            className={styles.socioCard}
                            style={{ padding: "0.875rem 1rem" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.75rem",
                                }}
                              >
                                <div className={styles.socioAvatar}>
                                  <FiBriefcase size={16} />
                                </div>
                                <div>
                                  <span
                                    className={styles.socioName}
                                    style={{ display: "block" }}
                                  >
                                    {bolsa.nombre}
                                  </span>
                                  <span
                                    className={styles.socioCuit}
                                    style={{
                                      display: "block",
                                      marginTop: "0.15rem",
                                    }}
                                  >
                                    Comitente:{" "}
                                    <strong style={{ color: "#fff" }}>
                                      {bolsa.nrosubcuentacaja || "—"}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
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
                )}

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
                    if (e.target.files?.[0]) {
                      handleFileUpload(doc.key, e.target.files[0]);
                    }
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
