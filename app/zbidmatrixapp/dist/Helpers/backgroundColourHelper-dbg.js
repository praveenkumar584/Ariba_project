sap.ui.define([], () => {
    "use strict";
    const themeColors = [
        "FFFFFF",
        "000000",
        "EEECE1",
        "1F497D",
        "4F81BD",
        "C0504D",
        "9BBB59",
        "8064A2",
        "4BACC6",
        "F79646"
    ];

    function applyTint(hex, tint = 0)
    {
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        if (tint < 0)
        {
            r = Math.round(r * (1 + tint));
            g = Math.round(g * (1 + tint));
            b = Math.round(b * (1 + tint));
        }
        else
        {
            r = Math.round(r + (255 - r) * tint);
            g = Math.round(g + (255 - g) * tint);
            b = Math.round(b + (255 - b) * tint);
        }
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        return ( r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0")).toUpperCase();
    }

    function getBackgroundColor(s)
    {
        if (s?.fgColor?.rgb && s.fgColor.rgb !== "FFFFFF00")
        {
            return `#${s.fgColor.rgb}`;
        }
        if (s?.fgColor?.theme !== undefined)
        {
            const base = themeColors[s.fgColor.theme] || "FFFFFF";
            return `#${applyTint(base, s.fgColor.tint || 0)}`;
        }
        return null;
    }
    return {
        getBackgroundColor
    };
});