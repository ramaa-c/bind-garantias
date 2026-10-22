import React, { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiRefreshCw, FiEdit2, FiMail, FiSmartphone, FiMapPin, FiMap, FiUser, FiAlertCircle } from "react-icons/fi";
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
import { useRegistrarModalLegajo } from "../../../../../../hooks/useRegistrarModalLegajo";
import { mensajeNegocio } from "../../../../../../utils/mensajesError";
import { decidirReejecucionCdaTercero } from "../../../../../../hooks/useTerceros";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import { tercerosService } from "../../../../../../services/tercerosService";
import { FORMATOS_ARCHIVO, TAMANIO_MAXIMO_ARCHIVO_MB, formatBase64Size, procesarArchivo, validarTamanioArchivo, validarTipoArchivo } from "../../../../../../utils/fileUtils";
import { RELACION_ACCIONISTA_ID } from "../../../../../../constants/tiposRelacionSocio";
import { buscarRelacionVigente } from "../../../../../../utils/relacionesTercerosUtils";
import { useProvincias, useCiudades } from "../../../../../../hooks/useCatalogos";
import { useSincronizarCatalogoPorTexto } from "../../../../../../hooks/useSincronizarCatalogoPorTexto";
import { useValidarDomicilioRequerido } from "../../../../../../hooks/useValidarDomicilioRequerido";
import { parseAddress, armarDireccion } from "../../../../../../utils/direccionParser";
import { obtenerDatosEmpresaPorCuit } from "../../../../../../utils/datosEmpresaPorCuit";
import { SugerenciasTerceros } from "../TerceroCard/SugerenciasTerceros";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";

import styles from "./SocioAccionistaModal.module.css";
import { obtenerInicialesEmpresa } from "../../../../../../utils/empresaAvatar";
import { useCadenaActiva } from "../../../../../../hooks/useCadenaActiva";
import { useDescargaConFeedback } from "../../../../../../hooks/useDescargaConFeedback";

// El botón de submit vive en el footer del Modal (ver prop `footer`), fuera
// del <form> en el DOM - se asocian por este id vía el atributo HTML
// `form` del botón (ver SGRPLUSPLA-183).
const ACCIONISTA_FORM_ID = "accionista-modal-form";


const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

// Dibujos chicos (32×24) para la fila de DNI: el frente con la foto de la
// persona, el dorso con las líneas de texto y la banda del código - así se
// distinguen de un vistazo sin leer el título. Usan currentColor para tomar
// el color del estado (azul, amarillo al arrastrar, rojo con error).
const DibujoDniFrente = () => (
  <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <rect x="1" y="1" width="30" height="22" rx="4" />
    <circle cx="9.5" cy="9.5" r="3" />
    <path d="M4.5 18.5c.8-2.4 2.8-3.6 5-3.6s4.2 1.2 5 3.6" />
    <path d="M18 8h9M18 12h7M18 16h5" />
  </svg>
);

const DibujoDniDorso = () => (
  <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <rect x="1" y="1" width="30" height="22" rx="4" />
    <path d="M5 8h22M5 12h18M5 15h14" />
    <rect x="5" y="18" width="22" height="3" rx="1" strokeWidth="1.2" />
  </svg>
);

const DropzoneField = ({ file, title, onChange, onEdit, onView, onDownload, faseDescarga, fileKey, hasError, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Motivo del último archivo rechazado (formato/tamaño): las validaciones ya
  // avisan con un toast, pero el toast se va y la fila tiene que seguir
  // diciendo por qué no se cargó.
  const [errorArchivo, setErrorArchivo] = useState(null);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const aceptar = (archivo, formato = FORMATOS_ARCHIVO.documento) => {
    if (!archivo) return;
    if (!validarTipoArchivo(archivo, formato)) {
      setErrorArchivo(`Formato no permitido · usá ${formato.etiqueta}`);
      return;
    }
    if (!validarTamanioArchivo(archivo)) {
      setErrorArchivo(`El archivo supera los ${TAMANIO_MAXIMO_ARCHIVO_MB} MB`);
      return;
    }
    setErrorArchivo(null);
    onChange(archivo);
  };

  return (
    <div className={styles.dropzoneWrapper}>
      <input
        type="file"
        id={`file-input-${fileKey}`}
        style={{ display: "none" }}
        accept={FORMATOS_ARCHIVO.documento.accept}
        onChange={(e) => {
          aceptar(e.target.files?.[0]);
          e.target.value = null;
        }}
      />
      {/* Cámara trasera directa en mobile ("Sacar foto"): solo imágenes,
          porque es lo único que puede devolver la cámara. */}
      <input
        type="file"
        id={`camera-input-${fileKey}`}
        style={{ display: "none" }}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          aceptar(e.target.files?.[0], FORMATOS_ARCHIVO.imagen);
          e.target.value = null;
        }}
      />
      <CargaArchivos
        variant="fila"
        title={title}
        subtitle="Foto clara, sin reflejos"
        ilustracion={fileKey === "dorso" ? <DibujoDniDorso /> : <DibujoDniFrente />}
        // El límite de 50MB es un dato de archivos sueltos, no de una foto
        // de DNI - acá no aplica (ver CargaArchivos.jsx).
        showMaxSizeHint={false}
        formatos={FORMATOS_ARCHIVO.documento.etiqueta}
        onCamara={() => document.getElementById(`camera-input-${fileKey}`).click()}
        admin={isAdmin}
        isLoading={isLoading}
        hasError={hasError || Boolean(errorArchivo)}
        mensajeError={errorArchivo}
        file={
          file
            ? {
                name: file.name,
                size: file.size || "Disponible",
                vialufe: file.vialufe || "0",
                // File recién elegido (o en memoria): da la miniatura real.
                // Los del backend llegan sin contenido acá y quedan con la
                // tarjeta genérica.
                fuente: file instanceof Blob ? file : null,
                contenido: file.contenido,
              }
            : null
        }
        onClick={() => document.getElementById(`file-input-${fileKey}`).click()}
        onEdit={onEdit}
        onView={onView}
        onDownload={onDownload}
        faseDescarga={faseDescarga}
        isDragging={isDragging}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          aceptar(e.dataTransfer.files?.[0]);
        }}
      />
    </div>
  );
};

const DEFAULT_DNI_TERCEROS = {};
const DEFAULT_ACCIONISTAS = [];

const DEFAULT_SUGERENCIAS = [];

export function SocioAccionistaModal({ isOpen, onClose, onSuccess, socio, socioIdActivo, archivosBackend, cargandoArchivos = false, accionistas = DEFAULT_ACCIONISTAS, dniTerceros = DEFAULT_DNI_TERCEROS, sugerencias = DEFAULT_SUGERENCIAS }) {
  const { cadenaSlug } = useCadenaActiva();
  const cadenaValorIdParam = Number(cadenaSlug) || 0;
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");
  const [validando, setValidando] = useState(false);
  const [enriqueciendoAuto] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [dniFrenteFile, setDniFrenteFile] = useState(null);
  const [dniDorsoFile, setDniDorsoFile] = useState(null);
  // Feedback del botón de descarga del DNI (SGRPLUSPLA-199) - ver
  // useDescargaConFeedback.
  const { descargar, faseDe } = useDescargaConFeedback();
  const [guardando, setGuardando] = useState(false);
  const [procesoModal, setProcesoModal] = useState({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });

  const { ejecutarValidaciones } = useCdaEngine();
  const queryClient = useQueryClient();
  // Cuando el CDA rechaza en onConfirmSave (edición), en vez de un timeout
  // fijo se espera a que el usuario apriete "Continuar" en el
  // ProcesamientoModal antes de seguir con el guardado real — así tiene
  // tiempo de leer el motivo del rechazo en vez de que la pantalla avance
  // sola (reportado el 2026-08-21). Solo se usa acá; en null no hace nada.
  const cdaContinuarResolveRef = useRef(null);
  useRegistrarModalLegajo(isOpen);

  // El motor de CDAs para PANTALLA_SOCIOS necesita que la relación
  // tercero<->socio ya exista para poder resolver el contexto — si no,
  // el backend responde 500 (EAccessViolation, confirmado en vivo). Por
  // eso se crea un "stub" (participación 0, datos mínimos) ANTES de
  // validar, igual que Paso1Cuit ya hace para la empresa: si el CDA
  // rechaza, este registro queda igual (no se revierte). Se guarda el ID
  // acá para que onConfirmSave lo actualice en vez de crear uno nuevo.
  const stubIdsRef = useRef({ terceroId: null, relacionId: null });
  // Relación creada por ESTA sesión del modal y todavía sin confirmar: si el
  // usuario cierra sin aceptar, se le da de baja para que el alta no quede
  // hecha a medias (la lista ya la ocultaba por tener 0% de participación,
  // pero el vínculo quedaba igual en la base).
  const stubRelacionRef = useRef(null);
  const cdaNoAprobadoRef = useRef(false);

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
  const opcionesCiudades = useMemo(() => ciudadesData?.opciones || [], [ciudadesData]);

  const currentCiudad = useWatch({ control, name: "ciudad" });
  const currentCiudadId = useWatch({ control, name: "ciudadid" });
  const currentCalle = useWatch({ control, name: "calle" });

  // Ciudad se filtra por la provincia elegida (useCiudades recibe
  // currentProvincia) - ver useSincronizarCatalogoPorTexto para el detalle
  // de como se resuelve/limpia ciudadid (AFIP/Nosis/LUFE solo traen el
  // nombre de la ciudad en texto, nunca un id ya resuelto).
  useSincronizarCatalogoPorTexto({
    cargando: cargandoCiudades,
    opciones: opcionesCiudades,
    valorTexto: currentCiudad,
    valorId: currentCiudadId,
    campoTexto: "ciudad",
    campoId: "ciudadid",
    setValue,
  });

  const validarDomicilio = useValidarDomicilioRequerido({
    getValues,
    setError,
    clearErrors,
    errors,
    currentCalle,
    currentProvincia,
    currentCiudadId,
  });

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuitValue, clearErrors]);

  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  const completarUbicacionDesdePadron = async (cuitLimpio, ciudadLocal) => {
    try {
      const datosPadron = await obtenerDatosEmpresaPorCuit(cuitLimpio, opcionesProvincias);
      if (!datosPadron?.encontrado) return;
      const { valores } = datosPadron;
      if (valores.provinciaid) {
        setValue("provinciaid", String(valores.provinciaid), { shouldValidate: true, shouldDirty: true });
      }
      if (!ciudadLocal) {
        setValue("ciudad", valores.localidad || valores.ciudad || "", { shouldValidate: true, shouldDirty: true });
      }
    } catch (padronErr) {
      console.warn("[SocioAccionistaModal] Error completando provincia/ciudad desde el padrón:", padronErr);
    }
  };

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
    const socioCambio = socio !== prevDeps.socio;
    setPrevDeps({ isOpen, cuitValue, nombreValue, archivosBackend, dniTerceros, socio });

    if (isOpen && !wasOpen) {
      setDniFrenteFile(null);
      setDniDorsoFile(null);
      setFilesChanged(false);
      setErrorDniFrente(false);
      setErrorDniDorso(false);
      setShowConfirm(false);
      stubIdsRef.current = { terceroId: null, relacionId: null };
      stubRelacionRef.current = null;
      cdaNoAprobadoRef.current = false;
      if (socio) {
        setAfipValidado(true);
      } else {
        setAfipValidado(false);
      }
    }

    // Reset de valores Y errores en el mismo pase de render en que se
    // detecta la apertura (o el cambio de socio con el modal ya abierto),
    // en vez de en un useEffect aparte que corre un render despues - evita
    // que se vea un frame con los datos/errores de la sesion anterior (ej.
    // "El celular es obligatorio") apenas se reabre el modal para un
    // accionista distinto.
    if (isOpen && (!wasOpen || socioCambio)) {
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

    const recienAbierto = isOpen && !wasOpen;
    const frenteLocal = recienAbierto ? null : dniFrenteFile;
    const dorsoLocal = recienAbierto ? null : dniDorsoFile;
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    const nombreLimpio = normalizarTexto(nombreValue || socio?.nombre);

    if (isOpen && cuitLimpio.length === 11) {
      const memoryFiles = dniTerceros?.[cuitLimpio];

      if (memoryFiles?.dniFrente) {
        setDniFrenteFile(memoryFiles.dniFrente);
        setErrorDniFrente(false);
      } else if (!(frenteLocal instanceof File)) {
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
      } else if (!(dorsoLocal instanceof File)) {
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

  // `cuitElegido`: CUIT de una persona elegida en SugerenciasTerceros. Desde
  // el botón "Validar" llega el evento del click, por eso el chequeo de tipo.
  const handleAfipLookup = async (cuitElegido) => {
    const cuitLimpio = String(
      (typeof cuitElegido === "string" ? cuitElegido : cuitValue) || "",
    ).replace(/\D/g, "");
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      setError("cuit", { type: "manual", message: "Por favor, ingrese un CUIT de 11 dígitos válido." });
      return;
    }
    setValidando(true);

    clearErrors("cuit");

    // Refleja los 3 tramos reales de esta función, en el mismo orden que
    // Paso1Cuit: vincular (solo alta nueva) → consultar padrón → CDA al
    // final. El CDA YA NO bloquea si rechaza: se deja completar y guardar
    // igual, y la persona queda marcada como rechazada (ver
    // AccionistasSection) para que un admin la reintente después. El
    // padrón (no encontrar a la persona en ningún lado) sí sigue
    // bloqueando. En edición no hay nada que vincular, así que ese paso
    // arranca directo "completado".
    const necesitaVinculo = !socio && !stubIdsRef.current.terceroId;

    setProcesoModal({
      isOpen: true,
      titulo: "Validando Socio",
      pasos: [
        { id: "vinculo", etiqueta: "Vinculando con el socio", estado: necesitaVinculo ? "cargando" : "completado", descripcion: "Registrando la relación en el sistema." },
        { id: "padron", etiqueta: "Consultando datos de la persona", estado: necesitaVinculo ? "pendiente" : "cargando", descripcion: "Obteniendo los datos de la persona en tiempo real." },
        { id: "cda", etiqueta: "Verificando requisitos", estado: "pendiente", descripcion: "Comprobando políticas de riesgo y negocio para el alta." },
      ],
      hasError: false,
      isSystemError: false
    });

    // Solo hace falta crear el stub para un accionista NUEVO — si `socio`
    // viene seteado (edición), la relación ya existe de antes.
    if (necesitaVinculo) {
      try {
        // Denominacion y descripcionreducida van VACÍAS a propósito (no
        // "Pendiente de datos" ni similar) para el caso de que haya que
        // crearlo: la lógica de precarga de más abajo hace
        // `terceroEncontrado?.denominacion || nosisData...`, y un
        // placeholder no vacío gana esa cadena de ORs, pisando el nombre
        // real que devuelva NOSIS/AFIP. `buscarOCrearTercero` busca primero
        // por CUIT y reutiliza el existente si lo hay (evitando duplicarlo).
        const terceroResuelto = await tercerosService.buscarOCrearTercero(cuitLimpio, {
          tercerorelacionadoid: 0,
          denominacion: "",
          cuit: cuitLimpio,
          bcraid: 0,
          tipopersonaid: ["30", "33", "34"].some((prefijo) => cuitLimpio.startsWith(prefijo)) ? 2 : 1,
          tipodocumentoid: 0,
          numerodocumento: cuitLimpio,
          estadocivilid: 0,
          ciudadid: 0,
          provinciaid: 0,
          telefono: "",
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
          descripcionreducida: "",
          mail: "",
        });
        const stubTerceroId =
          terceroResuelto.tercerorelacionadoid ||
          terceroResuelto.TerceroRelacionadoID ||
          terceroResuelto.id;

        const relacionesSocio = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
        const relacionExistente = buscarRelacionVigente(
          relacionesSocio,
          stubTerceroId,
          RELACION_ACCIONISTA_ID,
        );

        let stubRelacionId = relacionExistente
          ? (relacionExistente.sociotercerorelacionid ?? relacionExistente.SocioTerceroRelacionID)
          : null;

        if (!stubRelacionId) {
          const ahoraStub = new Date().toISOString().split(".")[0];
          const unAnioMasStub = new Date();
          unAnioMasStub.setFullYear(unAnioMasStub.getFullYear() + 1);
          await tercerosService.guardarRelacionesDeSocio({
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: stubTerceroId,
                tiporelacionsocioid: RELACION_ACCIONISTA_ID,
                fechadesde: ahoraStub,
                fechahasta: unAnioMasStub.toISOString().split(".")[0],
                porcacciones: 0,
                nroinscripcion: "",
                condicionescomerciales: "",
                cbu: "",
                nrosubcuentacaja: "",
                sucursalid: 0,
                default: "0",
                subtiporelacionsocioid: 0,
                telefono: "",
                momento: ahoraStub,
              },
            ],
          });
          const relacionesActualizadas = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
          const nuevaRelacion = buscarRelacionVigente(
            relacionesActualizadas,
            stubTerceroId,
            RELACION_ACCIONISTA_ID,
          );
          stubRelacionId = nuevaRelacion?.sociotercerorelacionid ?? nuevaRelacion?.SocioTerceroRelacionID ?? null;
          stubRelacionRef.current = nuevaRelacion || null;
        }

        stubIdsRef.current = { terceroId: stubTerceroId, relacionId: stubRelacionId };
        // No se avisa con onSuccess acá: mientras la participación siga en
        // 0% (todavía no se completó el alta), la lista de accionistas lo
        // sigue ocultando a propósito (ver useObtenerDatosSocioLegajo) —
        // refrescar antes de eso no mostraría nada nuevo. Recién tiene
        // sentido avisar cuando se guarda de verdad con un % real, en
        // onConfirmSave.
      } catch (stubErr) {
        // No bloqueamos la validación por esto: si falla, seguimos igual
        // (en el peor caso, el CDA va a fallar con el mismo error que ya
        // conocíamos antes de este cambio).
        console.error("[SocioAccionistaModal] Error creando la relación previa a validar CDA:", stubErr);
      }
      setProcesoModal(prev => ({
        ...prev,
        pasos: prev.pasos.map(p =>
          p.id === "vinculo" ? { ...p, estado: "completado" } :
          p.id === "padron" ? { ...p, estado: "cargando" } : p
        ),
      }));
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

      let padronOk = false;

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
        } else {
          await completarUbicacionDesdePadron(cuitLimpio, terceroEncontrado.ciudad);
        }

        toast.success("Datos del accionista recuperados del sistema.");
        padronOk = true;
      }

      // El CDA corre AL FINAL (ver más abajo), después de que el padrón
      // haya terminado por cualquiera de los caminos posibles — `padronOk`
      // es lo que permite saltar el resto de este bloque cuando el primero
      // (datos locales) ya alcanzó.
      // Se consulta el padrón con la MISMA función que usa el Paso 1 del
      // onboarding: misma cascada (Nosis → LUFE → AFIP) y el mismo
      // decodeHtmlEntities antes de resolver la provincia. Sin eso, un valor
      // como "C&oacute;rdoba" no matchea nunca contra el catálogo y
      // provincia/ciudad quedan vacías (SGRPLUSPLA-186).
      let datosPadron = null;
      if (!padronOk) {
        try {
          datosPadron = await obtenerDatosEmpresaPorCuit(cuitLimpio, opcionesProvincias);
        } catch (padronErr) {
          console.warn("[SocioAccionistaModal] Error consultando el padrón:", padronErr);
        }
      }

      if (!padronOk && datosPadron?.encontrado) {
        const { valores, afipData } = datosPadron;
        const dg = afipData?.datosgenerales;

        const nombreSocio = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                            valores.razonSocial || "Socio";
        const emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || dg?.email || dg?.emailfacturacion || "";
        const celularVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || dg?.telefono || "";
        const direccionVal = armarDireccion(
          terceroEncontrado,
          valores.direccion || `${valores.calle || ""} ${valores.numero || ""}`.trim(),
        );
        const parsedDir = parseAddress(direccionVal);
        const deptoVal = terceroEncontrado?.departamento || valores.departamento || "";
        const ciudadVal = valores.localidad || valores.ciudad || "";
        const codposVal = terceroEncontrado?.codpos || valores.codpos || "";
        const provIdVal = terceroEncontrado?.provinciaid || terceroEncontrado?.ProvinciaID || valores.provinciaid || 0;

        setValue("nombre", nombreSocio, { shouldValidate: true, shouldDirty: true });
        setValue("email", emailVal, { shouldValidate: true, shouldDirty: true });
        setValue("celular", celularVal, { shouldValidate: true, shouldDirty: true });
        setValue("direccion", direccionVal, { shouldValidate: true, shouldDirty: true });
        setValue("calle", parsedDir.calle, { shouldValidate: true, shouldDirty: true });
        setValue("numero", parsedDir.numero ?? "", { shouldValidate: true, shouldDirty: true });
        setValue("piso", parsedDir.piso, { shouldValidate: true, shouldDirty: true });
        setValue("departamento", deptoVal, { shouldValidate: true, shouldDirty: true });
        setValue("ciudad", ciudadVal, { shouldValidate: true, shouldDirty: true });
        setValue("ciudadid", Number(terceroEncontrado?.ciudadid) || 0, { shouldValidate: true, shouldDirty: true });
        setValue("codpos", codposVal, { shouldValidate: true, shouldDirty: true });

        if (provIdVal) {
          setValue("provinciaid", String(provIdVal), { shouldValidate: true, shouldDirty: true });
        }

        // Se persiste YA lo que trajo AFIP/NOSIS (nombre/domicilio/contacto):
        // si el usuario cierra sin guardar y vuelve más tarde, esta info no
        // se pierde (antes quedaba solo en el formulario en memoria, y el
        // tercero en la base seguía con denominacion="" del stub). Lo que
        // falta — participación, DNI, o cualquier edición manual — se
        // termina de guardar en onConfirmSave.
        if (stubIdsRef.current.terceroId) {
          try {
            await tercerosService.actualizarTercero({
              tercerorelacionadoid: stubIdsRef.current.terceroId,
              denominacion: nombreSocio,
              cuit: cuitLimpio,
              bcraid: 0,
              tipopersonaid: ["30", "33", "34"].some((prefijo) => cuitLimpio.startsWith(prefijo)) ? 2 : 1,
              tipodocumentoid: 0,
              numerodocumento: cuitLimpio,
              estadocivilid: 0,
              ciudadid: Number(terceroEncontrado?.ciudadid) || 0,
              provinciaid: Number(provIdVal) || 0,
              telefono: celularVal,
              conyuge: "",
              actividad: "",
              contacto: "",
              nrocuenta: "",
              codigomercado: "",
              calle: parsedDir.calle || direccionVal || "",
              numero: Number(parsedDir.numero) || 0,
              piso: parsedDir.piso || "",
              departamento: deptoVal || "",
              codpos: codposVal || "",
              descripcionreducida: nombreSocio.substring(0, 20),
              mail: emailVal,
            });
            // No se avisa con onSuccess acá tampoco: sigue en 0% de
            // participación, así que la lista lo sigue ocultando (ver
            // comentario más arriba). El nombre ya quedó persistido de
            // todas formas, para cuando el usuario complete el % y guarde.
          } catch (persistErr) {
            console.warn("[SocioAccionistaModal] No se pudo persistir la precarga de AFIP/NOSIS:", persistErr);
          }
        }

        toast.success(socio ? "Datos actualizados correctamente." : "Datos del accionista recuperados.");
        padronOk = true;
      } else if (!padronOk) {
        // Padrón no encontrado por ningún lado (ni NOSIS/AFIP/LUFE, ni un
        // tercero local con datos completos): acá sí se bloquea, igual que
        // en RepresentanteModal — no hay nada razonable para completar a
        // mano sin al menos un nombre.
        setError("cuit", { type: "manual", message: "CUIT no encontrado. Revisá que sea correcto." });
        setAfipValidado(false);
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          isSystemError: false,
          pasos: prev.pasos.map(p =>
            p.id === "padron" ? { ...p, estado: "error", errores: ["No pudimos verificar los datos de este CUIT. Revisá que sea correcto e intentá nuevamente."] } : p
          ),
        }));
        setValidando(false);
        return;
      }
    } catch (err) {
      console.error("Error validando CUIT en AFIP/SGR:", err);
      setError("cuit", { type: "manual", message: "El servicio de verificación no está disponible en este momento. Intentá nuevamente más tarde." });
      setAfipValidado(false);
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: true,
        pasos: prev.pasos.map(p =>
          p.id === "padron" ? { ...p, estado: "error", errores: ["El servicio de verificación no está disponible en este momento. Intentá nuevamente en unos minutos."] } : p
        ),
      }));
      setValidando(false);
      return;
    }

    // Padrón resuelto: ahora sí corre el CDA, al final. Ya NO bloquea si
    // rechaza — se deja completar y guardar el formulario igual; la
    // persona queda con la ejecución rechazada en su historial (ver
    // AccionistasSection, que la muestra en rojo) para que un admin la
    // reintente después desde EmpresaDetalle.
    setProcesoModal(prev => ({
      ...prev,
      pasos: prev.pasos.map(p =>
        p.id === "padron" ? { ...p, estado: "completado" } :
        p.id === "cda" ? { ...p, estado: "cargando" } : p
      ),
    }));

    const terceroIdValidacion = socio?.id || stubIdsRef.current.terceroId || null;

    if (!terceroIdValidacion) {
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: true,
        pasos: prev.pasos.map(p =>
          p.id === "cda" ? {
              ...p,
              estado: "error",
              errores: ["No se pudo identificar a la persona para validar los criterios de aceptación. Intentá nuevamente."]
          } : p
        )
      }));
      setAfipValidado(false);
      setValidando(false);
      return;
    }

    const result = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId: terceroIdValidacion }, cadenaValorIdParam);

    // Sin esto, la card de la lista (AccionistasSection, vía
    // useEstadoCdaTerceros) y el badge de TerceroCdaEstado siguen mostrando
    // el estado viejo hasta que algo más los refresque (ej. "Volver a
    // ejecutar", o que venza el staleTime) — el CDA sí quedó bien
    // registrado en el backend, pero la UI no se enteraba solo con esto.
    queryClient.invalidateQueries({ queryKey: ["terceros", "executeCda", terceroIdValidacion] });
    queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] });

    cdaNoAprobadoRef.current = !result.success && !result.errors.some((e) => e.isSystemError);

    if (!result.success) {
      // hasError:true acá muestra el botón "Continuar" del ProcesamientoModal
      // y NO se auto-cierra (a diferencia del caso exitoso, más abajo): sin
      // esto, el aviso de que el CDA no se cumplió pasaba de largo en
      // 1200ms y el usuario se quedaba sin poder leerlo (reportado el
      // 2026-08-21). El resto del formulario ya quedó habilitado igual
      // (setAfipValidado(true) corre siempre) — cerrar este modal no
      // bloquea nada, solo le da tiempo al usuario a leer antes de seguir.
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        pasos: prev.pasos.map(p =>
          p.id === "cda" ? { ...p, estado: "alerta", errores: result.errors.map(e => e.message) } : p
        ),
      }));
    } else {
      setProcesoModal(prev => ({
        ...prev,
        pasos: prev.pasos.map(p => (p.id === "cda" ? { ...p, estado: "completado" } : p)),
      }));
      setTimeout(() => {
        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
      }, 600);
    }

    setAfipValidado(true);
    setValidando(false);
  };

  const conservarAltaEnRevision = async (relacion) => {
    const participacionCargada = Number(getValues("participacion"));
    const participacionValida =
      participacionCargada > 0 && participacionCargada <= maximoPermitido;
    const participacion = participacionValida ? participacionCargada : maximoPermitido;
    if (!(participacion > 0)) return false;

    try {
      await tercerosService.actualizarRelacionDeSocio({
        ...relacion,
        socioid: socioIdActivo,
        porcacciones: participacion,
        momento: new Date().toISOString().split(".")[0],
      });
    } catch (relErr) {
      console.warn("[SocioAccionistaModal] No se pudo conservar el alta en revisión:", relErr);
      return false;
    }

    toast.info(`El accionista quedó cargado con ${participacion}% y en revisión.`, {
      description: participacionValida
        ? "Podés completar o corregir sus datos editándolo desde la lista."
        : "Se le asignó la participación disponible: revisala y completá sus datos editándolo desde la lista.",
    });
    if (onSuccess) onSuccess();
    return true;
  };

  const descartarAltaSinConfirmar = async () => {
    const relacion = stubRelacionRef.current;
    if (!relacion) return;
    stubRelacionRef.current = null;

    if (cdaNoAprobadoRef.current) {
      cdaNoAprobadoRef.current = false;
      if (await conservarAltaEnRevision(relacion)) return;
    }

    try {
      await tercerosService.darDeBajaRelacionDeSocio(relacion);
      if (onSuccess) onSuccess();
    } catch (bajaErr) {
      console.warn("[SocioAccionistaModal] No se pudo descartar el alta sin confirmar:", bajaErr);
    }
  };

  const handleCerrar = async () => {
    const debeIndicarParticipacion =
      cdaNoAprobadoRef.current &&
      !!stubRelacionRef.current &&
      maximoPermitido > 0 &&
      !(Number(getValues("participacion")) > 0);

    if (debeIndicarParticipacion) {
      setError("participacion", {
        type: "manual",
        message: "Indicá el % de participación: el accionista queda cargado y en revisión aunque cierres.",
      });
      toast.warning("Falta el % de participación", {
        description: "Este accionista queda cargado aunque cierres. Indicá su participación para continuar.",
      });
      document.getElementById("participacionSocioInput")?.focus();
      return;
    }

    await descartarAltaSinConfirmar();
    onClose();
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (cargandoArchivos && (!dniFrenteFile || !dniDorsoFile)) {
      toast.info("Esperá a que terminen de cargar las imágenes del DNI.");
      return;
    }

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
    const domicilioValido = validarDomicilio();

    if (!isValid || hasDropzoneErrors || !domicilioValido) return;

    // No puede repetirse el email entre accionistas (SGRPLUSPLA-137) -
    // reusa indexSocioEditado (ya calculado más arriba) para excluirse a sí
    // mismo al editar.
    const emailValue = (getValues("email") || "").trim().toLowerCase();
    const emailDuplicado = accionistas.some(
      (s, idx) => idx !== indexSocioEditado && (s.email || "").trim().toLowerCase() === emailValue,
    );
    if (emailDuplicado) {
      setError("email", {
        type: "manual",
        message: "Ya hay otro accionista cargado con este mismo email.",
      });
      return;
    }

    if (!isDirty && !filesChanged) {
      await handleCerrar();
      return;
    }

    setShowConfirm(true);
  };

  // Al editar un accionista existente (ej. precargado por LUFE) el paso
  // de "Validar CUIT" se salta directo al formulario — handleAfipLookup,
  // que es donde corre el CDA, nunca se dispara. Por eso se valida al
  // confirmar el guardado, DESPUÉS de persistir el tercero: el backend
  // evalúa el CDA contra lo que hay en la base, y si corría antes evaluaba
  // los datos viejos (ej. un TipoPersonaID heredado de la migración que el
  // PUT recién corrige → rechazo "no es persona física" que desaparecía
  // al volver a guardar).
  //
  // Se muestra el mismo modal de progreso que usa handleAfipLookup, para
  // que quede visible que se está validando.
  //
  // Si ya tiene un CDA Aprobado vigente (mismo cálculo que usa
  // TerceroCdaEstado para el badge), se confía en eso y no se vuelve a
  // ejecutar. Si rechaza, NO bloquea (unificado con handleAfipLookup): el
  // guardado ya quedó hecho, y la persona queda marcada en rojo en la
  // lista para que un admin la reintente después.
  const validarCdaAccionistaExistente = async (terceroId) => {
    let reejecutar = true;
    try {
      reejecutar = await decidirReejecucionCdaTercero(queryClient, terceroId, cadenaValorIdParam);
    } catch (histErr) {
      console.warn("[SocioAccionistaModal] No se pudo obtener el historial de CDA, se re-ejecuta por las dudas:", histErr);
    }

    if (!reejecutar) return;

    setProcesoModal({
      isOpen: true,
      titulo: "Validando Accionista",
      pasos: [
        { id: "cda", etiqueta: "Verificando requisitos", estado: "cargando", descripcion: "Comprobando políticas de riesgo y negocio." },
      ],
      hasError: false,
      isSystemError: false,
    });
    const resultCda = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId }, cadenaValorIdParam);
    // Ver comentario equivalente en handleAfipLookup: sin esto la card
    // de la lista y el badge de TerceroCdaEstado quedan mostrando el
    // estado viejo hasta que algo más los refresque.
    queryClient.invalidateQueries({ queryKey: ["terceros", "executeCda", terceroId] });
    queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] });
    if (resultCda.success) {
      setProcesoModal((prev) => ({
        ...prev,
        pasos: prev.pasos.map((p) => (p.id === "cda" ? { ...p, estado: "completado" } : p)),
      }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
    } else {
      // hasError:true muestra el botón "Continuar" y no hay timeout: se
      // espera a que el usuario lo apriete (ver onClose del
      // ProcesamientoModal más abajo, que resuelve esta promesa) antes
      // de cerrar el modal del accionista.
      setProcesoModal((prev) => ({
        ...prev,
        hasError: true,
        pasos: prev.pasos.map((p) =>
          p.id === "cda" ? { ...p, estado: "alerta", errores: resultCda.errors.map((e) => e.message) } : p
        ),
      }));
      await new Promise((resolve) => {
        cdaContinuarResolveRef.current = resolve;
      });
    }
  };

  const onConfirmSave = async () => {
    const formData = getValues();
    setGuardando(true);
    const mainToastId = toast.loading("Guardando datos del accionista...");
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");

      // Si ya se sabe qué tercero se está editando (socio.id, o el stub
      // creado antes de validar el CDA), se usa ese ID directo en vez de
      // volver a buscar por CUIT: si hay más de un tercero con el mismo
      // CUIT, la búsqueda por CUIT puede devolver uno DISTINTO al que la
      // relación de este socio ya apunta — el PUT de abajo actualizaría ese
      // otro registro, y la relación seguiría apuntando al de siempre: el
      // guardado avisa éxito, pero los cambios nunca se ven al reabrir.
      let terceroId = socio?.id || stubIdsRef.current.terceroId || null;

      if (!terceroId) {
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
      }

      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid: ["30", "33", "34"].some((prefijo) => cuitLimpio.startsWith(prefijo)) ? 2 : 1,
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

      // Si esta relación se creó como "stub" antes de validar el CDA (ver
      // handleAfipLookup), acá hay que actualizarla en vez de crear una
      // segunda — de ahí el fallback a stubIdsRef.
      const relacionIdEfectivo = relacionId || stubIdsRef.current.relacionId;

      if (relacionIdEfectivo) {
        const payloadRel = {
          fechadesde: ahora,
          fechahasta: unAnioMasStr,
          ...(socio?.relacion || {}),
          sociotercerorelacionid: relacionIdEfectivo,
          socioid: socioIdActivo,
          terceroid: terceroId,
          tiporelacionsocioid: RELACION_ACCIONISTA_ID,
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
              tiporelacionsocioid: RELACION_ACCIONISTA_ID,
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
          const archivosExistentes = await socioArchivoService.obtenerArchivos(socioIdActivo, true);
          if (dniFrenteFile instanceof File) {
            const existenteFrente = archivosExistentes?.find((a) => {
              if (a.tipodocumentoarchivoid !== socioArchivoService.TIPO_DOCUMENTO_MAP["socio-frente"]) return false;
              const descNorm = normalizarTexto(a.descripcion);
              return descNorm.includes(cuitLimpio) || descNorm.includes(normalizarTexto(formData.nombre));
            });
            // El CUIT viaja en la descripción a propósito: es el único
            // vínculo real entre este archivo y el accionista (no hay
            // columna que lo relacione), y a diferencia del nombre, no
            // cambia si el mismo tercero se actualiza después (ej. al
            // guardarlo también como representante) — evita que ese cambio
            // de nombre haga que useValidacionLegajo deje de encontrar el
            // DNI y el requisito vuelva a "pendiente".
            const descFrente = `DNI Frente - ${cuitLimpio} - ${formData.nombre.toUpperCase()}`;
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
            const descDorso = `DNI Dorso - ${cuitLimpio} - ${formData.nombre.toUpperCase()}`;
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

      // El alta quedó confirmada: la relación ya no es un stub pendiente y
      // no hay que darla de baja al cerrar.
      stubRelacionRef.current = null;

      if (socio) {
        setShowConfirm(false);
        await validarCdaAccionistaExistente(terceroId);
      }

      // No se espera a onSuccess (cargarSocios en SociosLegajo.jsx puede
      // tardar unos segundos en refetchear todo de verdad) — la modal se
      // cierra ya mismo y la sección de accionistas queda en su propio
      // estado de carga ("actualizando") hasta que el refresh termine, en
      // vez de retener la modal abierta esperando.
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
        // Motivo de negocio de la API (ej. la suma de participaciones supera
        // el 100%, relación duplicada, CUIT inválido) o el texto genérico.
        toast.error(mensajeNegocio(error, "Ocurrió un error inesperado al guardar los datos."), { id: mainToastId });
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
        onClose={handleCerrar}
        title={socio ? "Editar Accionista" : "Agregar Accionista"}
        // El paso de búsqueda es una sola columna: con los 800px del
        // formulario quedaba mucho aire a los lados.
        maxWidth={!afipValidado && !socio ? "34rem" : "800px"}
        variant={isAdmin ? "blue" : "default"}
        footerClassName={isAdmin ? styles.modalFooterAdmin : ""}
        footer={
          (afipValidado || socio) && (
            <>
              <Button type="button" variant={isAdmin ? "outlineBlue" : "outline"} onClick={handleCerrar} disabled={validando}>
                Cancelar
              </Button>
              <Button type="submit" form={ACCIONISTA_FORM_ID} variant={isAdmin ? "blue" : "primary"} isLoading={validando} disabled={validando}>
                {socio ? "Guardar cambios" : "Agregar accionista"}
              </Button>
            </>
          )
        }
      >
        <form id={ACCIONISTA_FORM_ID} onSubmit={handlePreSubmit} className={styles.modalForm}>
          {!afipValidado && !socio ? (
            <div className={styles.cuitSearchStep}>
              {/* Mismo patrón que el paso 1 del alta (Paso1Cuit): el CUIT es
                  lo protagonista y "Validar" vive dentro del input. Admin
                  conserva el botón aparte en azul. */}
              <div className={styles.cuitSearchHead}>
                <span className={`${styles.cuitSearchIcon} ${isAdmin ? styles.cuitSearchIconAdmin : ""}`} aria-hidden="true">
                  <FiUser />
                </span>
                <div className={styles.cuitSearchHeadText}>
                  <p className={styles.cuitSearchTitle}>¿Quién va a ser accionista?</p>
                  <p className={styles.cuitSearchSub}>Ingresá su CUIT y completamos sus datos.</p>
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
                  buttonText={isAdmin ? "VALIDAR CUIT" : "Validar"}
                  isLoading={validando}
                  inline={!isAdmin}
                />
                <p className={styles.cuitSearchAyuda}>Son 11 números, sin guiones.</p>
              </div>
              <SugerenciasTerceros
                sugerencias={sugerencias}
                isAdmin={isAdmin}
                disabled={validando}
                onUsar={(persona) => {
                  setValue("cuit", persona.cuit, { shouldDirty: true });
                  handleAfipLookup(persona.cuit);
                }}
              />
            </div>
          ) : (
            <>
              <h4 className={styles.sectionTitle}>
                <span className={`${styles.sectionNum} ${styles.sectionNumOk}`} aria-hidden="true"><FiCheck /></span>
                Accionista
              </h4>
              <div className={styles.identidadRow}>
                <div className={styles.identidadCard}>
                  <span className={styles.identidadAvatar} aria-hidden="true">
                    {obtenerInicialesEmpresa(nombreValue || "") || <FiUser />}
                  </span>
                  <div className={styles.identidadTexto}>
                    <div className={styles.identidadNombreFila}>
                      {/* El nombre viene de la fuente al validar el CUIT: el
                          cliente no lo edita a mano, salvo que no haya
                          llegado ninguno. Admin conserva la edición para
                          corregir casos puntuales. */}
                      {isAdmin || !String(nombreValue || "").trim() ? (
                        <input
                          type="text"
                          value={nombreValue || ""}
                          onChange={(e) => setValue("nombre", e.target.value, { shouldDirty: true, shouldValidate: true })}
                          className={styles.editableSummaryName}
                          placeholder="Nombre o Razón Social"
                          aria-label="Nombre o razón social"
                        />
                      ) : (
                        <strong className={styles.identidadNombre}>{nombreValue || "Sin nombre"}</strong>
                      )}
                      <span className={styles.summaryStatus}>
                        {enriqueciendoAuto ? (
                          <>
                            <Spinner size={10} style={{ display: "inline-block", verticalAlign: "middle" }} />
                            Completando datos...
                          </>
                        ) : (
                          "Validado"
                        )}
                      </span>
                    </div>
                    <span className={styles.summaryCuit}>CUIT {cuitValue}</span>
                  </div>
                  {socio ? (
                    <button
                      type="button"
                      className={styles.editLink}
                      onClick={handleAfipLookup}
                      disabled={validando || enriqueciendoAuto}
                    >
                      <FiRefreshCw size={12} aria-hidden="true" /> {validando ? "Actualizando..." : "Actualizar datos"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.editLink}
                      onClick={() => setAfipValidado(false)}
                    >
                      <FiEdit2 size={12} aria-hidden="true" /> Cambiar CUIT
                    </button>
                  )}
                </div>

                <div className={styles.pctCampo}>
                  <label className={styles.pctLabelFila} htmlFor="participacionSocioInput">
                    <span className={styles.pctLabel}>Participación</span>
                    <span className={`${styles.availableText} ${maximoPermitido === 0 ? styles.availableTextError : ""}`}>
                      {maximoPermitido > 0 ? `máx. ${maximoPermitido}%` : "Cupo completo"}
                    </span>
                  </label>
                  <div className={`${styles.customInputWrapper} ${isAdmin ? styles.customInputWrapperAdmin : ""} ${errors.participacion ? styles.wrapperError : ""}`}>
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

              <h4 className={styles.sectionTitle}>
                <span className={styles.sectionNum} aria-hidden="true">2</span>
                Contacto
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
                      tooltip="Email personal del accionista, utilizado para el envío de notificaciones societarias y comunicaciones de negocio. No usar casillas genéricas (ej. administración@...)."
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

              <h4 className={styles.sectionTitle}>
                <span className={styles.sectionNum} aria-hidden="true">3</span>
                Domicilio
              </h4>
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

              <div className={styles.modalRow3}>
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

                <Controller
                  name="codpos"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("codpos", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Código Postal"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <h4 className={styles.sectionTitle}>
                <span className={styles.sectionNum} aria-hidden="true">4</span>
                DNI
              </h4>
              <div className={styles.dropzoneGrid}>
                <DropzoneField
                  file={dniFrenteFile}
                  title="DNI Frente"
                  fileKey="frente"
                  isLoading={cargandoArchivos && !dniFrenteFile}
                  hasError={errorDniFrente}
                  onChange={(f) => { setDniFrenteFile(f); setFilesChanged(true); setErrorDniFrente(false); }}
                  onEdit={() => document.getElementById(`file-input-frente`).click()}
                  onView={() => procesarArchivo(dniFrenteFile, archivosBackend, 'view', 'DNI')}
                  onDownload={() =>
                    descargar('frente', () =>
                      procesarArchivo(dniFrenteFile, archivosBackend, 'download', 'DNI'),
                    )
                  }
                  faseDescarga={faseDe('frente')}
                />
                <DropzoneField
                  file={dniDorsoFile}
                  title="DNI Dorso"
                  fileKey="dorso"
                  isLoading={cargandoArchivos && !dniDorsoFile}
                  hasError={errorDniDorso}
                  onChange={(f) => { setDniDorsoFile(f); setFilesChanged(true); setErrorDniDorso(false); }}
                  onEdit={() => document.getElementById(`file-input-dorso`).click()}
                  onView={() => procesarArchivo(dniDorsoFile, archivosBackend, 'view', 'DNI')}
                  onDownload={() =>
                    descargar('dorso', () =>
                      procesarArchivo(dniDorsoFile, archivosBackend, 'download', 'DNI'),
                    )
                  }
                  faseDescarga={faseDe('dorso')}
                />
              </div>
            </>
          )}
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={socio ? "Actualizar Accionista" : "Agregar Accionista"}
        variant={isAdmin ? "blue" : "default"}
        mensaje={socio ? "¿Estás seguro de que deseas guardar los cambios?" : "¿Estás seguro de que deseas agregar este accionista?"}
        isLoading={guardando}
      />
      <ProcesamientoModal 
        isOpen={procesoModal.isOpen} 
        titulo={procesoModal.titulo} 
        pasos={procesoModal.pasos} 
        hasError={procesoModal.hasError}
        isSystemError={procesoModal.isSystemError}
        onClose={() => {
          setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
          if (cdaContinuarResolveRef.current) {
            cdaContinuarResolveRef.current();
            cdaContinuarResolveRef.current = null;
          }
        }}
        onRetry={handleAfipLookup}
      />
    </>
  );
}
