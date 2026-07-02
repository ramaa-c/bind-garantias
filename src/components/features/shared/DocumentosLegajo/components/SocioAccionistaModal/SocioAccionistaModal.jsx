import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { FiCheckCircle, FiEdit2, FiMail, FiSmartphone, FiMapPin, FiMap, FiUser } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button/Button";
import { Modal } from "../../../../../ui/Modal/Modal";
import { SelectSocio } from "../../../../../ui/SelectSocio/SelectSocio";
import { InputSocioMasked } from "../../../../../ui/InputSocioMasked/InputSocioMasked";
import { BuscadorCuit } from "../../../../../ui/BuscadorCuit/BuscadorCuit";
import { CargaArchivos } from "../../../../../ui/CargaArchivos/CargaArchivos";
import { ProcesamientoModal } from "../../../../../ui/ProcesamientoModal/ProcesamientoModal";
import { Spinner } from "../../../../../ui/Spinner/Spinner";
import { useCdaEngine } from "../../../../../../hooks/useCdaEngine";
import { useEmpresaActiva } from "../../../../../../hooks/useEmpresaActiva";
import { afipService } from "../../../../../../services/afipService";
import { sociosService } from "../../../../../../services/sociosService";
import { nosisService } from "../../../../../../services/nosisService";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import { tercerosService } from "../../../../../../services/tercerosService";
import { formatBase64Size, procesarArchivo } from "../../../../../../utils/fileUtils";
import { matchProvinciaAfip } from "../../../../../../utils/provinciaUtils";
import { useProvincias, useCiudades, usePartidos } from "../../../../../../hooks/useCatalogos";
import { parseAddress } from "../../../../../../utils/direccionParser";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";
import styles from "./SocioAccionistaModal.module.css";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const DropzoneField = ({ file, title, subtitle, onChange, onEdit, onView, onDownload, fileKey, hasError }) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div className={styles.dropzoneWrapper}>
      <input
        type="file"
        id={`file-input-${fileKey}`}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) onChange(e.target.files[0]);
          e.target.value = null;
        }}
      />
      <CargaArchivos
        title={title}
        subtitle={subtitle}
        hasError={hasError}
        file={
          file
            ? {
                name: file.name,
                size: typeof file.size === "number" ? `${(file.size / 1024).toFixed(1)} KB` : file.size || "Disponible",
                vialufe: file.vialufe || "0",
              }
            : null
        }
        onClick={() => document.getElementById(`file-input-${fileKey}`).click()}
        onEdit={onEdit}
        onView={onView}
        onDownload={onDownload}
        isDragging={isDragging}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) {
            onChange(droppedFile);
          }
        }}
      />
    </div>
  );
};

const DEFAULT_DNI_TERCEROS = {};
const DEFAULT_ACCIONISTAS = [];

export function SocioAccionistaModal({ isOpen, onClose, onSuccess, socio, socioIdActivo, archivosBackend, accionistas = DEFAULT_ACCIONISTAS, dniTerceros = DEFAULT_DNI_TERCEROS }) {
  const { cadenaSlug } = useParams();
  const cadenaValorIdParam = Number(cadenaSlug) || 0;
  const [validando, setValidando] = useState(false);
  const [enriqueciendoAuto, setEnriqueciendoAuto] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [dniFrenteFile, setDniFrenteFile] = useState(null);
  const [dniDorsoFile, setDniDorsoFile] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [procesoModal, setProcesoModal] = useState({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });

  const { ejecutarValidaciones } = useCdaEngine();
  const { cuitActivo } = useEmpresaActiva();

  const relacionId = socio?.relacionId || 
                     socio?.relacion?.sociotercerorelacionid || 
                     socio?.relacion?.SocioTerceroRelacionID || 
                     socio?.sociotercerorelacionid || 
                     socio?.relacion?.sociotercerorelacionId ||
                     null;

  const indexSocioEditado = socio
    ? accionistas.findIndex(
        (s) => s.cuit === socio.cuit || 
               (relacionId && (
                 s.relacionId === relacionId || 
                 s.relacion?.sociotercerorelacionid === relacionId ||
                 s.relacion?.SocioTerceroRelacionID === relacionId ||
                 s.sociotercerorelacionid === relacionId
               ))
      )
    : -1;

  const totalSinSocioActual = Number(
    accionistas.reduce(
      (acc, s, idx) => (idx === indexSocioEditado ? acc : acc + Number(s.participacion || 0)),
      0
    ).toFixed(2)
  );

  const maximoPermitido = Number((100 - totalSinSocioActual).toFixed(2));
  
  // Dropzone Error States
  const [errorDniFrente, setErrorDniFrente] = useState(false);
  const [errorDniDorso, setErrorDniDorso] = useState(false);

  const [filesChanged, setFilesChanged] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, reset, setValue, setError, clearErrors, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      participacion: "",
      email: "",
      celular: "",
      direccion: "",
      calle: "",
      numero: 0,
      piso: "",
      departamento: "",
      ciudad: "",
      ciudadid: 0,
      provinciaid: "",
      codpos: "",
    }
  });

  const cuitValue = useWatch({ control, name: "cuit" });
  const nombreValue = useWatch({ control, name: "nombre" });

  const currentProvincia = useWatch({ control, name: "provinciaid" });

  const { data: ciudadesData, isLoading: cargandoCiudades } =
    useCiudades(currentProvincia);
  const opcionesCiudades = ciudadesData?.opciones || [];

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuitValue, clearErrors]);

  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  const [prevDeps, setPrevDeps] = useState({ isOpen, cuitValue, nombreValue, archivosBackend, dniTerceros, socio });

  if (
    isOpen !== prevDeps.isOpen ||
    cuitValue !== prevDeps.cuitValue ||
    nombreValue !== prevDeps.nombreValue ||
    archivosBackend !== prevDeps.archivosBackend ||
    dniTerceros !== prevDeps.dniTerceros ||
    socio !== prevDeps.socio
  ) {
    const wasOpen = prevDeps.isOpen;
    setPrevDeps({ isOpen, cuitValue, nombreValue, archivosBackend, dniTerceros, socio });

    if (isOpen && !wasOpen) {
      setDniFrenteFile(null);
      setDniDorsoFile(null);
      setFilesChanged(false);
      setErrorDniFrente(false);
      setErrorDniDorso(false);
      setShowConfirm(false);
      if (socio) {
        setAfipValidado(true);
      } else {
        setAfipValidado(false);
      }
    }

    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    const nombreLimpio = normalizarTexto(nombreValue || socio?.nombre);

    if (isOpen && cuitLimpio.length === 11) {
      const memoryFiles = dniTerceros?.[cuitLimpio];

      if (memoryFiles?.dniFrente) {
        setDniFrenteFile(memoryFiles.dniFrente);
        setErrorDniFrente(false);
      } else if (!(dniFrenteFile instanceof File)) {
        const frente = archivosBackend?.find((a) => {
          if (a.tipodocumentoarchivoid !== socioArchivoService.TIPO_DOCUMENTO_MAP["socio-frente"]) return false;
          const descNorm = normalizarTexto(a.descripcion);
          return descNorm.includes(cuitLimpio) || (nombreLimpio && descNorm.includes(nombreLimpio));
        });

        if (frente) {
          setDniFrenteFile({
            name: frente.nombrearchivo,
            size: frente.contenido ? formatBase64Size(frente.contenido) : "Disponible",
            _uploaded: true,
            _backendId: frente.socioarchivoid,
            _tipodocumentoarchivoid: socioArchivoService.TIPO_DOCUMENTO_MAP["socio-frente"],
            vialufe: frente.vialufe || frente.Vialufe || "0",
          });
          setErrorDniFrente(false);
        } else {
          setDniFrenteFile(null);
        }
      }

      if (memoryFiles?.dniDorso) {
        setDniDorsoFile(memoryFiles.dniDorso);
        setErrorDniDorso(false);
      } else if (!(dniDorsoFile instanceof File)) {
        const dorso = archivosBackend?.find((a) => {
          if (a.tipodocumentoarchivoid !== socioArchivoService.TIPO_DOCUMENTO_MAP["socio-dorso"]) return false;
          const descNorm = normalizarTexto(a.descripcion);
          return descNorm.includes(cuitLimpio) || (nombreLimpio && descNorm.includes(nombreLimpio));
        });

        if (dorso) {
          setDniDorsoFile({
            name: dorso.nombrearchivo,
            size: dorso.contenido ? formatBase64Size(dorso.contenido) : "Disponible",
            _uploaded: true,
            _backendId: dorso.socioarchivoid,
            _tipodocumentoarchivoid: socioArchivoService.TIPO_DOCUMENTO_MAP["socio-dorso"],
            vialufe: dorso.vialufe || dorso.Vialufe || "0",
          });
          setErrorDniDorso(false);
        } else {
          setDniDorsoFile(null);
        }
      }
    } else if (isOpen && !cuitLimpio) {
      setDniFrenteFile(null);
      setDniDorsoFile(null);
      setErrorDniFrente(false);
      setErrorDniDorso(false);
    }
    setFilesChanged(false);
  }

  useEffect(() => {
    if (isOpen) {
      if (socio) {
        const parsedDir = parseAddress(socio.direccion || socio.calle || "");
        reset({
          cuit: socio.cuit,
          nombre: socio.nombre,
          participacion: socio.participacion,
          email: socio.email,
          celular: socio.celular || socio.telefono || "",
          direccion: socio.direccion || "",
          calle: socio.calle || parsedDir.calle || "",
          numero: Number(socio.numero) || parsedDir.numero || 0,
          piso: socio.piso || parsedDir.piso || "",
          departamento: socio.departamento || parsedDir.departamento || "",
          ciudad: socio.ciudad || "",
          ciudadid: Number(socio.ciudadid) || 0,
          provinciaid: String(socio.provinciaid || ""),
          codpos: socio.codpos || "",
        });
      } else {
        reset({
          cuit: "",
          nombre: "",
          participacion: "",
          email: "",
          celular: "",
          direccion: "",
          calle: "",
          numero: 0,
          piso: "",
          departamento: "",
          ciudad: "",
          ciudadid: 0,
          provinciaid: "",
          codpos: "",
        });
      }
    }
  }, [isOpen, socio, reset]);


  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      setError("cuit", { type: "manual", message: "Por favor, ingrese un CUIT de 11 dígitos válido." });
      return;
    }
    setValidando(true);

    clearErrors("cuit");

    const cuitLimpioEmpresa = cuitActivo ? String(cuitActivo).replace(/\D/g, "") : "";

    if (cuitLimpioEmpresa && cuitLimpio !== cuitLimpioEmpresa) {
      setProcesoModal({
        isOpen: true,
        titulo: "Validando Socio",
        pasos: [
          { id: "sgr", etiqueta: "Conectando con SGR+", estado: "cargando", descripcion: "Validando situación e historial societario." },
        ],
        hasError: false,
        isSystemError: false
      });

      const result = await ejecutarValidaciones("PANTALLA_SOCIOS", cuitLimpio, cadenaValorIdParam);
      
      if (!result.success) {
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          isSystemError: result.errors.some((e) => e.isSystemError),
          pasos: prev.pasos.map(p => 
            p.id === "sgr" ? { 
                ...p, 
                estado: "error", 
                descripcion: `Falló la validación del socio:`,
                errores: result.errors.map(e => e.message)
            } : p
          )
        }));
        setValidando(false);
        return;
      }
      
      setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
    }

    try {
      let terceroEncontrado = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
        const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
        if (arr.length > 0) {
          terceroEncontrado = arr[0];
        }
      } catch (dbErr) {
        console.warn("[SocioAccionistaModal] Error buscando tercero en base de datos local:", dbErr);
      }

      const tieneDatosCompletos = terceroEncontrado && 
        (terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail) &&
        (terceroEncontrado.calle || terceroEncontrado.Calle || terceroEncontrado.direccion);

      if (terceroEncontrado && tieneDatosCompletos && !socio) {
        const nombreSocio = terceroEncontrado.denominacion || terceroEncontrado.razonsocial || terceroEncontrado.nombre || "Socio del Sistema";
        setValue("nombre", nombreSocio, { shouldValidate: true, shouldDirty: true });
        setValue("email", terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail || "", { shouldValidate: true, shouldDirty: true });
        setValue("celular", terceroEncontrado.telefono || terceroEncontrado.Telefono || "", { shouldValidate: true, shouldDirty: true });
        setValue("direccion", terceroEncontrado.calle || terceroEncontrado.Calle || terceroEncontrado.direccion || "", { shouldValidate: true, shouldDirty: true });
        
        const parsedDir = parseAddress(terceroEncontrado.calle || terceroEncontrado.Calle || terceroEncontrado.direccion || "");
        setValue("calle", parsedDir.calle || terceroEncontrado.calle || "", { shouldValidate: true, shouldDirty: true });
        setValue("numero", Number(terceroEncontrado.numero) || parsedDir.numero || 0, { shouldValidate: true, shouldDirty: true });
        setValue("piso", terceroEncontrado.piso || parsedDir.piso || "", { shouldValidate: true, shouldDirty: true });
        setValue("departamento", terceroEncontrado.departamento || parsedDir.departamento || "", { shouldValidate: true, shouldDirty: true });

        setValue("ciudad", terceroEncontrado.ciudad || "", { shouldValidate: true, shouldDirty: true });
        setValue("ciudadid", Number(terceroEncontrado.ciudadid) || 0, { shouldValidate: true, shouldDirty: true });
        setValue("codpos", terceroEncontrado.codpos || "", { shouldValidate: true, shouldDirty: true });

        const provId = terceroEncontrado.provinciaid || terceroEncontrado.ProvinciaID || 0;
        if (provId) {
          setValue("provinciaid", String(provId), { shouldValidate: true, shouldDirty: true });
        }

        setAfipValidado(true);
        toast.success("Datos del accionista recuperados del sistema.");
        setValidando(false);
        return;
      }

      let nosisData = null;
      let res = null;
      try {
        nosisData = await nosisService.obtenerDatosNormalizados(cuitLimpio);
      } catch (nosisErr) {
        console.warn("[SocioAccionistaModal] Nosis no disponible, probando fallback a AFIP:", nosisErr);
      }

      if (!nosisData) {
        try {
          res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
        } catch (afipErr) {
          console.warn("[SocioAccionistaModal] AFIP no disponible, probando fallback a LUFE Entidad:", afipErr);
          try {
            const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitLimpio);
            if (lufeEntidad && lufeEntidad.success) {
              res = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
            }
          } catch (lufeErr) {
            console.error("[SocioAccionistaModal] LUFE Entidad también falló:", lufeErr);
          }
        }
      }

      if (nosisData || (res && res.datosgenerales)) {
        let nombreSocio = "";
        let emailVal = "";
        let celularVal = "";
        let direccionVal = "";
        let parsedDir = { calle: "", numero: 0, piso: "" };
        let deptoVal = "";
        let ciudadVal = "";
        let codposVal = "";
        let provIdVal = 0;

        if (nosisData) {
          nombreSocio = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                        nosisData.VI_RazonSocial || `${nosisData.VI_Nombre || ""} ${nosisData.VI_Apellido || ""}`.trim() || "Socio";
          emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || "";
          celularVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || "";
          direccionVal = (terceroEncontrado?.calle || terceroEncontrado?.Calle || terceroEncontrado?.direccion) || 
                         `${nosisData.VI_DomAF_Calle || ""} ${nosisData.VI_DomAF_Nro || ""}`.trim() || "";
          parsedDir = parseAddress(direccionVal);
          deptoVal = terceroEncontrado?.departamento || nosisData.VI_DomAF_Dto || "";
          ciudadVal = nosisData.VI_DomAF_Loc || "";
          codposVal = terceroEncontrado?.codpos || nosisData.VI_DomAF_CP || "";
          
          provIdVal = terceroEncontrado?.provinciaid || terceroEncontrado?.ProvinciaID || 0;
          if (!provIdVal && nosisData.VI_DomAF_Prov) {
            const match = matchProvinciaAfip(nosisData.VI_DomAF_Prov, opcionesProvincias);
            if (match) {
              provIdVal = match.value;
            }
          }
        } else {
          const dg = res.datosgenerales;
          nombreSocio = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                        dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Socio AFIP";
          emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || dg.email || dg.emailfacturacion || "";
          celularVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || dg.telefono || "";
          const dom = dg.domiciliofiscal || dg.domicilio;
          direccionVal = (terceroEncontrado?.calle || terceroEncontrado?.Calle || terceroEncontrado?.direccion) || 
                         (dom ? (dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "")) : "") || "";
          parsedDir = parseAddress(direccionVal);
          deptoVal = dom?.departamento || terceroEncontrado?.departamento || "";
          ciudadVal = dom?.localidad || "";
          codposVal = dom?.codpostal || terceroEncontrado?.codpos || "";
          
          provIdVal = terceroEncontrado?.provinciaid || terceroEncontrado?.ProvinciaID || 0;
          if (!provIdVal && dom) {
            const provNombre = dom.descripcionprovincia || dom.provincia || "";
            if (provNombre) {
              const match = matchProvinciaAfip(provNombre, opcionesProvincias);
              if (match) {
                provIdVal = match.value;
              }
            }
          }
        }

        setValue("nombre", nombreSocio, { shouldValidate: true, shouldDirty: true });
        setValue("email", emailVal, { shouldValidate: true, shouldDirty: true });
        setValue("celular", celularVal, { shouldValidate: true, shouldDirty: true });
        setValue("direccion", direccionVal, { shouldValidate: true, shouldDirty: true });
        setValue("calle", parsedDir.calle, { shouldValidate: true, shouldDirty: true });
        setValue("numero", parsedDir.numero, { shouldValidate: true, shouldDirty: true });
        setValue("piso", parsedDir.piso, { shouldValidate: true, shouldDirty: true });
        setValue("departamento", deptoVal, { shouldValidate: true, shouldDirty: true });
        setValue("ciudad", ciudadVal, { shouldValidate: true, shouldDirty: true });
        setValue("ciudadid", Number(terceroEncontrado?.ciudadid) || 0, { shouldValidate: true, shouldDirty: true });
        setValue("codpos", codposVal, { shouldValidate: true, shouldDirty: true });

        if (provIdVal) {
          setValue("provinciaid", String(provIdVal), { shouldValidate: true, shouldDirty: true });
        }
        
        setAfipValidado(true);
        toast.success(socio ? "Datos actualizados desde Nosis/AFIP/LUFE." : "Datos del accionista recuperados.");
      } else {
        if (terceroEncontrado) {
          const nombreSocio = terceroEncontrado.denominacion || terceroEncontrado.razonsocial || terceroEncontrado.nombre || "Socio del Sistema";
          setValue("nombre", nombreSocio, { shouldValidate: true, shouldDirty: true });
          setValue("email", terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail || "", { shouldValidate: true, shouldDirty: true });
          setValue("celular", terceroEncontrado.telefono || terceroEncontrado.Telefono || "", { shouldValidate: true, shouldDirty: true });
          setValue("direccion", terceroEncontrado.calle || terceroEncontrado.Calle || terceroEncontrado.direccion || "", { shouldValidate: true, shouldDirty: true });
          
          const parsedDir = parseAddress(terceroEncontrado.calle || terceroEncontrado.Calle || terceroEncontrado.direccion || "");
          setValue("calle", parsedDir.calle || terceroEncontrado.calle || "", { shouldValidate: true, shouldDirty: true });
          setValue("numero", Number(terceroEncontrado.numero) || parsedDir.numero || 0, { shouldValidate: true, shouldDirty: true });
          setValue("piso", terceroEncontrado.piso || parsedDir.piso || "", { shouldValidate: true, shouldDirty: true });
          setValue("departamento", terceroEncontrado.departamento || "", { shouldValidate: true, shouldDirty: true });

          setValue("ciudad", terceroEncontrado.ciudad || "", { shouldValidate: true, shouldDirty: true });
          setValue("ciudadid", Number(terceroEncontrado.ciudadid) || 0, { shouldValidate: true, shouldDirty: true });
          setValue("codpos", terceroEncontrado.codpos || "", { shouldValidate: true, shouldDirty: true });

          const provId = terceroEncontrado.provinciaid || terceroEncontrado.ProvinciaID || 0;
          if (provId) {
            setValue("provinciaid", String(provId), { shouldValidate: true, shouldDirty: true });
          }
          setAfipValidado(true);
          toast.info("No se halló AFIP/LUFE. Se usaron los datos locales del tercero.");
        } else {
          toast.error("CUIT no encontrado en AFIP/LUFE", {
            description: "No se encontraron datos automáticos. Podés ingresarlos manualmente.",
          });
          setValue("nombre", "");
          setAfipValidado(true);
        }
      }
    } catch (err) {
      console.error("Error validando CUIT en AFIP/SGR:", err);
      toast.error("Servicio de AFIP/LUFE no disponible", {
        description: "No se pudieron obtener datos automáticos. Podés ingresarlos manualmente.",
      });
      setValue("nombre", "");
      setAfipValidado(true);
    } finally {
      setValidando(false);
    }
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const calleVal = getValues("calle") || "";
    const numeroVal = getValues("numero") || "";
    const pisoVal = getValues("piso") || "";
    const deptoVal = getValues("departamento") || "";
    
    let fullDir = calleVal;
    if (numeroVal && Number(numeroVal) > 0) fullDir += ` ${numeroVal}`;
    if (pisoVal) fullDir += ` Piso:${pisoVal}`;
    if (deptoVal) fullDir += ` Dpto:${deptoVal}`;
    
    setValue("direccion", fullDir, { shouldDirty: true });

    const ciudadidVal = getValues("ciudadid");
    if (ciudadidVal) {
      const selectedCiudad = opcionesCiudades.find(
        (c) => String(c.value) === String(ciudadidVal)
      );
      if (selectedCiudad) {
        setValue("ciudad", selectedCiudad.label, { shouldDirty: true });
      }
    }

    let hasDropzoneErrors = false;
    if (!dniFrenteFile) {
      setErrorDniFrente(true);
      hasDropzoneErrors = true;
    }
    if (!dniDorsoFile) {
      setErrorDniDorso(true);
      hasDropzoneErrors = true;
    }

    const isValid = await trigger();
    
    if (!isValid || hasDropzoneErrors) return;

    if (!isDirty && !filesChanged) {
      onClose();
      return;
    }

    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    const formData = getValues();
    setGuardando(true);
    const mainToastId = toast.loading("Guardando datos del accionista...");
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
        console.warn("[MODAL - ACCIONISTA] Error buscando tercero existente:", err);
      }

      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid: cuitLimpio.startsWith("30") || cuitLimpio.startsWith("33") ? 2 : 1,
        tipodocumentoid: 0,
        numerodocumento: cuitLimpio,
        estadocivilid: 0,
        ciudadid: Number(formData.ciudadid) || 0,
        provinciaid: Number(formData.provinciaid) || 0,
        telefono: formData.celular || "",
        conyuge: "",
        actividad: "",
        contacto: "",
        nrocuenta: "",
        codigomercado: "",
        calle: formData.calle || formData.direccion || "",
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

      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];

      if (relacionId) {
        const payloadRel = {
          ...(socio?.relacion || {}),
          sociotercerorelacionid: relacionId,
          porcacciones: Number(formData.participacion),
          telefono: formData.celular || "",
          provinciaid: Number(formData.provinciaid) || 0,
          ciudadid: Number(formData.ciudadid) || 0,
          momento: ahora,
        };
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
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
              nrosubcuentacaja: "",
              sucursalid: 0,
              default: "0",
              subtiporelacionsocioid: 0,
              telefono: formData.celular || "",
              momento: ahora,
              provinciaid: Number(formData.provinciaid) || 0,
              ciudadid: Number(formData.ciudadid) || 0,
            },
          ],
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
      }

      if (dniFrenteFile instanceof File || dniDorsoFile instanceof File) {
        toast.loading("Subiendo documentos de identidad del accionista...", { id: mainToastId });
        try {
          const archivosExistentes = await socioArchivoService.obtenerArchivos(socioIdActivo);
          if (dniFrenteFile instanceof File) {
            const existenteFrente = archivosExistentes?.find((a) => {
              if (a.tipodocumentoarchivoid !== socioArchivoService.TIPO_DOCUMENTO_MAP["socio-frente"]) return false;
              const descNorm = normalizarTexto(a.descripcion);
              return descNorm.includes(cuitLimpio) || descNorm.includes(normalizarTexto(formData.nombre));
            });
            const descFrente = `DNI Frente - ${formData.nombre.toUpperCase()}`;
            if (existenteFrente) {
              await socioArchivoService.actualizarArchivo(existenteFrente, dniFrenteFile, "socio-frente", descFrente);
            } else {
              await socioArchivoService.subirArchivo(socioIdActivo, dniFrenteFile, "socio-frente", descFrente);
            }
          }
          if (dniDorsoFile instanceof File) {
            const existenteDorso = archivosExistentes?.find((a) => {
              if (a.tipodocumentoarchivoid !== socioArchivoService.TIPO_DOCUMENTO_MAP["socio-dorso"]) return false;
              const descNorm = normalizarTexto(a.descripcion);
              return descNorm.includes(cuitLimpio) || descNorm.includes(normalizarTexto(formData.nombre));
            });
            const descDorso = `DNI Dorso - ${formData.nombre.toUpperCase()}`;
            if (existenteDorso) {
              await socioArchivoService.actualizarArchivo(existenteDorso, dniDorsoFile, "socio-dorso", descDorso);
            } else {
              await socioArchivoService.subirArchivo(socioIdActivo, dniDorsoFile, "socio-dorso", descDorso);
            }
          }
        } catch (uploadErr) {
          console.error("[MODAL - ACCIONISTA] Error subiendo archivos de DNI:", uploadErr);
          throw uploadErr;
        }
      }

      toast.success(relacionId ? "Accionista actualizado correctamente." : "Accionista guardado correctamente.", { id: mainToastId });

      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (error) {
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          setError(key, { type: "server", message: backendErrors[key] });
        });
        toast.error("Por favor, revisá los errores en el formulario.", { id: mainToastId });
      } else {
        toast.error("Ocurrió un error inesperado al guardar los datos.", { id: mainToastId });
      }
    } finally {
      setGuardando(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={socio ? "Editar Accionista" : "Agregar Accionista"}
        maxWidth="800px"
      >
        <form onSubmit={handlePreSubmit} className={styles.modalForm}>
          {!afipValidado && !socio ? (
            <div className={styles.cuitSearchStep}>
              <div className={styles.cuitSearchBanner}>
                <div className={styles.cuitSearchBannerIcon}>
                  <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className={styles.cuitSearchBannerText}>
                  <p className={styles.cuitSearchBannerTitle}>Validación segura con AFIP</p>
                  <p className={styles.cuitSearchBannerSub}>Ingresá el CUIT para autocompletar los datos del accionista</p>
                </div>
              </div>
              <div className={styles.cuitSearchInputWrapper}>
                <BuscadorCuit
                  name="cuit"
                  control={control}
                  label="CUIT del accionista"
                  onValidar={handleAfipLookup}
                  error={errors.cuit?.message}
                  esValido={String(cuitValue || "").replace(/\D/g, "").length === 11}
                  buttonText="VALIDAR CUIT"
                  isLoading={validando}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <span className={styles.summaryStatus}>
                    {enriqueciendoAuto ? (
                      <>
                        <Spinner size={10} style={{ marginRight: "0.25rem", display: "inline-block", verticalAlign: "middle" }} />
                        Enriqueciendo datos...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={12} /> Validado AFIP
                      </>
                    )}
                  </span>
                  {socio ? (
                    <button
                      type="button"
                      className={styles.editLink}
                      onClick={handleAfipLookup}
                      disabled={validando || enriqueciendoAuto}
                    >
                      <FiEdit2 size={11} /> {validando ? "Buscando..." : "Consultar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.editLink}
                      onClick={() => setAfipValidado(false)}
                    >
                      <FiEdit2 size={11} /> Cambiar CUIT
                    </button>
                  )}
                </div>

                <div className={styles.summaryBody}>
                  <div className={styles.summaryInfo}>
                    <input
                      type="text"
                      value={nombreValue || ""}
                      onChange={(e) => setValue("nombre", e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className={styles.editableSummaryName}
                      placeholder="Nombre o Razón Social"
                    />
                    <p className={styles.summaryCuit}>CUIT: {cuitValue}</p>
                  </div>
                </div>

                <div className={styles.summaryFooter}>
                  <div className={styles.pctInfo}>
                    <span className={styles.pctLabel}>Participación accionaria</span>
                    <span className={`${styles.availableText} ${maximoPermitido === 0 ? styles.availableTextError : ""}`}>
                      {maximoPermitido > 0 ? `Máximo permitido: ${maximoPermitido}%` : "Cupo completo"}
                    </span>
                  </div>

                  <div className={styles.pctInputContainer}>
                    <div className={`${styles.customInputWrapper} ${errors.participacion ? styles.wrapperError : ""}`}>
                      <Controller
                        name="participacion"
                        control={control}
                        rules={{
                          required: "Requerido",
                          min: { value: 0.01, message: "Mayor a 0" },
                          max: { value: maximoPermitido, message: `Máx ${maximoPermitido}%` },
                        }}
                        render={({ field }) => (
                          <input
                            {...field}
                            id="participacionSocioInput"
                            type="text"
                            className={styles.customInput}
                            placeholder="0"
                            maxLength={6}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, "");
                              const parts = val.split(".");
                              if (parts.length <= 2 && Number(val || 0) <= maximoPermitido) {
                                if (parts[1] && parts[1].length > 2) return;
                                setValue("participacion", val, { shouldValidate: true, shouldDirty: true });
                              }
                            }}
                          />
                        )}
                      />
                      <span className={styles.percentageSymbol}>%</span>
                    </div>
                    {errors.participacion && (
                      <span className={styles.errorText}>
                        <FiAlertCircle size={11} /> {errors.participacion.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <h4 className={styles.sectionTitle}>
                Datos Personales y Contacto
              </h4>

              <div className={styles.modalRow2}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "El email es obligatorio",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("email", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Email"
                      icon={<FiMail />}
                      error={fieldState.error?.message}
                      tooltip="Email que se utilizará para el envío de notificaciones societarias y comunicaciones de negocio."
                    />
                  )}
                />
                
                <Controller
                  name="celular"
                  control={control}
                  rules={{ required: "El celular es obligatorio" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("celular", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Celular (Sin 0 ni 15)"
                      mask={[{ mask: "00 0000-0000" }, { mask: "000 000-0000" }]}
                      icon={<FiSmartphone />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow}>
                <Controller
                  name="calle"
                  control={control}
                  rules={{ required: "La calle es obligatoria" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("calle", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Calle / Avenida"
                      icon={<FiMapPin />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow3}>
                <Controller
                  name="numero"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("numero", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Número"
                      type="number"
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="piso"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("piso", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Piso"
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="departamento"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("departamento", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Depto / Of."
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="provinciaid"
                  control={control}
                  rules={{ required: "Requerido" }}
                  render={({ fieldState }) => (
                    <SelectSocio
                      control={control}
                      name="provinciaid"
                      label={cargandoProvincias ? "Cargando provincias..." : "Provincia"}
                      icon={<FiMapPin />}
                      options={opcionesProvincias}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="ciudadid"
                  control={control}
                  render={({ fieldState }) => (
                    <SelectSocio
                      control={control}
                      name="ciudadid"
                      label={cargandoCiudades ? "Cargando..." : "Ciudad"}
                      icon={<FiMap />}
                      options={opcionesCiudades}
                      isLoading={cargandoCiudades}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <h4 className={styles.sectionTitle}>
                Identidad (DNI)
              </h4>
              <div className={styles.dropzoneGrid}>
                <DropzoneField
                  file={dniFrenteFile}
                  title="DNI Frente"
                  subtitle="Imagen clara y legible (Obligatorio)"
                  fileKey="frente"
                  hasError={errorDniFrente}
                  onChange={(f) => { setDniFrenteFile(f); setFilesChanged(true); setErrorDniFrente(false); }}
                  onEdit={() => document.getElementById(`file-input-frente`).click()}
                  onView={() => procesarArchivo(dniFrenteFile, archivosBackend, 'view', 'DNI')}
                  onDownload={() => procesarArchivo(dniFrenteFile, archivosBackend, 'download', 'DNI')}
                />
                <DropzoneField
                  file={dniDorsoFile}
                  title="DNI Dorso"
                  subtitle="Imagen clara y legible (Obligatorio)"
                  fileKey="dorso"
                  hasError={errorDniDorso}
                  onChange={(f) => { setDniDorsoFile(f); setFilesChanged(true); setErrorDniDorso(false); }}
                  onEdit={() => document.getElementById(`file-input-dorso`).click()}
                  onView={() => procesarArchivo(dniDorsoFile, archivosBackend, 'view', 'DNI')}
                  onDownload={() => procesarArchivo(dniDorsoFile, archivosBackend, 'download', 'DNI')}
                />
              </div>
            </>
          )}

          <div className={styles.modalFooter}>
            {(afipValidado || socio) && (
              <Button type="submit" variant="primary">
                {socio ? "Guardar Cambios" : "Agregar Accionista"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={socio ? "Actualizar Accionista" : "Agregar Accionista"}
        mensaje={socio ? "¿Estás seguro de que deseas guardar los cambios?" : "¿Estás seguro de que deseas agregar este accionista?"}
        isLoading={guardando}
      />
      <ProcesamientoModal 
        isOpen={procesoModal.isOpen} 
        titulo={procesoModal.titulo} 
        pasos={procesoModal.pasos} 
        hasError={procesoModal.hasError}
        isSystemError={procesoModal.isSystemError}
        onClose={() => setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false })}
        onRetry={handleAfipLookup}
      />
    </>
  );
}
