sap.ui.define([
    "sap/ui/core/BusyIndicator"
], function (BusyIndicator)
{
    "use strict";
    return {
        buildTabs: function (oController, sheets)
        {
            const tabBar = document.getElementById("sheetTabBar");
            if (!tabBar)
            {
                console.error("sheetTabBar not found");
                return;
            }
            tabBar.innerHTML = "";
            const tabsContainer = document.createElement("div");
            tabsContainer.className = "sheet-tabs";
            sheets.forEach((sheetName, index) => {
                const tab = document.createElement("div");
                tab.className = index === 0 ? "sheet-tab active" : "sheet-tab";
                tab.textContent = sheetName;
                tab.onclick = () => {
                    document.querySelectorAll(".sheet-tab").forEach(t => t.classList.remove("active"));
                    tab.classList.add("active");
                    BusyIndicator.show(0);
                    requestAnimationFrame(() => {
                        oController.renderSheetContent(sheetName);
                        BusyIndicator.hide();
                    });
                };
                tabsContainer.appendChild(tab);
            });
            const controls = document.createElement("div");
            controls.className = "zoom-controls";
            const zoomOut = document.createElement("button");
            zoomOut.innerText = "−";
            zoomOut.onclick = () => this.zoom(oController, -0.1);
            const zoomIn = document.createElement("button");
            zoomIn.innerText = "+";
            zoomIn.onclick = () => this.zoom(oController, 0.1);
            const reset = document.createElement("button");
            reset.innerText = "Reset";
            reset.onclick = () => this.resetZoom(oController);
            controls.append(zoomOut, zoomIn, reset);
            tabBar.appendChild(tabsContainer);
            tabBar.appendChild(controls);
            if (sheets.length > 0)
            {

                BusyIndicator.show(0);
                requestAnimationFrame(() => {
                    oController.renderSheetContent(sheets[0]);
                    BusyIndicator.hide();

                });
            }
        },
        zoom: function (oController, delta)
        {

            oController.zoomLevel += delta;
            if (oController.zoomLevel < 0.1)
            {
                oController.zoomLevel = 0.1;
            }
            if (oController.zoomLevel > 2)
            {
                oController.zoomLevel = 2;
            }
            this.applyZoom(oController);
        },

        resetZoom: function (oController)
        {
            oController.zoomLevel = 1;
            this.applyZoom(oController);
        },
        applyZoom: function (oController)
        {
            const table = document.getElementById("excelTable");
            if (!table)
            {
                return;
            }
            table.style.transform = `scale(${oController.zoomLevel})`;
            table.style.transformOrigin = "top left";
        }
    };
});