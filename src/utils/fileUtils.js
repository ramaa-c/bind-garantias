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

export const procesarArchivo = async (
  fileObj,
  archivosBackend = [],
  mode = "view",
  fileLabel = "archivo",
) => {
  if (!fileObj) return;
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
      return;
    }

    let fileData = fileObj;
    if (!fileData.contenido && fileObj._backendId) {
      const fullFile = archivosBackend.find(
        (a) => a.socioarchivoid === fileObj._backendId,
      );
      if (fullFile && fullFile.contenido) {
        fileData = fullFile;
      }
    }

    if (!fileData.contenido) {
      toast.error(
        `El ${fileLabel} no posee contenido válido para descargar o visualizar.`,
      );
      return;
    }

    const toastId = toast.loading(
      mode === "download"
        ? `Preparando descarga de ${fileLabel}...`
        : `Preparando visualización de ${fileLabel}...`,
    );

    let mimeType = getMimeType(fileData.nombrearchivo);
    if (mimeType === "application/octet-stream" && fileData.contenido) {
      const detected = detectMimeTypeFromBase64(fileData.contenido);
      if (detected) {
        mimeType = detected;
      }
    }

    let fileName = fileData.nombrearchivo || "archivo";
    if (
      mimeType === "application/pdf" &&
      !String(fileName).toLowerCase().endsWith(".pdf")
    ) {
      fileName += ".pdf";
    } else if (
      mimeType === "image/png" &&
      !String(fileName).toLowerCase().endsWith(".png")
    ) {
      fileName += ".png";
    } else if (
      mimeType === "image/jpeg" &&
      !String(fileName).toLowerCase().endsWith(".jpg") &&
      !String(fileName).toLowerCase().endsWith(".jpeg")
    ) {
      fileName += ".jpg";
    }

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
    } else {
      window.open(url, "_blank");
    }
  } catch (error) {
    console.error("Error al procesar archivo:", error);
    toast.error(`Ocurrió un error al intentar procesar el ${fileLabel}.`);
  }
};

export const formatBase64Size = (base64Str) => {
  if (!base64Str) return "Disponible";
  const len = base64Str.length;
  const sizeInBytes = Math.floor((len * 3) / 4);
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  const sizeInKB = sizeInBytes / 1024;
  if (sizeInKB < 1024) return `${sizeInKB.toFixed(1)} KB`;
  const sizeInMB = sizeInKB / 1024;
  return `${sizeInMB.toFixed(1)} MB`;
};

// Generación de archivos ZIP utilizando JSZip
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

export const descargarArchivosEnZip = async (archivos, zipFileName = "documentos.zip") => {
  if (!archivos || archivos.length === 0) {
    toast.error("No hay archivos para descargar.");
    return;
  }

  const toastId = toast.loading("Generando archivo ZIP...");
  try {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const existingNames = new Set();

    archivos.forEach((file) => {
      if (file.contenido) {
        const uniqueName = resolveUniqueName(file.nombrearchivo || "archivo.pdf", existingNames);
        zip.file(uniqueName, file.contenido, { base64: true });
      }
    });

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
  } catch (error) {
    console.error("Error al generar ZIP:", error);
    toast.error("Error al generar el archivo ZIP. Por favor reintente.", { id: toastId });
  }
};

export const descargarLegajoCompletoZip = async (
  archivos,
  estructura,
  tipoDocumentoMap,
  zipFileName = "legajo_completo.zip"
) => {
  if (!archivos || archivos.length === 0) {
    toast.error("No hay archivos cargados para descargar.");
    return;
  }

  const toastId = toast.loading("Generando legajo completo ZIP...");
  try {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const folderNamesMap = {};

    archivos.forEach((file) => {
      if (!file.contenido) return;

      // Find the document title matching this archive's type
      const docConfig = estructura.find(
        (doc) => tipoDocumentoMap[doc.key] === file.tipodocumentoarchivoid
      );

      const folderName = docConfig ? docConfig.title : "Otros Documentos";
      const cleanFolderName = folderName.replace(/[\\/:*?"<>|]/g, "_");

      if (!folderNamesMap[cleanFolderName]) {
        folderNamesMap[cleanFolderName] = new Set();
      }

      const uniqueName = resolveUniqueName(
        file.nombrearchivo || "archivo.pdf",
        folderNamesMap[cleanFolderName]
      );

      zip.file(`${cleanFolderName}/${uniqueName}`, file.contenido, { base64: true });
    });

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
  } catch (error) {
    console.error("Error al generar legajo completo ZIP:", error);
    toast.error("Error al generar el legajo completo ZIP. Por favor reintente.", { id: toastId });
  }
};

