import { toast } from "sonner";

export const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const getMimeType = (filename) => {
  const ext = String(filename || "")
    .split(".")
    .pop()
    .toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "txt":
      return "text/plain";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
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

const detectMimeTypeFromBase64 = (base64Str) => {
  if (!base64Str || typeof base64Str !== "string") return null;
  const clean = base64Str.substring(0, 30);
  if (clean.startsWith("JVBERi")) {
    return "application/pdf";
  }
  if (clean.startsWith("iVBORw0KGgo")) {
    return "image/png";
  }
  if (clean.startsWith("/9j/")) {
    return "image/jpeg";
  }
  return null;
};

const obtenerExtensionPorMime = (mimeType) => {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "text/plain":
      return ".txt";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "application/vnd.ms-excel":
      return ".xls";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return ".xlsx";
    case "application/zip":
    case "application/x-zip-compressed":
      return ".zip";
    default:
      return "";
  }
};

export const asegurarExtension = (filename, contenidoBase64) => {
  let name = String(filename || "archivo").trim();

  // 1. Detectar MIME
  let mimeType = getMimeType(name);
  if (mimeType === "application/octet-stream" && contenidoBase64) {
    const detected = detectMimeTypeFromBase64(contenidoBase64);
    if (detected) {
      mimeType = detected;
    }
  }

  const extCorrecta = obtenerExtensionPorMime(mimeType);
  if (!extCorrecta) return name;

  if (name.toLowerCase().endsWith(extCorrecta)) {
    return name;
  }

  if (extCorrecta === ".jpg" && name.toLowerCase().endsWith(".jpeg")) {
    return name;
  }
  if (extCorrecta === ".jpeg" && name.toLowerCase().endsWith(".jpg")) {
    return name;
  }

  const extIndex = name.lastIndexOf(".");
  if (extIndex !== -1) {
    const extActual = name.substring(extIndex).toLowerCase();
    const extensionesReemplazables = [
      ".bin",
      ".octet-stream",
      ".tmp",
      ".download",
      ".unknown",
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".txt",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".zip",
    ];
    if (extensionesReemplazables.includes(extActual) || extActual.length <= 5) {
      name = name.substring(0, extIndex);
    }
  }

  return name + extCorrecta;
};

const INTERVALO_VENTANA_ABIERTA_MS = 5000;

const liberarAlCerrarVentana = (ventana, url) => {
  if (!ventana) return;
  const intervalo = setInterval(() => {
    if (!ventana.closed) return;
    clearInterval(intervalo);
    URL.revokeObjectURL(url);
  }, INTERVALO_VENTANA_ABIERTA_MS);
};

export const procesarArchivo = async (
  fileObj,
  obtenerContenido,
  mode = "view",
  fileLabel = "archivo",
) => {
  if (!fileObj) return false;
  let ventana = null;
  let toastId = null;
  try {
    if (fileObj instanceof File && !fileObj._uploaded && !fileObj._backendId) {
      const url = URL.createObjectURL(fileObj);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileObj.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        window.open(url, "_blank");
      }
      return true;
    }

    if (mode !== "download") ventana = window.open("", "_blank");

    toastId = toast.loading(
      mode === "download"
        ? `Preparando descarga de ${fileLabel}...`
        : `Preparando visualización de ${fileLabel}...`,
    );

    const archivoId = fileObj._backendId ?? fileObj.socioarchivoid;
    const fileData = archivoId ? await obtenerContenido(archivoId) : fileObj;

    if (!fileData?.contenido) {
      ventana?.close();
      toast.error(
        `El ${fileLabel} no posee contenido válido para descargar o visualizar.`,
        { id: toastId },
      );
      return false;
    }

    let mimeType = getMimeType(fileData.nombrearchivo);
    if (mimeType === "application/octet-stream" && fileData.contenido) {
      const detected = detectMimeTypeFromBase64(fileData.contenido);
      if (detected) {
        mimeType = detected;
      }
    }

    const fileName = asegurarExtension(
      fileData.nombrearchivo,
      fileData.contenido,
    );

    const blob = base64ToBlob(fileData.contenido, mimeType);
    const url = URL.createObjectURL(blob);

    toast.dismiss(toastId);

    if (mode === "download") {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else if (ventana) {
      ventana.location.href = url;
      liberarAlCerrarVentana(ventana, url);
    } else {
      liberarAlCerrarVentana(window.open(url, "_blank"), url);
    }
    return true;
  } catch (error) {
    console.error("Error al procesar archivo:", error);
    ventana?.close();
    toast.error(`Ocurrió un error al intentar procesar el ${fileLabel}.`, {
      id: toastId ?? undefined,
    });
    return false;
  }
};

export const TAMANIO_MAXIMO_ARCHIVO_MB = 50;
const TAMANIO_MAXIMO_ARCHIVO_BYTES = TAMANIO_MAXIMO_ARCHIVO_MB * 1024 * 1024;

export const validarTamanioArchivo = (file) => {
  if (file && file.size > TAMANIO_MAXIMO_ARCHIVO_BYTES) {
    toast.error(
      `El archivo "${file.name}" supera el tamaño máximo permitido (${TAMANIO_MAXIMO_ARCHIVO_MB} MB).`,
    );
    return false;
  }
  return true;
};

const MIME_POR_EXTENSION = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const MIMES_CONTENIDO_PERMITIDOS = new Set(Object.values(MIME_POR_EXTENSION));

export const FORMATOS_ARCHIVO = {
  documento: {
    extensiones: ["pdf", "jpg", "jpeg", "png"],
    accept: "application/pdf,image/jpeg,image/png",
    etiqueta: "PDF, JPG o PNG",
  },
  pdf: {
    extensiones: ["pdf"],
    accept: "application/pdf",
    etiqueta: "PDF",
  },
  imagen: {
    extensiones: ["jpg", "jpeg", "png"],
    accept: "image/jpeg,image/png",
    etiqueta: "JPG o PNG",
  },
};

export const validarTipoArchivo = (file, formato = FORMATOS_ARCHIVO.documento) => {
  if (!file) return true;
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  const extensionValida = formato.extensiones.includes(extension);
  const mimeValido = !file.type || file.type === MIME_POR_EXTENSION[extension];
  if (!extensionValida || !mimeValido) {
    toast.error(
      `El archivo "${file.name}" no tiene un formato permitido. Solo se aceptan archivos ${formato.etiqueta}.`,
    );
    return false;
  }
  return true;
};

export const validarArchivo = (file, formato = FORMATOS_ARCHIVO.documento) =>
  validarTipoArchivo(file, formato) && validarTamanioArchivo(file);

export const esContenidoArchivoPermitido = (base64Str) =>
  MIMES_CONTENIDO_PERMITIDOS.has(detectMimeTypeFromBase64(base64Str));

// Generación de archivos ZIP utilizando JSZip
const leerContenidoParaZip = async (file, obtenerContenido) => {
  const contenido = (await obtenerContenido(file.socioarchivoid))?.contenido;
  if (!contenido) {
    throw new Error(`El archivo "${file.nombrearchivo}" no tiene contenido.`);
  }
  return contenido;
};


const resolveUniqueName = (name, existingNames) => {
  if (!existingNames.has(name)) {
    existingNames.add(name);
    return name;
  }
  const extIndex = name.lastIndexOf(".");
  const base = extIndex !== -1 ? name.substring(0, extIndex) : name;
  const ext = extIndex !== -1 ? name.substring(extIndex) : "";
  let counter = 1;
  let newName = `${base} (${counter})${ext}`;
  while (existingNames.has(newName)) {
    counter++;
    newName = `${base} (${counter})${ext}`;
  }
  existingNames.add(newName);
  return newName;
};

export const descargarArchivosEnZip = async (
  archivos,
  obtenerContenido,
  zipFileName = "documentos.zip",
) => {
  if (!archivos || archivos.length === 0) {
    toast.error("No hay archivos para descargar.");
    return false;
  }

  const toastId = toast.loading("Generando archivo ZIP...");
  try {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const existingNames = new Set();

    for (const [indice, file] of archivos.entries()) {
      toast.loading(`Descargando archivos (${indice + 1}/${archivos.length})...`, { id: toastId });
      const contenido = await leerContenidoParaZip(file, obtenerContenido);
      const cleanName = asegurarExtension(file.nombrearchivo, contenido);
      const uniqueName = resolveUniqueName(cleanName, existingNames);
      zip.file(uniqueName, contenido, { base64: true });
    }

    toast.loading("Generando archivo ZIP...", { id: toastId });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast.success("ZIP descargado correctamente", { id: toastId });
    return true;
  } catch (error) {
    console.error("Error al generar ZIP:", error);
    toast.error("Error al generar el archivo ZIP. Por favor reintente.", {
      id: toastId,
    });
    return false;
  }
};

export const descargarLegajoCompletoZip = async (
  archivos,
  obtenerContenido,
  estructura,
  tipoDocumentoMap,
  zipFileName = "legajo_completo.zip",
) => {
  if (!archivos || archivos.length === 0) {
    toast.error("No hay archivos cargados para descargar.");
    return false;
  }

  const toastId = toast.loading("Generando legajo completo ZIP...");
  try {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const folderNamesMap = {};

    for (const [indice, file] of archivos.entries()) {
      toast.loading(`Descargando documentos (${indice + 1}/${archivos.length})...`, { id: toastId });
      const contenido = await leerContenidoParaZip(file, obtenerContenido);

      // Find the document title matching this archive's type
      const docConfig = estructura.find(
        (doc) => tipoDocumentoMap[doc.key] === file.tipodocumentoarchivoid,
      );

      const folderName = docConfig ? docConfig.title : "Otros Documentos";
      const cleanFolderName = folderName.replace(/[\\/:*?"<>|]/g, "_");

      if (!folderNamesMap[cleanFolderName]) {
        folderNamesMap[cleanFolderName] = new Set();
      }

      const cleanName = asegurarExtension(file.nombrearchivo, contenido);
      const uniqueName = resolveUniqueName(
        cleanName,
        folderNamesMap[cleanFolderName],
      );

      zip.file(`${cleanFolderName}/${uniqueName}`, contenido, {
        base64: true,
      });
    }

    toast.loading("Generando legajo completo ZIP...", { id: toastId });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast.success("Legajo completo descargado correctamente", { id: toastId });
    return true;
  } catch (error) {
    console.error("Error al generar legajo completo ZIP:", error);
    toast.error(
      "Error al generar el legajo completo ZIP. Por favor reintente.",
      { id: toastId },
    );
    return false;
  }
};
