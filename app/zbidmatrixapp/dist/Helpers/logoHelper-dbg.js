sap.ui.define([], () => {
    "use strict";
    let logoRendered = false;
    return {
        shouldRenderLogo(r, c, mergeMap)
        {
            const row = 1;
            const col = XLSX.utils.decode_col("B");
            const key = `${r},${c}`;
            const isMergeStart = mergeMap[key];
            if (!logoRendered && r === row && c === col && (!mergeMap[key] || isMergeStart))
            {
                logoRendered = true;
                return true;
            }
            return false;
        },

        getLogoHTML()
        {
            return `<div style="width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
                    <img src="images/logo.png" 
                         style="width:180px;height:50px;object-fit:contain;" />
                </div>`;
        },
        reset()
        {
            logoRendered = false;
        }
    };
});