const ExcelJS = require('exceljs');
const targetSheet = '1. MPBC';
async function buildDocusignBuffer(rawBuffer)
{
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(rawBuffer);
  const worksheet = workbook.getWorksheet(targetSheet);
  if (!worksheet)
  {
    throw new Error('Worksheet not found');
  }
  workbook.worksheets.forEach((sheet) => {
    if (sheet.name !== targetSheet)
    {
      workbook.removeWorksheet(sheet.id);
    }
  });
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.paperSize = 3;
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 1;
  worksheet.pageSetup.printArea = undefined;
  worksheet.rowBreaks = [];
  worksheet.columnBreaks = [];
  worksheet.pageSetup.margins = {
    left: 0.2,
    right: 0.2,
    top: 0.2,
    bottom: 0.2,
    header: 0.1,
    footer: 0.1
  };
  const buffer = await workbook.xlsx.writeBuffer({
    useStyles: true,
    useSharedStrings: false
  });
  return buffer;
}
module.exports = { buildDocusignBuffer, targetSheet };