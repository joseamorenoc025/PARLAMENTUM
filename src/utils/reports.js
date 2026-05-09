import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateManagementReport = (data) => {
  const { month, year, sessions, oficios, laws, projects, chamberName } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text('REPORTE DE GESTIÓN LEGISLATIVA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(chamberName || 'Cámara Legislativa', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Periodo: ${month} ${year}`, pageWidth / 2, 35, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 40, pageWidth - 20, 40);

  // Resume Section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Ejecutivo', 20, 50);
  
  const summaryData = [
    ['Indicador', 'Cantidad'],
    ['Sesiones Realizadas', sessions.length.toString()],
    ['Oficios Tramitados', oficios.length.toString()],
    ['Leyes en Biblioteca', laws.length.toString()],
    ['Proyectos en curso', projects.length.toString()]
  ];

  autoTable(doc, {
    startY: 55,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillStyle: [79, 70, 229] }
  });

  // Sessions Detail
  let currentY = doc.lastAutoTable.finalY + 15;
  doc.text('Detalle de Sesiones', 20, currentY);
  
  const sessionsList = sessions.map(s => [
    s.fecha,
    s.tipo,
    s.numeroCorrelativo || 'N/A',
    s.motivo || 'Sin observaciones'
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Fecha', 'Tipo', 'Número', 'Asunto/Motivo']],
    body: sessionsList.length > 0 ? sessionsList : [['-', 'No hay sesiones registradas', '-', '-']],
    theme: 'grid'
  });

  // Footer / Signature
  const finalY = doc.lastAutoTable.finalY + 30;
  doc.line(pageWidth / 2 - 30, finalY, pageWidth / 2 + 30, finalY);
  doc.setFontSize(9);
  doc.text('Secretaría de Cámara', pageWidth / 2, finalY + 5, { align: 'center' });
  doc.text(new Date().toLocaleString(), pageWidth / 2, finalY + 10, { align: 'center' });

  doc.save(`Reporte_Gestion_${month}_${year}.pdf`);
};
