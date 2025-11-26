import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quote, QuoteLineItem, Organization } from '@shared/schema';
import logoPath from '@assets/rich-habits-logo.png';

interface QuotePDFData {
  quote: Quote;
  lineItems: QuoteLineItem[];
  organization?: Organization;
}

export async function generateQuotePDF(data: QuotePDFData): Promise<void> {
  const { quote, lineItems, organization } = data;
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = [25, 48, 91]; // Navy blue
  const lightGray: [number, number, number] = [245, 245, 245];
  const darkGray: [number, number, number] = [100, 100, 100];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = margin;

  // Load and compress logo
  const img = new Image();
  img.src = logoPath;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // Create compressed version of logo (preserving aspect ratio)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const maxSize = 300; // Maximum dimension
  
  // Calculate new dimensions preserving aspect ratio
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
  const compressedLogo = canvas.toDataURL('image/jpeg', 0.7); // JPEG at 70% quality

  // Header Section
  // Add "QUOTE" title on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(...primaryColor);
  doc.text('QUOTE', margin, yPosition + 15);

  // Add compressed logo on right (preserving aspect ratio)
  const maxLogoSize = 35;
  const aspectRatio = img.width / img.height;
  let logoWidth = maxLogoSize;
  let logoHeight = maxLogoSize;
  
  if (aspectRatio > 1) {
    // Landscape: width > height
    logoHeight = maxLogoSize / aspectRatio;
  } else if (aspectRatio < 1) {
    // Portrait: height > width
    logoWidth = maxLogoSize * aspectRatio;
  }
  
  doc.addImage(compressedLogo, 'JPEG', pageWidth - margin - logoWidth, yPosition, logoWidth, logoHeight);

  yPosition += 25;

  // Company details on left
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Developing Habits LLC', margin, yPosition);
  yPosition += 5;
  doc.text('3101 Whitehall Rd', margin, yPosition);
  yPosition += 5;
  doc.text('Birmingham, AL 35209', margin, yPosition);

  yPosition += 15;

  // Customer & Quote Info Section (3 columns)
  const colWidth = (pageWidth - 2 * margin) / 3;
  const col1X = margin;
  const col2X = margin + colWidth;
  const col3X = margin + 2 * colWidth;

  const sectionStartY = yPosition;

  // BILL TO
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('BILL TO:', col1X, yPosition);
  
  let billToY = yPosition + 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  
  // Use quote's customer address if available, otherwise fall back to organization
  if (quote.customerAddress) {
    const addressLines = doc.splitTextToSize(quote.customerAddress, colWidth - 5);
    doc.text(addressLines, col1X, billToY);
  } else if (organization) {
    // Line 1: Organization name
    doc.text(organization.name || 'N/A', col1X, billToY);
    billToY += 4;
    
    // Line 2: City, State (if available)
    if (organization.city || organization.state) {
      const location = [organization.city, organization.state].filter(Boolean).join(', ');
      doc.text(location, col1X, billToY);
      billToY += 4;
    }
    
    // Line 3: Additional address info if available
    if (organization.shippingAddress) {
      const addressLines = doc.splitTextToSize(organization.shippingAddress, colWidth - 5);
      doc.text(addressLines[0], col1X, billToY);
    }
  } else {
    doc.text('N/A', col1X, billToY);
  }

  // SHIP TO
  let shipToY = sectionStartY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('SHIP TO:', col2X, sectionStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  // Use quote's customer shipping address if available, otherwise fall back to organization
  if (quote.customerShippingAddress) {
    const lines = doc.splitTextToSize(quote.customerShippingAddress, colWidth - 5);
    doc.text(lines, col2X, shipToY);
  } else if (organization?.shippingAddress) {
    const lines = doc.splitTextToSize(organization.shippingAddress, colWidth - 5);
    doc.text(lines, col2X, shipToY);
  } else {
    doc.text('Same as billing', col2X, shipToY);
  }

  // Quote Info - increased spacing to prevent overlap
  let quoteInfoY = sectionStartY;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('QUOTE #:', col3X, quoteInfoY);
  quoteInfoY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(quote.quoteCode || 'N/A', col3X + 25, quoteInfoY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('QUOTE DATE:', col3X, quoteInfoY);
  quoteInfoY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const quoteDate = quote.createdAt 
    ? new Date(quote.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'N/A';
  doc.text(quoteDate, col3X + 25, quoteInfoY - 5);

  if (quote.validUntil) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('VALID UNTIL:', col3X, quoteInfoY);
    quoteInfoY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const validUntil = new Date(quote.validUntil).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    doc.text(validUntil, col3X + 25, quoteInfoY - 5);
  }

  yPosition = Math.max(billToY, shipToY, quoteInfoY);
  yPosition += 10;

  // Line Items Table
  if (lineItems && lineItems.length > 0) {
    const tableData = lineItems.map((item) => {
      const description = item.itemName && item.description 
        ? `${item.itemName}\n${item.description}`
        : item.itemName || item.description || 'N/A';
      
      const qty = item.quantity?.toString() || '0';
      const unitPrice = `$${parseFloat(item.unitPrice || '0').toFixed(2)}`;
      const amount = `$${parseFloat(item.lineTotal || '0').toFixed(2)}`;

      return [qty, description, unitPrice, amount];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'AMOUNT']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Totals Section (right-aligned)
  const totalsX = pageWidth - margin - 60;
  const labelsX = totalsX - 40;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  // Subtotal
  doc.text('Subtotal:', labelsX, yPosition, { align: 'right' });
  doc.text(`$${parseFloat(quote.subtotal || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
  yPosition += 6;

  // Discount (if applicable)
  if (quote.discount && parseFloat(quote.discount) > 0) {
    doc.text('Discount:', labelsX, yPosition, { align: 'right' });
    doc.text(`-$${parseFloat(quote.discount || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
    yPosition += 6;
  }

  // Sales Tax
  const taxRatePercent = (parseFloat(quote.taxRate || '0') * 100).toFixed(2);
  doc.text(`Sales Tax (${taxRatePercent}%):`, labelsX, yPosition, { align: 'right' });
  doc.text(`$${parseFloat(quote.taxAmount || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
  yPosition += 8;

  // Total (bold and larger)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', labelsX, yPosition, { align: 'right' });
  doc.text(`$${parseFloat(quote.total || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });

  yPosition += 15;

  // Footer
  // Thank you message
  if (yPosition < pageHeight - 40) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text('Thank you for your business!', margin, yPosition);
    yPosition += 8;
  }

  // Terms & Conditions
  if (quote.termsAndConditions || quote.notes) {
    if (yPosition > pageHeight - 35) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('Terms & Conditions', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const termsText = quote.termsAndConditions || quote.notes || '';
    const lines = doc.splitTextToSize(termsText, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
  }

  // Save the PDF
  const filename = `Quote-${quote.quoteCode || 'document'}.pdf`;
  doc.save(filename);
}
