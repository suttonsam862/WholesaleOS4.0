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
    imageUrl?: string | null;
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

const SIZE_KEYS = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'];

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

async function loadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 150;
        
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadLineItemImages(lineItems: ManufacturingPdfData['lineItems']): Promise<Map<number, string>> {
  const imageMap = new Map<number, string>();
  const promises = lineItems.map(async (item) => {
    if (item.imageUrl) {
      const compressed = await loadImage(item.imageUrl);
      if (compressed) {
        imageMap.set(item.id, compressed);
      }
    }
  });
  await Promise.all(promises);
  return imageMap;
}

export async function generateManufacturingPdf(data: ManufacturingPdfData): Promise<void> {
  const { manufacturing, order, organization, manufacturer, lineItems, pantoneColors } = data;
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = [25, 48, 91];
  const secondaryColor: [number, number, number] = [59, 130, 246];
  const accentColor: [number, number, number] = [16, 185, 129];
  const lightGray: [number, number, number] = [245, 245, 245];
  const mediumGray: [number, number, number] = [200, 200, 200];
  const darkGray: [number, number, number] = [100, 100, 100];
  const cardBgColor: [number, number, number] = [250, 250, 252];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  const [compressedLogo, lineItemImages] = await Promise.all([
    loadImage(logoPath),
    loadLineItemImages(lineItems),
  ]);

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('MANUFACTURING GUIDE', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(200, 220, 255);
  doc.text(`Job #M-${manufacturing.id}`, margin, 26);

  const statusText = STATUS_LABELS[manufacturing.status] || manufacturing.status;
  const priority = (order?.priority || manufacturing.priority || 'normal').toUpperCase();
  doc.setFontSize(10);
  doc.text(`Status: ${statusText}  |  Priority: ${priority}`, pageWidth - margin, 26, { align: 'right' });

  if (compressedLogo) {
    const logoSize = 22;
    doc.addImage(compressedLogo, 'JPEG', pageWidth - margin - logoSize, 6, logoSize, logoSize);
  }

  yPosition = 45;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...secondaryColor);
  doc.text('CUSTOMER INFORMATION', margin, yPosition);
  yPosition += 6;

  const customerBoxHeight = 38;
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(1.5);
  doc.setFillColor(...cardBgColor);
  doc.roundedRect(margin, yPosition, contentWidth, customerBoxHeight, 3, 3, 'FD');

  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  const orgName = organization?.name || 'Customer Name Not Available';
  doc.text(orgName, margin + 6, yPosition + 4);

  if (organization?.city || organization?.state) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    const location = [organization?.city, organization?.state].filter(Boolean).join(', ');
    doc.text(location, margin + 6, yPosition + 12);
  }

  const addressX = margin + contentWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text('SHIP TO:', addressX, yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  if (organization?.shippingAddress) {
    const addressLines = doc.splitTextToSize(organization.shippingAddress, contentWidth / 2 - 10);
    doc.text(addressLines, addressX, yPosition + 5);
  } else {
    doc.text('No shipping address provided', addressX, yPosition + 5);
  }

  yPosition += customerBoxHeight + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);

  const infoColWidth = contentWidth / 4;
  const infoData = [
    { label: 'Order Code', value: order?.orderCode || '—' },
    { label: 'Order Name', value: order?.orderName || '—' },
    { label: 'Est. Delivery', value: formatDate(order?.estDelivery) },
    { label: 'Est. Completion', value: formatDate(manufacturing.estCompletion) },
  ];

  infoData.forEach((item, idx) => {
    const x = margin + idx * infoColWidth;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text(item.label, x, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(item.value, x, yPosition + 5);
  });

  yPosition += 14;

  doc.setDrawColor(...mediumGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  if (lineItems.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.text(`LINE ITEMS (${lineItems.length})`, margin, yPosition);
    yPosition += 8;

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      
      const itemSizes = SIZE_KEYS.filter((key) => {
        const val = (item as any)[key];
        return val && val > 0;
      });
      
      const hasImage = lineItemImages.has(item.id);
      const imageSize = 25;
      const cardHeight = Math.max(itemSizes.length > 0 ? 45 : 35, hasImage ? imageSize + 12 : 35);

      if (yPosition + cardHeight > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFillColor(...lightGray);
      doc.setDrawColor(...mediumGray);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPosition, contentWidth, cardHeight, 2, 2, 'FD');

      let textStartX = margin + 6;

      if (hasImage) {
        const imageData = lineItemImages.get(item.id)!;
        doc.addImage(imageData, 'JPEG', margin + 4, yPosition + 4, imageSize, imageSize);
        textStartX = margin + imageSize + 10;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      const itemName = item.itemName || 'Unnamed Item';
      doc.text(itemName, textStartX, yPosition + 8);

      let labelY = yPosition + 14;

      if (item.variantName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Variant: ${item.variantName}`, textStartX, labelY);
        labelY += 5;
      }

      if (item.sku) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        doc.text(`SKU: ${item.sku}`, textStartX, labelY);
        labelY += 5;
      }

      if (item.descriptors && item.descriptors.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const descriptorText = item.descriptors.join(', ');
        const truncated = descriptorText.length > 60 ? descriptorText.substring(0, 57) + '...' : descriptorText;
        doc.text(truncated, textStartX, labelY);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accentColor);
      doc.text(`Total: ${item.totalQty || 0}`, pageWidth - margin - 25, yPosition + 8);

      if (itemSizes.length > 0) {
        const sizeTableY = yPosition + 22;
        const sizeTableX = textStartX;
        const cellWidth = 18;
        const cellHeight = 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(...primaryColor);

        itemSizes.forEach((sizeKey, idx) => {
          const x = sizeTableX + idx * cellWidth;
          doc.rect(x, sizeTableY, cellWidth, cellHeight / 2, 'F');
          doc.text(SIZE_LABELS[sizeKey], x + cellWidth / 2, sizeTableY + 3.5, { align: 'center' });
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.setFillColor(255, 255, 255);

        itemSizes.forEach((sizeKey, idx) => {
          const x = sizeTableX + idx * cellWidth;
          const val = (item as any)[sizeKey] || 0;
          doc.rect(x, sizeTableY + cellHeight / 2, cellWidth, cellHeight / 2, 'FD');
          doc.text(val.toString(), x + cellWidth / 2, sizeTableY + cellHeight - 1.5, { align: 'center' });
        });
      }

      yPosition += cardHeight + 5;
    }

    yPosition += 5;
  }

  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }

  if (pantoneColors.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.text('PANTONE COLOR REFERENCE', margin, yPosition);
    yPosition += 8;

    const swatchSize = 14;
    const colWidth = (contentWidth) / 3;
    let xPosition = margin;
    let rowCount = 0;

    pantoneColors.forEach((color) => {
      if (xPosition > pageWidth - margin - colWidth) {
        xPosition = margin;
        yPosition += 24;
        rowCount++;
      }

      if (rowCount > 4 && yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
        rowCount = 0;
      }

      const hexColor = color.hexValue || '#cccccc';
      const r = parseInt(hexColor.slice(1, 3), 16) || 200;
      const g = parseInt(hexColor.slice(3, 5), 16) || 200;
      const b = parseInt(hexColor.slice(5, 7), 16) || 200;

      doc.setFillColor(r, g, b);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.roundedRect(xPosition, yPosition - 4, swatchSize, swatchSize, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(color.pantoneCode, xPosition + swatchSize + 4, yPosition + 3);

      if (color.usageLocation) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(color.usageLocation, xPosition + swatchSize + 4, yPosition + 8);
      }

      xPosition += colWidth;
    });

    yPosition += 28;
  }

  if (yPosition > pageHeight - 70) {
    doc.addPage();
    yPosition = margin;
  }

  const hasNotes = manufacturing.productionNotes || manufacturing.specialInstructions;
  if (hasNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.text('PRODUCTION NOTES', margin, yPosition);
    yPosition += 8;

    if (manufacturing.productionNotes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(manufacturing.productionNotes, contentWidth);
      doc.text(noteLines, margin, yPosition);
      yPosition += noteLines.length * 4 + 6;
    }

    if (manufacturing.specialInstructions) {
      doc.setFillColor(255, 248, 220);
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(0.8);
      const instrLines = doc.splitTextToSize(manufacturing.specialInstructions, contentWidth - 12);
      const boxHeight = instrLines.length * 4 + 10;
      doc.roundedRect(margin, yPosition - 2, contentWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(180, 130, 0);
      doc.text('⚠ SPECIAL INSTRUCTIONS:', margin + 4, yPosition + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 70, 0);
      doc.text(instrLines, margin + 4, yPosition + 10);
      yPosition += boxHeight + 6;
    }
  }

  if (yPosition > pageHeight - 65) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFillColor(...lightGray);
  doc.setDrawColor(...mediumGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, contentWidth, 55, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('QUALITY CONTROL CHECKLIST', margin + 6, yPosition + 8);

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
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  let checkY = yPosition + 15;
  const checkCol1X = margin + 6;
  const checkCol2X = margin + contentWidth / 2;

  checklistItems.forEach((item, idx) => {
    const x = idx < 4 ? checkCol1X : checkCol2X;
    const y = idx < 4 ? checkY + idx * 9 : checkY + (idx - 4) * 9;

    doc.setDrawColor(...darkGray);
    doc.setLineWidth(0.5);
    doc.rect(x, y - 2.5, 4, 4, 'S');
    doc.text(item, x + 7, y);
  });

  yPosition += 62;

  if (manufacturing.qualityNotes) {
    if (yPosition > pageHeight - 25) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text('QC Notes:', margin, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const qcLines = doc.splitTextToSize(manufacturing.qualityNotes, contentWidth - 30);
    doc.text(qcLines, margin + 25, yPosition);
    yPosition += qcLines.length * 3.5 + 8;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const footerY = pageHeight - 10;
    doc.setDrawColor(...mediumGray);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);

    const generatedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    doc.text(`Generated: ${generatedDate}`, margin, footerY);
    doc.text(`Manufacturing Guide M-${manufacturing.id}  |  Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  const filename = `Manufacturing-Guide-M${manufacturing.id}${order?.orderCode ? `-${order.orderCode}` : ''}.pdf`;
  doc.save(filename);
}
