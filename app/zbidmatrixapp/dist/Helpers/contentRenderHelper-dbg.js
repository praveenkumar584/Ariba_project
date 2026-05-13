sap.ui.define([
    "zbidmatrixapp/Helpers/logoHelper",
    "zbidmatrixapp/Helpers/backgroundColourHelper"
], (logoHelper,backgroundColourHelper) => {
    "use strict";
    return {
        renderSheet(oController, sheetName)
        {
            logoHelper.reset();
            const ws = oController.workbook.Sheets[sheetName];
            const table = document.getElementById("excelTable");
            if (!ws)
            {
                table.innerHTML = "<tr><td>Empty sheet</td></tr>";
                return;
            }
            table.innerHTML = "";
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            const colWidths = ws['!cols'] || [];
            const rowHeights = ws['!rows'] || [];
            const merges = ws['!merges'] || [];
            const mergeMap = {};
            const mergeSkip = new Set();
            merges.forEach(m => {
                mergeMap[`${m.s.r},${m.s.c}`] = m;
                for (let r = m.s.r; r <= m.e.r; r++)
                {
                    for (let c = m.s.c; c <= m.e.c; c++)
                    {
                        if (r !== m.s.r || c !== m.s.c)
                        {
                            mergeSkip.add(`${r},${c}`);
                        }
                    }
                }
            });
            let html = '<colgroup><col style="width:42px"/>';
            for (let c = range.s.c; c <= range.e.c; c++)
            {
                const wch = colWidths[c]?.wch
                    ? Math.round(colWidths[c].wch * 7) + "px"
                    : "80px";

                html += `<col style="width:${wch}"/>`;
            }
            html += "</colgroup>";
            html += '<tr class="col-header"><td class="row-num"></td>';
            for (let c = range.s.c; c <= range.e.c; c++)
            {
                html += `<td>${XLSX.utils.encode_col(c)}</td>`;
            }
            html += "</tr>";
            for (let r = range.s.r; r <= range.e.r; r++)
            {
                const rowH = rowHeights[r]?.hpt
                    ? `height:${Math.round(rowHeights[r].hpt * 1.33)}px;`
                    : "height:22px;";
                html += `<tr style="${rowH}">`;
                html += `<td class="row-num">${r + 1}</td>`;
                for (let c = range.s.c; c <= range.e.c; c++)
                {
                    const key = `${r},${c}`;
                    if (mergeSkip.has(key)) continue;
                    let spanAttrs = "";
                    if (mergeMap[key])
                    {
                        const m = mergeMap[key];
                        const rs = m.e.r - m.s.r + 1;
                        const cs = m.e.c - m.s.c + 1;
                        if (rs > 1) spanAttrs += ` rowspan="${rs}"`;
                        if (cs > 1) spanAttrs += ` colspan="${cs}"`;
                    }
                    const cellAddr = XLSX.utils.encode_cell({ r, c });
                    const cell = ws[cellAddr];
                    let displayVal = "";
                    if (cell)
                    {
                        displayVal = cell.w !== undefined
                            ? cell.w
                            : (cell.v !== undefined ? String(cell.v) : "");
                    }
                    if (logoHelper.shouldRenderLogo(r, c, mergeMap))
                    {
                        displayVal = logoHelper.getLogoHTML();
                    }
                    let style = "";
                    if(r===1 && c===3)
                    {
                        style += "font-weight:bold;";
                    }
                    if (cell && cell.s)
                    {
                        const s = cell.s;
                        console.log(cell.s);
                        const bgColor = backgroundColourHelper.getBackgroundColor(s);
                        if (bgColor)
                        {
                            style += `background-color:${bgColor};`;
                        }
                        if (s.font)
                        {
                            if (s.font.bold) style += "font-weight:bold;";
                            if (s.font.italic) style += "font-style:italic;";
                            if (s.font.underline) style += "text-decoration:underline;";
                            if (s.font.strike) style += "text-decoration:line-through;";
                            if (s.font.sz) style += `font-size:${Math.round(s.font.sz * 0.75)}px;`;
                            if (s.font.color?.rgb)
                            {
                                style += `color:#${s.font.color.rgb};`;
                            }
                            if (s.font.name)
                            {
                                style += `font-family:'${s.font.name}', Calibri, Arial, sans-serif;`;
                            }
                        }
                        if (s.alignment)
                        {
                            const hMap = { center: "center", right: "right", left: "left", justify: "justify" };
                            const vMap = { top: "top", center: "middle", bottom: "bottom" };
                            if (s.alignment.horizontal)
                            {
                                style += `text-align:${hMap[s.alignment.horizontal] || "left"};`;
                            }
                            if (s.alignment.vertical)
                            {
                                style += `vertical-align:${vMap[s.alignment.vertical] || "middle"};`;
                            }
                            if (s.alignment.wrapText)
                            {
                                style += "white-space:normal;";
                            }
                        }
                    }
                    const isHTML = typeof displayVal === "string" && displayVal.includes("<");
                    const applyBorder = (r >= 1 && c >= 1) ? "border:1.75px solid black;" : "";
                    html += `<td${spanAttrs} style="${applyBorder}${style}" ${!isHTML ? `title="${displayVal}"` : ""}>${displayVal}</td>`;
                }
                html += "</tr>";
            }
            table.innerHTML = html;
            document.getElementById("excelTableContainer").scrollTo(0, 0);
        }
    };
});