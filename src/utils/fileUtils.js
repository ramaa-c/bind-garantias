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

export const procesarArchivo = async (
  fileObj,
  archivosBackend = [],
  mode = "view",
) => {
  if (!fileObj) return;
  try {
    if (fileObj instanceof File) {
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
        "El archivo no posee contenido válido para descargar o visualizar.",
      );
      return;
    }

    const toastId = toast.loading(
      mode === "download"
        ? "Preparando archivo..."
        : "Preparando visualización del archivo...",
    );

    const mimeType = getMimeType(fileData.nombrearchivo);
    const blob = base64ToBlob(fileData.contenido, mimeType);
    const url = URL.createObjectURL(blob);

    toast.success(
      mode === "download"
        ? "Archivo descargado correctamente."
        : "Archivo cargado correctamente.",
      { id: toastId },
    );

    if (mode === "download") {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileData.nombrearchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      window.open(url, "_blank");
    }
  } catch (error) {
    console.error("Error al procesar archivo:", error);
    toast.error("Ocurrió un error al intentar procesar el archivo.");
  }
};
