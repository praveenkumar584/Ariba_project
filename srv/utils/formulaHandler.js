class formulaHandler
{
    async processFormulas(workbook)
    {
        await this.calculateRegion(workbook);
        await this.calculateDaysAtGSP(workbook);
        await this.calculateUnitNegotiatedValue(workbook);
        await this.calculateGSPManager(workbook);
        await this.calculateRASCategoryL1(workbook);
        await this.calculateSupplierCountry(workbook);
        await this.calculateCountryOfOrigin(workbook);
        await this.calculateSupplierCurrency(workbook);
        await this.calculateFinalAmount(workbook);
        await this.calculatePurchaseSavingPercentage(workbook);
        await this.calculatePurchaseSavingMAD(workbook);
        await this.calculateApprovedCost(workbook);
        await this.calculateLandedCost(workbook);
    }
    async calculateRegion(workbook)
    {
        const worksheet = workbook.getWorksheet("1. MPBC");
        const calcSheet = workbook.getWorksheet("calc");
        const lookupValue = worksheet.getCell("I9").value;
        let lookupResult = "select country";
        for (let row = 24; row <= 59; row++)
        {
            const key = calcSheet.getCell(`B${row}`).value;
            const value = calcSheet.getCell(`C${row}`).value;
            if (String(key).trim() === String(lookupValue).trim())
            {
                lookupResult = value;
                break;
            }
        }
        worksheet.getCell("I6").value = {
            formula: 'IFERROR(VLOOKUP(I9,calc!B24:C59,2,FALSE),"select country")',
            result: lookupResult
        };
    }
    async calculateDaysAtGSP(workbook)
    {
        const worksheet = workbook.getWorksheet("1. MPBC");
        const startDate = worksheet.getCell("I4").value;
        const endDate = worksheet.getCell("I5").value;
        let result = "";
        if (startDate && endDate)
        {
            const start = new Date(startDate);
            const end = new Date(endDate);
            result = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        }
        worksheet.getCell("I7").value = {
            formula: 'IFERROR(IF(I5="","",IF(I4="","",I5-I4)),"")',
            result: result
        };
    }
    async calculateUnitNegotiatedValue(workbook)
    {
        const worksheet = workbook.getWorksheet("1. MPBC");
        const calcSheet = workbook.getWorksheet("calc");
        const lookupValue = worksheet.getCell("G66").value;
        let result = "";
        for (let row = 3; row <= 12; row++)
        {
            const key = calcSheet.getCell(`B${row}`).value;
            if (String(key).trim() === String(lookupValue).trim())
            {
                result = calcSheet.getCell(`I${row}`).value;
                break;
            }
        }
        worksheet.getCell("G67").value = {
            formula: 'IFERROR(VLOOKUP(G66,calc!B2:J12,8,FALSE),"")',
            result: result
        };
    }
    async calculateGSPManager(workbook)
    {
        const worksheet = workbook.getWorksheet("1. MPBC");
        const rasSheet = workbook.getWorksheet("4. RAS_IDs");
        const country = worksheet.getCell("I9").value;
        const commodity = worksheet.getCell("M8").value;
        let result = "check Com.code / country";
        for (let row = 2; row <= rasSheet.rowCount; row++)
        {
            const code = rasSheet.getCell(`C${row}`).value;
            if (String(code).trim() !== String(commodity).trim())
                continue;
            if (country === "India")
            {
                result = rasSheet.getCell(`K${row}`).value || "-";
            }
            else
            {
                console.log(`rasSheet.getCell(J${row}).value: ${rasSheet.getCell(`J${row}`).value}`);
                result = rasSheet.getCell(`J${row}`).value || "-";
            }
            break;
        }
        worksheet.getCell("M9").value = {
            formula: `IFERROR(IF(I9="India",IF(VLOOKUP($M$8,'4. RAS_IDs'!$C:$K,9,FALSE)="","-",
            VLOOKUP($M$8,'4. RAS_IDs'!$C:$K,9,FALSE)),IF(VLOOKUP($M$8,'4. RAS_IDs'!$C:$J,8,FALSE)="","-",
            VLOOKUP($M$8,'4. RAS_IDs'!$C:$J,8,FALSE))),"check Com.code / country")`,
            result: result
        };
    }
}
module.exports = new FormulaHandler();