import { toast } from "sonner";

export const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const getMimeType = (filename) => {
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

export const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const detectMimeTypeFromBase64 = (base64Str) => {
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

    toast.success(
      mode === "download"
        ? `${fileLabel.charAt(0).toUpperCase() + fileLabel.slice(1)} descargado correctamente.`
        : `${fileLabel.charAt(0).toUpperCase() + fileLabel.slice(1)} listo.`,
      { id: toastId },
    );

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
