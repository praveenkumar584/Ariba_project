sap.ui.define([], () => {
    "use strict";
    return {
        validate(eventId) {
            if (!eventId || eventId.length === 0) {
                return { isValid: false, message: "Event ID cannot be empty." };
            }
            // Must start with 'Doc' followed by digits
            const pattern = /^Doc\d+$/;
            if (!pattern.test(eventId)) {
                return { isValid: false, message: "Invalid Event ID format. Expected format: Doc followed by digits (e.g. Doc123456)." };
            }
            return { isValid: true, message: "" };
        }
    };
});