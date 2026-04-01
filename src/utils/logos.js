// Logo base64 data for PDF generation
// These are placeholder base64 strings - you'll need to replace them with actual logo data

export const LOGOS = {
    rbp: null, // Will be loaded dynamically
    rotomag: null,
    solex: null,
    premier: null,
};

// Cache for loaded logo data URLs
const logoCache = {};

// Load image as base64 data URL
export const loadLogoAsBase64 = async (logoPath, logoKey) => {
    if (logoCache[logoKey]) {
        return logoCache[logoKey];
    }

    try {
        const response = await fetch(logoPath);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                logoCache[logoKey] = reader.result;
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Error loading logo ${logoKey}:`, error);
        return null;
    }
};

// Preload all logos
export const preloadLogos = async () => {
    const logoPaths = {
        rbp: '/RBP-Logo.jpg',
        rotomag: '/rotomag.png?v=3',
        solex: '/solex.png',
        premier: '/premier.png',
    };

    const loadPromises = Object.entries(logoPaths).map(async ([key, path]) => {
        const base64 = await loadLogoAsBase64(path, key);
        LOGOS[key] = base64;
        return { key, base64 };
    });

    await Promise.all(loadPromises);
    return LOGOS;
};

// Get logo source based on company name
export const getLogoForCompany = (companyName) => {
    if (!companyName) return null;
    
    const name = companyName.toLowerCase();
    
    if (name.includes('rpb') || name.includes('rpb')) {
        return LOGOS.rbp;
    }
    if (name.includes('rotomag')) {
        return LOGOS.rotomag;
    }
    if (name.includes('solex')) {
        return LOGOS.solex;
    }
    if (name.includes('premier')) {
        return LOGOS.premier;
    }
    
    return null;
};
