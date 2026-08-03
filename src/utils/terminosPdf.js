// Carga diferida (mismo criterio que jszip en fileUtils.js): jsPDF no se
// suma al bundle principal, solo se descarga cuando alguien realmente
// confirma los Términos y Condiciones.
export const generarPdfConfirmacionTyC = async ({ textoTyC, email, fecha }) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginX = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginX * 2;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Términos y Condiciones — Bind Garantías", marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Aceptado por: ${email || "—"}`, marginX, y);
  y += 5;
  doc.text(`Fecha: ${fecha.toLocaleString("es-AR")}`, marginX, y);
  y += 10;

  const lineHeight = 5;
  const lineas = doc.splitTextToSize(textoTyC || "", maxWidth);
  lineas.forEach((linea) => {
    if (y + lineHeight > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
    doc.text(linea, marginX, y);
    y += lineHeight;
  });

  // "data:application/pdf;base64,XXXX..." -> nos quedamos solo con el base64
  return doc.output("datauristring").split(",")[1];
};
