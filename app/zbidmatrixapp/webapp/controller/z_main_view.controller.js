sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zbidmatrixapp/Helpers/previewHelper",
    "zbidmatrixapp/Helpers/contentFetchHelper",
    "zbidmatrixapp/Helpers/tabContentHelper",
    "zbidmatrixapp/Helpers/contentRenderHelper",
    "zbidmatrixapp/Helpers/inputValidationHelper",
    "zbidmatrixapp/Helpers/DocusignHelper",
    "zbidmatrixapp/Helpers/editFunctionHelper",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel"
], (Controller, previewHelper, contentFetchHelper, tabContentHelper, contentRenderHelper, inputValidationHelper, DocusignHelper, editFunctionHelper, MessageToast, BusyIndicator, JSONModel) => {
    "use strict";
    return Controller.extend("zbidmatrixapp.controller.z_main_view", {
        workbook: null,
        zoomLevel: 1,
        _eventId: null,

        onInit()
        {
            DocusignHelper.loadInitialModels(this);
            const oModel = new sap.ui.model.json.JSONModel({logo: sap.ui.require.toUrl("zbidmatrixapp/images/logo.png")});
            this.getView().setModel(oModel, "imageModel");
        },
        onLoadTemplate()
        {
            const inputField = this.byId("eventIdInput");
            const eventId = inputField.getValue().trim();
            const msgStrip = this.byId("msgStrip");
            const excelHTML = this.byId("_IDGenHTML");
            const downloadBtn = this.byId("downloadBtn");
            const docusignBtn = this.byId("docusignBtn");
            const editBtn = this.byId("editBtn");
            msgStrip.setVisible(false);
            excelHTML.setVisible(false);
            downloadBtn.setEnabled(false);
            docusignBtn.setEnabled(false);
            editBtn.setEnabled(false);
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
                .then(({ base64, downloadId, NoOfSuppliers}) => {
                    BusyIndicator.hide();
                    excelHTML.setVisible(true);
                    sap.ui.getCore().applyChanges();
                    this._downloadId = downloadId;
                    this._base64Data = base64;
                    this._NoOfSuppliers = NoOfSuppliers;
                    previewHelper.previewTemplate(this, base64);
                    editBtn.setEnabled(true);
                    downloadBtn.setEnabled(true);
                    docusignBtn.setEnabled(true);
                    this.byId("_IDGenButton3").setEnabled(true);
                })
                .catch((err) => {
                    BusyIndicator.hide();
                    editBtn.setEnabled(false);
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
            this.byId("_IDGenVBox2").setVisible(false);
        },
        async onDownload()
        {
            BusyIndicator.show(0);
            try
            {
                const response = await fetch(`/odata/v4/api-service-consumption/downloadTemplateFile`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ downloadId: this._downloadId })
                });
                if (!response.ok)
                {
                    throw new Error("HTTP " + response.status);
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Bid_Template_filled.xlsx";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
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

        buildTabs(oController, sheets)
        {
            console.log(tabContentHelper);
            tabContentHelper.buildTabs(oController, sheets);
        },

        renderSheetContent(sheetName)
        {
            contentRenderHelper.renderSheet(this, sheetName);
        },
        onEdit: function ()
        {
            editFunctionHelper.enableEditMode(this);
        },
        onConsentSelect: function (oEvent)
        { 
            editFunctionHelper.handleConsentSelection(this,oEvent.getParameter("selected"));
        },
        async onSave()
        {
            BusyIndicator.show(0);
            try
            {
                const changes = editFunctionHelper.fixEditChanges(this);
                if (!this._downloadId)
                {
                    throw new Error("No template loaded to save changes against.");
                }
                const response = await fetch("/odata/v4/api-service-consumption/updateWorkbook",
                {
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(
                    {
                        downloadId: this._downloadId,
                        changes: JSON.stringify(changes)
                    })
                });
                if (!response.ok)
                {
                    const errorText = await response.text();
                    throw new Error(errorText || ("HTTP " + response.status));
                }
                const result = await response.json();
                const base64 = result.value;
                if (base64)
                {
                    this._base64Data = base64;
                    previewHelper.previewTemplate(this, base64);
                }
                MessageToast.show("Changes saved. Download and DocuSign will now use the updated file.");
            }
            catch (err)
            {
                const msgStrip = this.byId("msgStrip");
                msgStrip.setText("Save failed. Please try again.");
                msgStrip.setType("Error");
                msgStrip.setVisible(true);
                console.error(err);
            }
            finally
            {
                BusyIndicator.hide();
            }
        },
        onCancel()
        {
            editFunctionHelper.disableEditMode(this);
            // previewHelper.previewTemplate(this, this._base64Data);
        }
    });
});