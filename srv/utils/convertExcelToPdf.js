const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
async function convertExcelToPdf(excelBase64)
{
    const excelBuffer = Buffer.from(excelBase64, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer);
    const doc = new PDFDocument({ margin: 30, size: 'A4'});
    const pdfChunks = [];
    doc.on('data', chunk => pdfChunks.push(chunk));
    workbook.eachSheet((worksheet, sheetId) => {
        if (sheetId > 1)
        {
            doc.addPage();
        }
        doc.fontSize(18).text(`Sheet: ${worksheet.name}`, { underline: true});
        doc.moveDown();
        worksheet.eachRow((row) => {
            const rowData = row.values.slice(1).map(cell =>
                cell !== null &&
                cell !== undefined ? String(cell) : '').join('   |   ');
            doc.fontSize(10).text(rowData);
        });
    });
    doc.end();
    const pdfBuffer = await new Promise((resolve) => {
        doc.on('end', () => {
            resolve(Buffer.concat(pdfChunks));
        });
    });
    return pdfBuffer.toString('base64');
}
module.exports = { convertExcelToPdf };