sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zbidmatrixapp/Helpers/previewHelper",
    "zbidmatrixapp/Helpers/contentFetchHelper",
    "zbidmatrixapp/Helpers/tabContentHelper",
    "zbidmatrixapp/Helpers/contentRenderHelper",
    "zbidmatrixapp/Helpers/inputValidationHelper",
    "zbidmatrixapp/Helpers/DocusignHelper",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
], (Controller, previewHelper, contentFetchHelper, tabContentHelper, contentRenderHelper, inputValidationHelper, DocusignHelper, MessageToast, BusyIndicator) => {
    "use strict";
    return Controller.extend("zbidmatrixapp.controller.z_main_view", {
        workbook: null,
        zoomLevel: 1,
        _eventId: null,

        onInit()
        {
            DocusignHelper.loadInitialModels(this);
        },

        onLoadTemplate()
        {
            const inputField = this.byId("eventIdInput");
            const eventId = inputField.getValue().trim();
            const msgStrip = this.byId("msgStrip");
            const excelHTML = this.byId("_IDGenHTML");
            const downloadBtn = this.byId("downloadBtn");
            const docusignBtn = this.byId("docusignBtn");
            msgStrip.setVisible(false);
            excelHTML.setVisible(false);
            downloadBtn.setEnabled(false);
            docusignBtn.setEnabled(false);
            const table = document.getElementById("excelTable");
            if (table) table.innerHTML = "";
            const tabBar = document.getElementById("sheetTabBar");
            if (tabBar) tabBar.innerHTML = "";
            const validationResult = inputValidationHelper.validate(eventId);
            if (!validationResult.isValid)
            {
                msgStrip.setText(validationResult.message);
                msgStrip.setType("Error");
                msgStrip.setVisible(true);
                return;
            }
            BusyIndicator.show(0);
            this._eventId = eventId;
            contentFetchHelper.fetchBase64(eventId)
                .then((base64) => {
                    BusyIndicator.hide();
                    excelHTML.setVisible(true);
                    sap.ui.getCore().applyChanges();
                    this._base64Data = base64;
                    previewHelper.previewTemplate(this, base64);
                    downloadBtn.setEnabled(true);
                    docusignBtn.setEnabled(true);
                    this.byId("_IDGenButton3").setEnabled(true);
                })
                .catch((err) => {
                    BusyIndicator.hide();
                    downloadBtn.setEnabled(false);
                    docusignBtn.setEnabled(false);
                    this.byId("_IDGenButton3").setEnabled(false);
                    if (err.code === "EVENT_NOT_FOUND") {
                        msgStrip.setText("Event ID does not exist. Please check and try again.");
                    }
                    else
                    {
                        msgStrip.setText("Event ID does not exist.");
                    }
                    msgStrip.setType("Error");
                    msgStrip.setVisible(true);
                });
        },
        onDownload()
        {
            BusyIndicator.show(0);
            try
            {
                const base64 = this._base64Data;
                if (!base64)
                {
                    throw new Error("No file data available");
                }
                const byteCharacters = atob(base64);
                const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray],
                    {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = this._eventId + ".xlsx";
                a.click();
                URL.revokeObjectURL(url);
                MessageToast.show("File Downloaded Successfully!");
            }
            catch (err)
            {
                const msgStrip = this.byId("msgStrip");
                msgStrip.setText("Download failed. Please try again.");
                msgStrip.setType("Error");
                msgStrip.setVisible(true);
                console.error(err);
            }
            finally
            {
                BusyIndicator.hide();
            }
        },
        onOpenDocusignDialog: async function ()
        {
            await DocusignHelper.openDialog(this);
        },
        onCloseDocusignDialog: function ()
        {
            DocusignHelper.closeDialog(this);
        },

        onSignerSelectionChange: function (oEvent)
        {

            DocusignHelper.handleSignerSelection(this,oEvent);
        },
        onSendToDocusign: async function ()
        {
            await DocusignHelper.sendToDocusign(this);
        },
        onCheckStatus: async function () 
        {
            await DocusignHelper.downloadSignedPdf(this);
        },
        fetchBase64Data()
        {
            return contentFetchHelper.fetchBase64(this._eventId);
        },

        buildSingleTabView(sheetName)
        {
            tabContentHelper.buildSingleTab(this, sheetName);
        },

        renderSheetContent(sheetName)
        {
            contentRenderHelper.renderSheet(this, sheetName);
        }
    });
});