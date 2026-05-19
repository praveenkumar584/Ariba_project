const ExcelJS = require('exceljs');
const fs = require('fs');
async function rebuildSignedExcel( originalExcelPath, outputExcelPath, signerData, envelopeId )
{
    const workbook = new ExcelJS.Workbook();
    const excelBuffer = Buffer.from(originalExcelBase64,'base64');
    await workbook.xlsx.load(excelBuffer);
    const sheet = workbook.getWorksheet( "1. MPBC" );
    sheet.getCell("B5").value = "Signed By : " + signerData.name;
    sheet.getCell("B6").value = "Email : " + signerData.email;
    sheet.getCell("B7").value = "Signed On : " + signerData.signedDateTime;
    sheet.getCell("B8").value = "Envelope ID : " + envelopeId;
    sheet.getCell("B9").value = "Status : COMPLETED";
    const finalBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(finalBuffer).toString('base64');
}
module.exports = { rebuildSignedExcel };