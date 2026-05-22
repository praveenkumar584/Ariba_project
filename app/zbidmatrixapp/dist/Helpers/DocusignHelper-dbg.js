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
            const aSigners =oController.getView().getModel("signerModel").getProperty("/signers");
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
                    }
                );
                if (!response.ok)
                {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
                const result = await response.json();
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
        }
    };
});