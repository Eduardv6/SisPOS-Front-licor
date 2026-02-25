import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exporta datos a un archivo Excel (.xlsx)
 * @param {Array} data - Lista de objetos a exportar
 * @param {string} fileName - Nombre del archivo
 */
export const exportToExcel = (data, fileName = "reporte-inventario") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exporta datos a un archivo PDF profesional
 * @param {Object} options - Opciones de configuración
 * @param {Array} options.columns - Cabeceras de la tabla
 * @param {Array} options.data - Filas de la tabla
 * @param {string} options.title - Título del reporte
 * @param {string} options.fileName - Nombre del archivo
 */
export const exportToPDF = ({
  columns,
  data,
  title = "Reporte de Inventario",
  fileName = "reporte-inventario",
}) => {
  const doc = jsPDF({ orientation: "portrait" });

  // Título
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(title, 14, 22);

  // Fecha de generación
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Date().toLocaleString("es-BO")}`, 14, 30);

  // Tabla
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: data,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillStyle: "f", fillColor: [14, 165, 233], textColor: 255 }, // Color primario
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 35 },
  });

  doc.save(`${fileName}.pdf`);
};
