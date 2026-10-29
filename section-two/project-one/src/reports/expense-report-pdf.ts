import PDFDocument from 'pdfkit';
import type { ExpenseReport } from './reports.service.js';

const MARGIN = 50;
const ROW_HEIGHT = 18;
const CONTENT_WIDTH = 495;

const STATUS_LABELS: Record<string, string> = {
  exceeded: 'Exceeded',
  projected_to_exceed: 'On pace to exceed',
  near_limit: 'Near limit',
  on_track: 'On track',
};

export function renderExpenseReportPdf(
  report: ExpenseReport,
  period: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    writeReport(doc, report, period);
    doc.end();
  });
}

function writeReport(
  doc: PDFKit.PDFDocument,
  report: ExpenseReport,
  period: string,
): void {
  doc.font('Helvetica-Bold').fontSize(18).text('Expense report');
  doc.font('Helvetica').fontSize(10).text(`Period: ${period}`);
  doc.text(`Generated: ${report.generatedAt}`);

  heading(doc, 'Summary');
  doc
    .font('Helvetica')
    .fontSize(11)
    .text(`Total spent: ${money(report.summary.total)}`);
  doc.moveDown(0.5);
  table(
    doc,
    ['Category', 'Total'],
    report.summary.byCategory.map((row) => [
      row.categoryName,
      money(row.total),
    ]),
    [395, 100],
  );

  heading(doc, 'Budgets');
  const alerts = report.summary.analysis.budgetAlerts;
  if (alerts.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .text('No budgets were set for this period.');
  } else {
    table(
      doc,
      ['Budget', 'Status', 'Spent', 'Limit'],
      alerts.map((alert) => [
        alert.name,
        STATUS_LABELS[alert.status],
        money(alert.spent),
        money(alert.limit),
      ]),
      [165, 110, 110, 110],
    );
  }

  heading(doc, 'Suggestions');
  const suggestions = report.summary.analysis.suggestions;
  if (suggestions.length === 0) {
    doc.font('Helvetica').fontSize(10).text('Nothing to flag for this period.');
  }
  for (const suggestion of suggestions) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`• ${suggestion}`, { width: CONTENT_WIDTH });
  }

  heading(doc, 'Expenses');
  table(
    doc,
    ['Date', 'Title', 'Category', 'Payment', 'Amount'],
    report.expenses.map((row) => [
      row.date,
      row.title,
      row.category,
      row.paymentMethod,
      money(row.amount),
    ]),
    [80, 175, 110, 70, 60],
  );
}

function heading(doc: PDFKit.PDFDocument, title: string): void {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(13).text(title);
  doc.moveDown(0.3);
}

function table(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  widths: number[],
): void {
  writeRow(doc, headers, widths, true);
  for (const row of rows) {
    writeRow(doc, row, widths, false);
  }
}

function writeRow(
  doc: PDFKit.PDFDocument,
  cells: string[],
  widths: number[],
  bold: boolean,
): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + ROW_HEIGHT > bottom) {
    doc.addPage();
  }

  const y = doc.y;
  let x = doc.page.margins.left;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
  cells.forEach((cell, index) => {
    doc.text(cell, x + 4, y, {
      width: widths[index] - 8,
      height: ROW_HEIGHT,
      ellipsis: true,
      lineBreak: false,
    });
    x += widths[index];
  });
  doc.x = doc.page.margins.left;
  doc.y = y + ROW_HEIGHT;
}

function money(amount: number): string {
  return amount.toFixed(2);
}
