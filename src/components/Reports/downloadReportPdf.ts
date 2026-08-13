import { fetchAuthenticatedAsset } from '../../api/assetUrl';
import type { ReportRecord } from './reportTypes';

/**
 * Download report PDF — uses backend file when available, otherwise a local preview PDF.
 */

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPreviewPdf(title: string, lines: string[]): Blob {
  const encoder = new TextEncoder();

  const streamOps = ['BT', '/F1 16 Tf', '50 780 Td', `(${pdfEscape(title)}) Tj`, '/F1 11 Tf', '0 -30 Td'];
  lines.forEach((line, i) => {
    if (i > 0) streamOps.push('0 -18 Td');
    streamOps.push(`(${pdfEscape(line)}) Tj`);
  });
  streamOps.push('ET');
  const content = streamOps.join('\n');
  const contentLength = encoder.encode(content).length;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(encoder.encode(body).length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(body).length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    body += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([encoder.encode(body)], { type: 'application/pdf' });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadReportPdf(record: ReportRecord) {
  if (record.reportFileUrl) {
    const blobUrl = await fetchAuthenticatedAsset(record.reportFileUrl);
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    triggerBlobDownload(blob, record.reportName);
    return;
  }

  const blob = buildPreviewPdf('Midna Global - DMIT Report', [
    `Scan Id: ${record.scanId}`,
    `Client: ${record.details.name || '-'}`,
    `Age: ${record.details.age || '-'}    Gender: ${record.details.gender || '-'}`,
    `Phone: ${record.details.phone || '-'}`,
    `Plan: ${record.plan}`,
    `Generated: ${record.generatedAt}`,
    `Status: ${record.status}`,
    '',
    'This is a system-generated preview of the report package.',
  ]);
  triggerBlobDownload(blob, record.reportName);
}
