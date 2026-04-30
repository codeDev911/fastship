
    export function parseAddress(addressString: any) {
        const parts = addressString.split(",").map((p: any) => p.trim());

        const country = parts[parts.length - 1];
        const zipCode = parts[parts.length - 2];
        const state = parts[parts.length - 3];

        // find city dynamically
        let city = null;
        const cityPart = parts.find((p: any) => /city|town|district/i.test(p))?.split(" ")[0];
        if (cityPart) {
            city = cityPart.replace(/(city|town).*$/i, "").trim();
        }
        
        const address = parts.slice(0, 2).join(", ");
        
        return {
            address,
            city,
            state,
            zipCode
        };
    }