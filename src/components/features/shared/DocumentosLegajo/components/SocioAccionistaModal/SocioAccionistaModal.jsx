import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FiCheckCircle, FiEdit2, FiMail, FiSmartphone, FiMapPin, FiMap } from "react-icons/fi";
import { toast } from "sonner";
import { Button, Modal, SelectSocio, InputSocioMasked, BuscadorCuit, CargaArchivos } from "../../../../../ui";
import { afipService } from "../../../../../../services/afipService";
import { sociosService } from "../../../../../../services/sociosService";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import { useProvincias } from "../../../../../../hooks/useCatalogos";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";
import styles from "./SocioAccionistaModal.module.css";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const getMimeType = (filename) => {
  const ext = String(filename || "").split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'txt': return 'text/plain';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return 'application/octet-stream';
  }
};

const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

const procesarArchivo = async (fileObj, archivosBackend = [], mode = 'view') => {
  if (!fileObj) return;
  try {
    if (fileObj instanceof File) {
      const url = URL.createObjectURL(fileObj);
      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileObj.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        window.open(url, '_blank');
      }
      return;
    }

    let fileData = fileObj;
    if (!fileData.contenido && fileObj._backendId) {
      const fullFile = archivosBackend.find((a) => a.socioarchivoid === fileObj._backendId);
      if (fullFile && fullFile.contenido) {
        fileData = fullFile;
      }
    }

    if (!fileData.contenido) {
      toast.error("El DNI no posee contenido válido para descargar o visualizar.");
      return;
    }

    const toastId = toast.loading(
      mode === 'download' 
        ? "Preparando DNI..." 
        : "Preparando visualización del DNI..."
    );

    const mimeType = getMimeType(fileData.nombrearchivo);
    const blob = base64ToBlob(fileData.contenido, mimeType);
    const url = URL.createObjectURL(blob);

    toast.success(
      mode === 'download' 
        ? "DNI descargado correctamente." 
        : "DNI cargado correctamente.", 
      { id: toastId }
    );

    if (mode === 'download') {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.nombrearchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error("Error al procesar archivo:", error);
    toast.error("Ocurrió un error al intentar procesar el DNI.");
  }
};

const DropzoneField = ({ file, title, subtitle, onChange, onRemove, onView, onDownload, fileKey, hasError }) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div className={styles.dropzoneWrapper}>
      <input
        type="file"
        id={`file-input-${fileKey}`}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) onChange(e.target.files[0]);
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
                size: file.size || "Cargado",
              }
            : null
        }
        onClick={() => document.getElementById(`file-input-${fileKey}`).click()}
        onRemove={onRemove}
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
          if (e.dataTransfer.files?.[0]) {
            onChange(e.dataTransfer.files[0]);
          }
        }}
      />
    </div>
  );
};

export function SocioAccionistaModal({ isOpen, onClose, onSuccess, socio, socioIdActivo, archivosBackend, accionistas = [], dniTerceros = {} }) {
  const [validando, setValidando] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [dniFrenteFile, setDniFrenteFile] = useState(null);
  const [dniDorsoFile, setDniDorsoFile] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const indexSocioEditado = socio
    ? accionistas.findIndex(
        (s) => s.cuit === socio.cuit || (socio.relacionId && s.relacionId === socio.relacionId)
      )
    : -1;

  const totalSinSocioActual = accionistas.reduce(
    (acc, s, idx) => (idx === indexSocioEditado ? acc : acc + Number(s.participacion || 0)),
    0
  );

  const maximoPermitido = 100 - totalSinSocioActual;
  
  // Dropzone Error States
  const [errorDniFrente, setErrorDniFrente] = useState(false);
  const [errorDniDorso, setErrorDniDorso] = useState(false);

  const [filesChanged, setFilesChanged] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, reset, setValue, watch, setError, clearErrors, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      participacion: "",
      email: "",
      celular: "",
      direccion: "",
      provinciaid: "",
      localidad: "",
    }
  });

  const cuitValue = watch("cuit");
  const nombreValue = watch("nombre");

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
  }, [cuitValue, clearErrors, errors.cuit]);

  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  useEffect(() => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    const nombreLimpio = normalizarTexto(nombreValue || socio?.nombre);

    if (isOpen && cuitLimpio.length === 11) {
      // Buscar primero en la memoria local (dniTerceros)
      const memoryFiles = dniTerceros?.[cuitLimpio];

      if (memoryFiles?.dniFrente) {
        setDniFrenteFile(memoryFiles.dniFrente);
        setErrorDniFrente(false);
      } else {
        // Fallback a archivosBackend (legajo de la empresa, por compatibilidad)
        const frente = archivosBackend?.find((a) => {
          if (a.tipodocumentoarchivoid !== 7) return false;
          const descNorm = normalizarTexto(a.descripcion);
          return (
            descNorm.includes(cuitLimpio) ||
            (nombreLimpio && descNorm.includes(nombreLimpio))
          );
        });

        if (frente) {
          setDniFrenteFile({
            name: frente.nombrearchivo,
            size: "Cargado",
            _uploaded: true,
            _backendId: frente.socioarchivoid,
            _tipodocumentoarchivoid: 7,
          });
          setErrorDniFrente(false);
        } else {
          setDniFrenteFile(null);
        }
      }

      if (memoryFiles?.dniDorso) {
        setDniDorsoFile(memoryFiles.dniDorso);
        setErrorDniDorso(false);
      } else {
        // Fallback a archivosBackend
        const dorso = archivosBackend?.find((a) => {
          if (a.tipodocumentoarchivoid !== 8) return false;
          const descNorm = normalizarTexto(a.descripcion);
          return (
            descNorm.includes(cuitLimpio) ||
            (nombreLimpio && descNorm.includes(nombreLimpio))
          );
        });

        if (dorso) {
          setDniDorsoFile({
            name: dorso.nombrearchivo,
            size: "Cargado",
            _uploaded: true,
            _backendId: dorso.socioarchivoid,
            _tipodocumentoarchivoid: 8,
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
  }, [isOpen, cuitValue, nombreValue, archivosBackend, dniTerceros, socio]);

  useEffect(() => {
    if (isOpen) {
      if (socio) {
        reset({
          cuit: socio.cuit,
          nombre: socio.nombre,
          participacion: socio.participacion,
          email: socio.email,
          celular: socio.telefono || "",
          direccion: socio.direccion || "",
          provinciaid: String(socio.provinciaid || ""),
          localidad: socio.localidad || "",
        });
        setAfipValidado(true);
      } else {
        reset({
          cuit: "",
          nombre: "",
          participacion: "",
          email: "",
          celular: "",
          direccion: "",
          provinciaid: "",
          localidad: "",
        });
        setAfipValidado(false);
      }
      setFilesChanged(false);
      setErrorDniFrente(false);
      setErrorDniDorso(false);
      setShowConfirm(false);
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
    try {
      const respSgr = await sociosService.obtenerSocios({ Cuit: cuitLimpio, page: 1, page_size: 10 });
      const socioSgrDb = Array.isArray(respSgr) ? respSgr[0] : respSgr?.items?.[0] || respSgr?.data?.[0];

      if (socioSgrDb) {
        setError("cuit", { type: "manual", message: "Esta empresa ya se encuentra en gestión por SGR+" });
        return;
      }

      const res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
      if (res && res.datosgenerales) {
        const dg = res.datosgenerales;
        const nombreSocio = dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Socio AFIP";
        setValue("nombre", nombreSocio, { shouldValidate: true, shouldDirty: true });
        
        if (dg.email || dg.emailfacturacion) {
          setValue("email", dg.email || dg.emailfacturacion, { shouldValidate: true, shouldDirty: true });
        }
        if (dg.telefono) {
          setValue("celular", dg.telefono, { shouldValidate: true, shouldDirty: true });
        }

        const dom = dg.domiciliofiscal || dg.domicilio;
        if (dom) {
          const addressVal = dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "") || "";
          if (addressVal) setValue("direccion", addressVal, { shouldValidate: true, shouldDirty: true });
          
          const locVal = dom.localidad || dom.localidadNombre || "";
          if (locVal) setValue("localidad", locVal, { shouldValidate: true, shouldDirty: true });
          
          const provNombre = (dom.descripcionprovincia || dom.provincia || "").toUpperCase();
          if (provNombre) {
            const match = opcionesProvincias.find(
              (p) =>
                p.label.toUpperCase() === provNombre ||
                provNombre.includes(p.label.toUpperCase()) ||
                p.label.toUpperCase().includes(provNombre)
            );
            if (match) {
              setValue("provinciaid", String(match.value), { shouldValidate: true, shouldDirty: true });
            }
          }
        }
        setAfipValidado(true);
      } else {
        toast.warning("CUIT no encontrado en AFIP", {
          description: "No se encontraron datos automáticos. Podés ingresarlos manualmente.",
        });
        setValue("nombre", "");
        setAfipValidado(true);
      }
    } catch (err) {
      console.error("Error validando CUIT en AFIP/SGR:", err);
      toast.warning("Servicio de AFIP no disponible", {
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
    
    let hasDropzoneErrors = false;
    if (!dniFrenteFile && !socio) {
      setErrorDniFrente(true);
      hasDropzoneErrors = true;
    }
    if (!dniDorsoFile && !socio) {
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

      if (socio?.relacionId) {
        const payloadRel = {
          ...socio?.relacion,
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

      if (dniFrenteFile instanceof File || dniDorsoFile instanceof File) {
        const uploadToastId = toast.loading("Subiendo documentos de identidad del accionista...");
        try {
          const archivosExistentes = await socioArchivoService.obtenerArchivos(socioIdActivo);
          if (dniFrenteFile instanceof File) {
            const existenteFrente = archivosExistentes?.find((a) => {
              if (a.tipodocumentoarchivoid !== 7) return false;
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
              if (a.tipodocumentoarchivoid !== 8) return false;
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
          toast.success("Documentos de identidad subidos correctamente.", { id: uploadToastId });
        } catch (uploadErr) {
          console.error("❌ [MODAL - ACCIONISTA] Error subiendo archivos de DNI:", uploadErr);
          toast.error("Error al subir los documentos de identidad.", { id: uploadToastId });
          throw uploadErr;
        }
      }

      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (error) {
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          setError(key, { type: "server", message: backendErrors[key] });
        });
        toast.error("Por favor, revisá los errores en el formulario.");
      } else {
        toast.error("Ocurrió un error inesperado al guardar los datos.");
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
        maxWidth="700px"
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
                <div className={styles.summaryTop}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryStatus}>
                      <FiCheckCircle size={11} /> Accionista validado con AFIP
                    </span>
                    <h2 className={styles.summaryName}>{watch("nombre") || "Accionista"}</h2>
                    <p className={styles.summaryCuit}>CUIT: {cuitValue}</p>
                    {!socio && (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={() => setAfipValidado(false)}
                        style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}
                      >
                        <FiEdit2 size={12} /> Cambiar CUIT
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.summaryDivider}></div>

                <div className={styles.summaryBottom}>
                  <div className={styles.labelColumn}>
                    <label
                      htmlFor="participacionSocioInput"
                      className={styles.percentageLabel}
                    >
                      Participación del socio
                    </label>
                    <span
                      className={`${styles.availableText} ${maximoPermitido === 0 ? styles.availableTextError : ""
                        }`}
                    >
                      {maximoPermitido > 0 ? `Máximo permitido: ${maximoPermitido}%` : "Cupo completo"}
                    </span>
                  </div>

                  <div
                    className={`${styles.customInputWrapper} ${
                      errors.participacion ? styles.wrapperError : ""
                    }`}
                  >
                    <Controller
                      name="participacion"
                      control={control}
                      rules={{
                        required: "Ingresá un porcentaje",
                        min: { value: 0.01, message: "Debe ser mayor a 0%" },
                        max: { value: maximoPermitido, message: `No puede superar el ${maximoPermitido}% máximo permitido.` },
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
                              setValue("participacion", val, { shouldValidate: true, shouldDirty: true });
                            }
                          }}
                        />
                      )}
                    />
                    <span className={styles.percentageSymbol}>%</span>
                  </div>

                  <div className={styles.errorContainer}>
                    {errors.participacion && (
                      <span className={styles.errorText}>{errors.participacion.message}</span>
                    )}
                  </div>
                </div>
              </div>

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
                  name="direccion"
                  control={control}
                  rules={{ required: "La dirección es obligatoria" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("direccion", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Dirección"
                      icon={<FiMapPin />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="provinciaid"
                  control={control}
                  rules={{ required: "La provincia es obligatoria" }}
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
                  name="localidad"
                  control={control}
                  rules={{ required: "La localidad es obligatoria" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("localidad", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Localidad"
                      icon={<FiMap />}
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
                  onRemove={() => { setDniFrenteFile(null); setFilesChanged(true); }}
                  onView={() => procesarArchivo(dniFrenteFile, archivosBackend, 'view')}
                  onDownload={() => procesarArchivo(dniFrenteFile, archivosBackend, 'download')}
                />
                <DropzoneField
                  file={dniDorsoFile}
                  title="DNI Dorso"
                  subtitle="Imagen clara y legible (Obligatorio)"
                  fileKey="dorso"
                  hasError={errorDniDorso}
                  onChange={(f) => { setDniDorsoFile(f); setFilesChanged(true); setErrorDniDorso(false); }}
                  onRemove={() => { setDniDorsoFile(null); setFilesChanged(true); }}
                  onView={() => procesarArchivo(dniDorsoFile, archivosBackend, 'view')}
                  onDownload={() => procesarArchivo(dniDorsoFile, archivosBackend, 'download')}
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
    </>
  );
}
