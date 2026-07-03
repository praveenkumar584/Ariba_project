sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast)
{
    "use strict";
    function cleanCellText(sText)
    {
        return String(sText || "").replace(/\u00A0/g, " ").replace(/[\u200B\uFEFF]/g, "").trim();
    }
    return {
        enableEditMode: function (oController)
        {
            oController.byId("_IDGenHBox2").setVisible(false);
            oController.byId("editActionContainer").setVisible(true);
            document.querySelectorAll(".editableCell").forEach(function (cell)
            {
                cell.contentEditable = "true";
                cell.classList.add("editMode");
            });
            MessageToast.show("Edit Mode Enabled");
        },

        fixEditChanges: function (oController)
        {
            const changes = [];
            document.querySelectorAll(".editableCell").forEach(function (cell)
            {
                changes.push({
                    cell: cell.dataset.cell,
                    value: cleanCellText(cell.innerText)
                });
                cell.contentEditable = "false";
                cell.classList.remove("editMode");
            });
            oController.byId("_IDGenHBox2").setVisible(true);
            oController.byId("editActionContainer").setVisible(false);
            oController.byId("consentCheck").setSelected(false);
            oController.byId("saveBtn").setEnabled(false);
            return changes;
        },

        disableEditMode: function (oController)
        {
            document.querySelectorAll(".editableCell").forEach(function (cell)
            {
                cell.contentEditable = "false";
                cell.classList.remove("editMode");
            });
            oController.byId("_IDGenHBox2").setVisible(true);
            oController.byId("editActionContainer").setVisible(false);
            oController.byId("consentCheck").setSelected(false);
            oController.byId("saveBtn").setEnabled(false);
            MessageToast.show("Edit Cancelled");
        },

        handleConsentSelection: function (oController, bSelected)
        {
            oController.byId("saveBtn").setEnabled(bSelected);
        },

        getEditedCells: function ()
        {
            const changes = [];
            document.querySelectorAll(".editableCell").forEach(function (cell)
            {
                changes.push({
                    cell: cell.dataset.cell,
                    value: cleanCellText(cell.innerText)
                });
            });
            return changes;
        },

        enableEditableCells: function ()
        {
            document.querySelectorAll(".editableCell").forEach(function (cell)
            {
                cell.contentEditable = "true";
                cell.classList.add("editMode");
            });
        },

        disableEditableCells: function ()
        {
            document.querySelectorAll(".editableCell").forEach(function (cell)
            {
                cell.contentEditable = "false";
                cell.classList.remove("editMode");
            });
        },

        handleConsentSelection: function (oController, bSelected)
        { 
            oController.byId("saveBtn").setEnabled(bSelected); 
        },
    };
});