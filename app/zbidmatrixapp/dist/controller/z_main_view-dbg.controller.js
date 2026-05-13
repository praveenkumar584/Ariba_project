sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zbidmatrixapp/Helpers/previewHelper",
    "zbidmatrixapp/Helpers/contentFetchHelper",
    "zbidmatrixapp/Helpers/tabContentHelper",
    "zbidmatrixapp/Helpers/contentRenderHelper",
    "zbidmatrixapp/Helpers/inputValidationHelper",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
], (Controller, previewHelper, contentFetchHelper, tabContentHelper, contentRenderHelper, inputValidationHelper,MessageToast,BusyIndicator) => {
    "use strict";
    return Controller.extend("zbidmatrixapp.controller.z_main_view", {
        workbook: null,
        zoomLevel: 1,
        _eventId: null,

        onInit()
        {
            // nothing needed on init anymore
        },

        onLoadTemplate() {
            const inputField = this.byId("eventIdInput");
            const eventId = inputField.getValue().trim();
            const msgStrip = this.byId("msgStrip");
            const excelHTML = this.byId("_IDGenHTML");
            const downloadBtn = this.byId("downloadBtn");
            const docusignBtn = this.byId("docusignBtn");

            // Reset state
            msgStrip.setVisible(false);
            excelHTML.setVisible(false);
            downloadBtn.setEnabled(false);
            docusignBtn.setEnabled(false);

            // Clear previous excel data immediately
            const table = document.getElementById("excelTable");
            if (table) table.innerHTML = "";
            const tabBar = document.getElementById("sheetTabBar");
            if (tabBar) tabBar.innerHTML = "";

            // Step 1: format validation
            const validationResult = inputValidationHelper.validate(eventId);
            if (!validationResult.isValid) {
                msgStrip.setText(validationResult.message);
                msgStrip.setType("Error");
                msgStrip.setVisible(true);
                return;
            }

            // Step 2: fetch and render on same page
            BusyIndicator.show(0);
            this._eventId = eventId;

            contentFetchHelper.fetchBase64(eventId)
                .then(() => {
                    BusyIndicator.hide();
                    excelHTML.setVisible(true);
                    previewHelper.previewTemplate(this);
                    downloadBtn.setEnabled(true);
                    docusignBtn.setEnabled(true);
                })
                .catch((err) => {
                    BusyIndicator.hide();
                    downloadBtn.setEnabled(false);
                    docusignBtn.setEnabled(false);
                    if (err.code === "EVENT_NOT_FOUND")
                    {
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
            contentFetchHelper.fetchBase64(this._eventId)
                .then((base64) => {
                    const byteCharacters = atob(base64);
                    const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = this._eventId + ".xlsx";
                    a.click();
                    URL.revokeObjectURL(url);
                    MessageToast.show("File Downloaded Successfully!");
                    BusyIndicator.hide();
                })
                .catch(() => {
                    BusyIndicator.hide();
                    const msgStrip = this.byId("msgStrip");
                    msgStrip.setText("Download failed. Please try again.");
                    msgStrip.setType("Error");
                    msgStrip.setVisible(true);
                });
        },
        onSendToDocusign :function()
        {
            MessageToast.show("Send to Docusign successfully(test)");
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