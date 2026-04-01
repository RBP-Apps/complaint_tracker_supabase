// Utility to convert image files to base64 for PDF generation
// Run this once to get base64 strings, then update LOGO_BASE64 in LetterPDFDocument.jsx

export const convertImageToBase64 = async (imagePath) => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result); // This includes the data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Preload all logos and return them as an object
export const preloadAllLogos = async () => {
  const logos = {
    rbp: await convertImageToBase64('/RBP-Logo.jpg'),
    rotomag: await convertImageToBase64('/rotomag.png?v=3'),
    solex: await convertImageToBase64('/solex.png'),
    premier: await convertImageToBase64('/premier.png'),
  };

  return logos;
};

// Get logo based on company name
export const getLogoForCompany = (companyName, logos) => {
  if (!companyName) return null;

  const name = companyName.toLowerCase();

  if (name.includes('rpb') || name.includes('rpb')) {
    return logos.rbp;
  }
  if (name.includes('rotomag')) {
    return logos.rotomag;
  }
  if (name.includes('solex')) {
    return logos.solex;
  }
  if (name.includes('premier')) {
    return logos.premier;
  }

  return null;
};
