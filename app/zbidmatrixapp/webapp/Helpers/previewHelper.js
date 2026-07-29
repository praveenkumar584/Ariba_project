sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
], (MessageToast,BusyIndicator) => {
    "use strict";
    return {
        async previewTemplate(oController, sBase64)
        {
            BusyIndicator.show(0);
            const oStrip = oController.byId("msgStrip");
            if (oStrip)
            {
                oStrip.setVisible(false);
            }
            try
            {
                
                oController.workbook = XLSX.read(sBase64, {
                    type: 'base64',
                    cellStyles: true,
                    cellFormula: true,
                    cellDates: true,
                    sheetStubs: true
                });

                const sheetNames = oController.workbook.SheetNames;
                const previewSheets=[];
                if(sheetNames.includes("1. MPBC"))
                {
                    previewSheets.push("1. MPBC");
                }
                const countOfSuppliers = oController._NoOfSuppliers || 0;
                for (let i = 1; i <= countOfSuppliers; i++)
                {
                    const sheetName = `Supp ${i} risk`;
                    if(sheetNames.includes(sheetName))
                    {
                        previewSheets.push(sheetName);
                    }
                }
                oController.buildTabs(oController, previewSheets);
                document.getElementById("excelPreviewWrapper").style.display = "block";
                MessageToast.show("Template loaded successfully!");
                BusyIndicator.hide();
            }
            catch (err)
            {
                BusyIndicator.hide();
                console.error(err);
                if (oStrip)
                {
                    oStrip.setText("Failed: " + err.message);
                    oStrip.setType("Error");
                    oStrip.setVisible(true);
                }
            }
        }
    };
});