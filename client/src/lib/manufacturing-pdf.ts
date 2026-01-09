import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPath from '@assets/rich-habits-logo.png';

interface ManufacturingPdfData {
  manufacturing: {
    id: number;
    status: string;
    estCompletion?: string | null;
    actualCompletion?: string | null;
    trackingNumber?: string | null;
    productionNotes?: string | null;
    qualityNotes?: string | null;
    specialInstructions?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    priority?: string | null;
  };
  order?: {
    orderCode?: string | null;
    orderName?: string | null;
    estDelivery?: string | null;
    priority?: string | null;
  } | null;
  organization?: {
    name?: string | null;
    city?: string | null;
    state?: string | null;
    shippingAddress?: string | null;
    logoUrl?: string | null;
  } | null;
  manufacturer?: {
    name?: string | null;
  } | null;
  lineItems: Array<{
    id: number;
    orderLineItemId?: number | null;
    itemName?: string | null;
    variantName?: string | null;
    sku?: string | null;
    descriptors?: string[] | null;
    yxs?: number | null;
    ys?: number | null;
    ym?: number | null;
    yl?: number | null;
    xs?: number | null;
    s?: number | null;
    m?: number | null;
    l?: number | null;
    xl?: number | null;
    xxl?: number | null;
    xxxl?: number | null;
    xxxxl?: number | null;
    totalQty?: number | null;
  }>;
  pantoneColors: Array<{
    id: number;
    pantoneCode: string;
    pantoneName?: string | null;
    hexValue?: string | null;
    usageLocation?: string | null;
    usageNotes?: string | null;
  }>;
}

const SIZE_LABELS: Record<string, string> = {
  yxs: 'YXS',
  ys: 'YS',
  ym: 'YM',
  yl: 'YL',
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
  xxl: '2XL',
  xxxl: '3XL',
  xxxxl: '4XL',
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_admin_confirmation: 'Awaiting Admin Confirmation',
  confirmed_awaiting_manufacturing: 'Confirmed - Awaiting Manufacturing',
  cutting_sewing: 'Cutting & Sewing',
  printing: 'Printing',
  final_packing_press: 'Final Packing & Press',
  shipped: 'Shipped',
  complete: 'Complete',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export async function generateManufacturingPdf(data: ManufacturingPdfData): Promise<void> {
  const { manufacturing, order, organization, manufacturer, lineItems, pantoneColors } = data;
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = [25, 48, 91];
  const secondaryColor: [number, number, number] = [59, 130, 246];
  const lightGray: [number, number, number] = [245, 245, 245];
  const darkGray: [number, number, number] = [100, 100, 100];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = margin;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = logoPath;
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  let compressedLogo: string | null = null;
  if (img.complete && img.naturalWidth > 0) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxSize = 300;

    let width = img.width;
    let height = img.height;

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = width * ratio;
      height = height * ratio;
    }

    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(img, 0, 0, width, height);
    compressedLogo = canvas.toDataURL('image/jpeg', 0.7);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('MANUFACTURING GUIDE', margin, yPosition + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...secondaryColor);
  doc.text(`M-${manufacturing.id}`, margin, yPosition + 18);

  if (compressedLogo) {
    const maxLogoSize = 30;
    const aspectRatio = img.width / img.height;
    let logoWidth = maxLogoSize;
    let logoHeight = maxLogoSize;

    if (aspectRatio > 1) {
      logoHeight = maxLogoSize / aspectRatio;
    } else if (aspectRatio < 1) {
      logoWidth = maxLogoSize * aspectRatio;
    }

    doc.addImage(compressedLogo, 'JPEG', pageWidth - margin - logoWidth, yPosition, logoWidth, logoHeight);
  }

  yPosition += 28;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('ORDER SUMMARY', margin, yPosition);
  yPosition += 8;

  const summaryData = [
    ['Order Code:', order?.orderCode || '—', 'Status:', STATUS_LABELS[manufacturing.status] || manufacturing.status],
    ['Order Name:', order?.orderName || '—', 'Priority:', (order?.priority || manufacturing.priority || 'normal').toUpperCase()],
    ['Organization:', organization?.name || '—', 'Manufacturer:', manufacturer?.name || 'Not assigned'],
    ['Est. Delivery:', formatDate(order?.estDelivery), 'Est. Completion:', formatDate(manufacturing.estCompletion)],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const colWidth = (pageWidth - 2 * margin) / 4;
  summaryData.forEach((row) => {
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row[1], margin + 25, yPosition);

    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], margin + colWidth * 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row[3], margin + colWidth * 2 + 30, yPosition);

    yPosition += 6;
  });

  yPosition += 5;

  if (organization?.shippingAddress) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.text('Ship To:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const addressLines = doc.splitTextToSize(organization.shippingAddress, pageWidth - 2 * margin - 30);
    doc.text(addressLines, margin + 25, yPosition);
    yPosition += addressLines.length * 4 + 6;
  }

  yPosition += 8;

  if (lineItems.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('LINE ITEMS', margin, yPosition);
    yPosition += 6;

    const sizeKeys = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'];

    const hasAnySizeData = lineItems.some((item) =>
      sizeKeys.some((key) => (item as any)[key] && (item as any)[key] > 0)
    );

    if (hasAnySizeData) {
      const usedSizes = sizeKeys.filter((key) =>
        lineItems.some((item) => (item as any)[key] && (item as any)[key] > 0)
      );

      const tableHead = ['Item', ...usedSizes.map((k) => SIZE_LABELS[k]), 'Total'];
      const tableBody = lineItems.map((item) => {
        const itemDesc = [item.itemName, item.variantName, item.sku ? `(${item.sku})` : '']
          .filter(Boolean)
          .join(' - ');
        const sizes = usedSizes.map((key) => {
          const val = (item as any)[key];
          return val && val > 0 ? val.toString() : '-';
        });
        const total = item.totalQty?.toString() || '-';
        return [itemDesc || '—', ...sizes, total];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [tableHead],
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [60, 60, 60],
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 50 },
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      const tableBody = lineItems.map((item) => {
        const itemDesc = [item.itemName, item.variantName, item.sku ? `(${item.sku})` : '']
          .filter(Boolean)
          .join(' - ');
        const descriptors = item.descriptors?.join(', ') || '—';
        const total = item.totalQty?.toString() || '—';
        return [itemDesc || '—', descriptors, total];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Descriptors', 'Total Qty']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [60, 60, 60],
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 25 },
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }

  if (pantoneColors.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('PANTONE COLOR REFERENCE', margin, yPosition);
    yPosition += 8;

    const swatchSize = 12;
    const colWidth = (pageWidth - 2 * margin) / 3;
    let xPosition = margin;
    let rowCount = 0;

    pantoneColors.forEach((color, index) => {
      if (xPosition > pageWidth - margin - colWidth) {
        xPosition = margin;
        yPosition += 22;
        rowCount++;
      }

      if (rowCount > 5 && yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
        rowCount = 0;
      }

      const hexColor = color.hexValue || '#cccccc';
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      doc.setFillColor(r, g, b);
      doc.rect(xPosition, yPosition - 4, swatchSize, swatchSize, 'F');
      doc.setDrawColor(150, 150, 150);
      doc.rect(xPosition, yPosition - 4, swatchSize, swatchSize, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(color.pantoneCode, xPosition + swatchSize + 3, yPosition + 2);

      if (color.usageLocation) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(color.usageLocation, xPosition + swatchSize + 3, yPosition + 7);
      }

      xPosition += colWidth;
    });

    yPosition += 25;
  }

  if (yPosition > pageHeight - 70) {
    doc.addPage();
    yPosition = margin;
  }

  const hasNotes = manufacturing.productionNotes || manufacturing.specialInstructions;
  if (hasNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('PRODUCTION NOTES', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    if (manufacturing.productionNotes) {
      const noteLines = doc.splitTextToSize(manufacturing.productionNotes, pageWidth - 2 * margin);
      doc.text(noteLines, margin, yPosition);
      yPosition += noteLines.length * 4 + 6;
    }

    if (manufacturing.specialInstructions) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text('Special Instructions:', margin, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const instructionLines = doc.splitTextToSize(manufacturing.specialInstructions, pageWidth - 2 * margin);
      doc.text(instructionLines, margin, yPosition);
      yPosition += instructionLines.length * 4 + 8;
    }
  }

  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('QUALITY CONTROL CHECKLIST', margin, yPosition);
  yPosition += 8;

  const checklistItems = [
    'Verify all Pantone colors match specification',
    'Check sizing accuracy for all items',
    'Inspect print quality and placement',
    'Verify stitching and seam quality',
    'Confirm total quantities match order',
    'Package items according to specifications',
    'Final visual inspection complete',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  checklistItems.forEach((item) => {
    doc.rect(margin, yPosition - 3, 4, 4, 'S');
    doc.text(item, margin + 8, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  if (yPosition > pageHeight - 30) {
    doc.addPage();
    yPosition = margin;
  }

  if (manufacturing.qualityNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.text('QC Notes:', margin, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const qcLines = doc.splitTextToSize(manufacturing.qualityNotes, pageWidth - 2 * margin);
    doc.text(qcLines, margin, yPosition);
    yPosition += qcLines.length * 4 + 10;
  }

  const footerY = pageHeight - 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);

  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.text(`Generated: ${generatedDate}`, margin, footerY);
  doc.text(`Manufacturing Guide M-${manufacturing.id}`, pageWidth - margin, footerY, { align: 'right' });

  const filename = `Manufacturing-Guide-M${manufacturing.id}${order?.orderCode ? `-${order.orderCode}` : ''}.pdf`;
  doc.save(filename);
}
