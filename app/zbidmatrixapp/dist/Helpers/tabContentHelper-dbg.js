sap.ui.define([], () => {
    "use strict";
    return {
        buildSingleTab(oController, sheetName)
        {
            const tabBar = document.getElementById("sheetTabBar");
            tabBar.innerHTML = "";
            const tab = document.createElement("div");
            tab.className = "sheet-tab active";
            tab.textContent = sheetName;
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
            tabBar.append(tab, controls);
        },

        zoom(oController, delta)
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

        resetZoom(oController)
        {
            oController.zoomLevel = 1;
            this.applyZoom(oController);
        },

        applyZoom(oController)
        {
            const table = document.getElementById("excelTable");
            table.style.transform = `scale(${oController.zoomLevel})`;
            table.style.transformOrigin = "top left";
        }
    };
});