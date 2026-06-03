sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Fragment,JSONModel, MessageToast,MessageBox)
{
    "use strict";return {
        loadInitialModels: function (oController)
        {
            const oSignerModel = new JSONModel(sap.ui.require.toUrl("zbidmatrixapp/model/SignerModel.json"));
            oController.getView().setModel(oSignerModel,"signerModel");
            const oDialogModel = new JSONModel({
                signerEmail: "",
                signerName: "",
                isButtonEnabled: false
            });
            oController.getView().setModel(
                oDialogModel,
                "dialogModel"
            );
        },

        openDialog: async function (oController)
        {
            if (!oController._oDocusignDialog)
            {
                oController._oDocusignDialog = await Fragment.load({
                        id: oController.getView().getId(),
                        name: "zbidmatrixapp.view.fragments.DocusignDialog",
                        controller: oController
                    });
                oController.getView().addDependent(oController._oDocusignDialog);
            }
            oController._oDocusignDialog.open();
        },
        closeDialog: function (oController)
        {
            if (oController._oDocusignDialog)
            {
                oController._oDocusignDialog.close();
            }
        },
        handleSignerSelection: function (oController,oEvent)
        {
            const sSelectedEmail = oEvent.getSource().getSelectedKey();
            const aSigners = oController.getView().getModel("signerModel").getProperty("/signers");
            const oSelectedSigner = aSigners.find(signer => signer.email === sSelectedEmail);
            if (oSelectedSigner)
            {
                const oDialogModel = oController.getView().getModel("dialogModel");
                oDialogModel.setProperty("/signerEmail",oSelectedSigner.email);
                oDialogModel.setProperty("/signerName",oSelectedSigner.name);
            }
        },
        sendToDocusign: async function (oController)
        {
            try
            {
                const oDialogData = oController.getView().getModel("dialogModel").getData();
                if (!oDialogData.signerEmail)
                {
                    MessageBox.error("Please select signer email");
                    return;
                }
                sap.ui.core.BusyIndicator.show(0);
                const response = await fetch("/odata/v4/api-service-consumption/sendToDocusign",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            signerEmail: oDialogData.signerEmail,
                            signerName: oDialogData.signerName
                        })
                    });
                if (!response.ok)
                {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
                const result = await response.json();
                var envelopeId = result.value;
                oController.envelopeId = envelopeId;
                console.log("DocuSign Result:", result);
                sap.ui.core.BusyIndicator.hide();
                oController.getView().getModel("dialogModel").setProperty("/isButtonEnabled",false);
                MessageToast.show("Envelope Sent Successfully to Docusign!");
                this.closeDialog(oController);
            }
            catch (error)
            {
                sap.ui.core.BusyIndicator.hide();
                console.error(error);
                MessageBox.error(error.message || "DocuSign Failed");
            }
        },
        downloadSignedPdf:async function (oController)
        {
            try
            {
                const sEnvelopeId = oController.envelopeId;
                if (!sEnvelopeId)
                {
                    sap.m.MessageBox.error("No Envelope ID Found");
                    return;
                }
                sap.ui.core.BusyIndicator.show(0);
                const response =await fetch("/odata/v4/api-service-consumption/downloadSignedPdf",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                            "application/json"
                        },
                        body: JSON.stringify({ envelopeId:sEnvelopeId })
                    });
                const contentType = response.headers.get("Content-Type");
                if( contentType.includes( "application/json"))
                {
                    const result = await response.json();
                    const parsedResult = JSON.parse(result.value);
                    if (parsedResult.status ==="PENDING_SIGNATURE")
                    {
                        sap.m.MessageToast.show("Process is Not Completed - Waiting For Signature");
                        return;
                    }
                }
                sap.m.MessageToast.show("Signature Completed - Downloading PDF");
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL( blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `SIGNED_${sEnvelopeId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL( downloadUrl);
                sap.m.MessageToast.show("PDF Downloaded Successfully");
                oController.envelopeId = null;
                oController.getView().byId("_IDGenButton3").setEnabled(false);
            }
            catch (error)
            {
                console.error(error);
                sap.m.MessageBox.error( error.message);
            } 
            finally 
            {
                sap.ui.core.BusyIndicator.hide();
            }
        }
    };
});