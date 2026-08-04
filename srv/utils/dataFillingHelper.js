//Header part 
function fillHeaderData(workbook,worksheet, headerData)
{
    worksheet.getCell('D4').value = headerData.title || '';
    worksheet.getCell('D8').value = headerData.owner.name || '';
    // worksheet.getCell('I9').value = headerData.regions[0].name || '';
    worksheet.getCell('I9').value = 'Brazil';
    //const lookupValue = worksheet.getCell('I9').value;
    const lookupValue = 'Brazil';
    const calcSheet = workbook.getWorksheet('calc');
    let lookupResult = "select country";
    for (let row = 24; row <= 59; row++)
    {
        const key = calcSheet.getCell(`B${row}`).value;
        const value = calcSheet.getCell(`C${row}`).value;

        if (String(key).trim() === String(lookupValue).trim() )
        {
            lookupResult = value;
            break;
        }
    }
    worksheet.getCell('I6').value = {
        formula:
            'IFERROR(VLOOKUP(I9,calc!B24:C59,2,FALSE),"select country")',
        result: lookupResult
    };
    worksheet.getCell('D28').value = headerData.baselineSpend.currency || '';
    worksheet.getCell('G74').value ='/sn1/';
}

//Suppliers part
function fillSupplierData(worksheet, suppliers)
{
    const supplierCols = ['G', 'K', 'O' , 'W','AA','AE','AI','AM','AQ','AU'];
    suppliers.forEach((item, index) => {
        if (index >= supplierCols.length)
        {
            return;
        }
        const col = supplierCols[index];
        const mainContact = item.mainContact || {};
        const organization = item.organization || {};
        const address = organization.address || {};
        worksheet.getCell(`${col}10`).value = organization.name || '';
        worksheet.getCell(`${col}13`).value = mainContact.name || '';
        worksheet.getCell(`${col}14`).value = address.phone || '';
        worksheet.getCell(`${col}15`).value = mainContact.emailAddress || '';
        worksheet.getCell(`${col}16`).value = item.invitationId || '';
        worksheet.getCell(`${col}19`).value = address.country || '';
        worksheet.getCell(`${col}22`).value = item.registrationStatus || '';
    });
}
function fillLineItemData(worksheet, lineItems,apiData,headerData)
{
    let startRow = 30;
    lineItems.forEach((item) => {
        const priceTerm = item.terms?.find( term => term.title === "Price");
        if (!priceTerm)
        {
            return;
        }
        const materialGroupTerm = item.terms?.find(term => term.fieldId === "MaterialGroup");
        const lineItemTitle = item.title || "";
        const materialGroup = materialGroupTerm?.value?.simpleValue || "";
        const description = `${lineItemTitle} - ${materialGroup}`;
        const quantityTerm = item.terms?.find(term => term.fieldId === "QUANTITY");
        const quantity = quantityTerm?.value?.quantityValue?.amount || "";
        const unitOfMeasure = quantityTerm?.value?.quantityValue?.unitOfMeasureName || "";
        worksheet.getCell(`C${startRow}`).value = description;
        worksheet.getCell(`F${startRow}`).value = quantity;
        worksheet.getCell(`E${startRow}`).value = unitOfMeasure;
        startRow++;
    });
}
module.exports = { fillHeaderData, fillSupplierData, fillLineItemData };