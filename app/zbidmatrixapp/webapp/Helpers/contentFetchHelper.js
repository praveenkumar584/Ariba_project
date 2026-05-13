sap.ui.define([], () => {
    "use strict";
    return {
        async fetchBase64(eventId) {
            const res = await fetch(
                `/odata/v4/api-service-consumption/getTemplateFile(eventId='${eventId}')`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                }
            );

            if (!res.ok) {
                if (res.status === 404) {
                    // Try to parse the error body for the OData error message
                    try {
                        const errData = await res.json();
                        const msg = errData?.error?.message;
                        if (msg?.includes("404")) {
                            const notFoundError = new Error("EVENT_NOT_FOUND");
                            notFoundError.code = "EVENT_NOT_FOUND";
                            throw notFoundError;
                        }
                    } catch (parseErr) {
                        if (parseErr.code === "EVENT_NOT_FOUND") throw parseErr;
                    }
                    const notFoundError = new Error("EVENT_NOT_FOUND");
                    notFoundError.code = "EVENT_NOT_FOUND";
                    throw notFoundError;
                }
                throw new Error("HTTP " + res.status);
            }

            const data = await res.json();
            const base64 = data.value ?? data;
            if (!base64) {
                throw new Error("Empty response");
            }
            return base64;
        }
    };
});