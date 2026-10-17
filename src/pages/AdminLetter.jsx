import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Save, FileText, Mail, Globe, Phone, Trash2, SquarePlus, Download, X } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import DashboardLayout from "../components/DashboardLayout";
import LetterPDFDocument from "../components/LetterPDFDocument";
import supabase from "../utils/supabase";
import { sendEmailViaEmailJS } from "../utils/emailjsService";
import { formatDateDot, cleanTextDates } from "../utils/dateUtils";

const sendDirectMetaWhatsApp = async ({
    whatsappNumber,
    vendorName,
    letterNo,
    complaintId,
    beneficiaryName,
    pdfUrl,
    date
}) => {
    const token = import.meta.env.VITE_META_TOKEN || import.meta.env.Meta_Token;
    const phoneId = import.meta.env.VITE_META_PHONE_ID || import.meta.env.Meta_Phone_ID;

    if (!token || !phoneId) {
        console.warn("Meta credentials missing in frontend environment.");
        return { success: false, error: { message: "Missing Meta token/phone ID in .env" } };
    }

    let formattedPhone = whatsappNumber.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;

    const templateToUse = import.meta.env.VITE_LETTER_WHATSAPP_TEMPLATE || "vendor_letter_assigned";

    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "template",
                template: {
                    name: templateToUse,
                    language: { code: "en_US" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: vendorName || "Vendor" },
                                { type: "text", text: letterNo || "N/A" },
                                { type: "text", text: complaintId || "N/A" },
                                { type: "text", text: beneficiaryName || "N/A" },
                                { type: "text", text: date || "N/A" },
                                { type: "text", text: pdfUrl || "N/A" }
                            ]
                        }
                    ]
                }
            })
        });

        const result = await res.json();
        if (!res.ok) {
            return { success: false, error: result };
        }
        return { success: true, result };
    } catch (err) {
        return { success: false, error: err };
    }
};


const DEFAULT_COMPANY_PROFILES = [
    {
        name: "RBP ENERGY (INDIA) PVT. LTD.",
        aliases: ["RBP", "RBP ENERGY", "RBP ENERGY (INDIA) PVT LTD"],
        address: "303 Guru Ghasidas Plaza, Amapara, G.E Road, Raipur (C.G) 492001",
        location: "Raipur (C.G) - 492001",
        phone: "9200012500",
        email: "info@rbpindia.com",
        contact: "T : 9200012500 | Email : info@rbpindia.com | Website : www.rbpindia.com",
        forCompany: "वास्ते, RBP ENERGY (INDIA) PVT. LTD.",
        designation: "अधिकृत हस्ताक्षरकर्ता"
    },
    {
        name: "TANAY VIDHYUT (I) PVT. LTD.",
        aliases: ["TANAY", "TANAY VIDHYUT", "TANAY VIDHYUT (I) PVT LTD"],
        address: "P.S. City Colony, House No. 08, Changorabhata",
        location: "Raipur (C.G.) - 492013",
        phone: "+91 94255398289",
        email: "tanay.vidhyut@gmail.com",
        contact: "Phone No. +91 94255398289 Email : tanay.vidhyut@gmail.com",
        forCompany: "वास्ते, तनय विद्युत (ई०) प्रा.लि.",
        designation: "अधिकृत हस्ताक्षरकर्ता"
    },
    {
        name: "ROTOMAG MOTORS & CONTROLS PVT. LTD.",
        aliases: ["ROTOMAG", "ROTOMAG MOTORS", "ROTOMAG MOTORS & CONTROLS"],
        address: "Regd.Off. : 2102/3&4, GIDC Estate, Vitthal Udyognagar Gujarat-388 121, India",
        location: "Vitthal Udyognagar Gujarat-388 121",
        phone: "+91-2692-236005",
        email: "Mail@rotomag.com",
        contact: "Ph. : +91-2692-236005 | Email : Mail@rotomag.com | www.rotomag.com",
        forCompany: "वास्ते, ROTOMAG MOTORS & CONTROLS PVT. LTD.",
        designation: "अधिकृत हस्ताक्षरकर्ता"
    },
    {
        name: "SOLEX ENERGY LIMITED",
        aliases: ["SOLEX", "SOLEX ENERGY", "SOLEX ENERGY PVT LTD"],
        address: "Plot No: 131/A, Phase - 1, Nr. Krimy, H M Road, G. I. D. C, Vitthal Udyognagar - 388121, Dist: Anand (Gujarat)",
        location: "Vitthal Udyognagar - 388121",
        phone: "+91-2692-230317",
        email: "solexin14@gmail.com",
        contact: "Tel. : +91-2692-230317 | Email : solexin14@gmail.com",
        forCompany: "वास्ते, SOLEX ENERGY LIMITED",
        designation: "अधिकृत हस्ताक्षरकर्ता"
    },
    {
        name: "SURAJ ENTERPRISES",
        aliases: ["SURAJ", "SURAJ ENTERPRISE"],
        address: "Jayanti Nagar, Shri Ram Chowk, Sikola Bhata, Durg (C.G.) 491001",
        location: "Durg (C.G.) - 491001",
        phone: "88895-44440",
        email: "surajenterprise0587@gmail.com",
        contact: "Call: 88895-44440 | Email : surajenterprise0587@gmail.com",
        forCompany: "वास्ते, SURAJ ENTERPRISES",
        designation: "अधिकृत हस्ताक्षरकर्ता"
    },
    {
        name: "PREMIER ENERGIES LTD.",
        aliases: ["PREMIER", "PREMIER ENERGIES"],
        address: "Sy.No.54/Part, Above G.Pulla Reddy Sweets, Vikrampuri, Secunderabad-500009, Telangana",
        location: "Secunderabad-500009, Telangana",
        phone: "+91-40-27744415",
        email: "info@premierenergies.com",
        contact: "Tel: +91-40-27744415 | Email : info@premierenergies.com",
        forCompany: "वास्ते, PREMIER ENERGIES LTD.",
        designation: "अधिकृत हस्ताक्षरकर्ता"
    }
];

const getCompanyProfile = (rawName, customOptions = []) => {
    if (!rawName) return null;
    const clean = String(rawName).trim();
    if (!clean) return null;
    const lower = clean.toLowerCase();

    // 1. Try finding in customOptions exact match
    const customMatch = (customOptions || []).find(
        opt => opt?.name && opt.name.toLowerCase() === lower
    );
    if (customMatch && (customMatch.address || customMatch.email || customMatch.phone)) {
        return {
            name: customMatch.name,
            address: customMatch.address || "",
            location: customMatch.location || "",
            phone: customMatch.phone || "",
            email: customMatch.email || "",
            contact: customMatch.phone || customMatch.email
                ? `Phone No. ${customMatch.phone || ""} | Email : ${customMatch.email || ""}`
                : "",
            forCompany: `वास्ते, ${customMatch.name}`,
            designation: "अधिकृत हस्ताक्षरकर्ता"
        };
    }

    // 2. Try finding in DEFAULT_COMPANY_PROFILES by name or aliases
    for (const profile of DEFAULT_COMPANY_PROFILES) {
        if (profile.name.toLowerCase() === lower) return profile;
        if (profile.aliases && profile.aliases.some(a => a.toLowerCase() === lower || lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))) {
            return profile;
        }
    }

    if (customMatch) {
        return {
            name: customMatch.name,
            address: customMatch.address || "",
            location: customMatch.location || "",
            phone: customMatch.phone || "",
            email: customMatch.email || "",
            contact: "",
            forCompany: `वास्ते, ${customMatch.name}`,
            designation: "अधिकृत हस्ताक्षरकर्ता"
        };
    }

    return {
        name: clean,
        address: "",
        location: "",
        phone: "",
        email: "",
        contact: "",
        forCompany: `वास्ते, ${clean}`,
        designation: "अधिकृत हस्ताक्षरकर्ता"
    };
};

const AdminLetter = () => {
    const { complaintId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [taskData, setTaskData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPDF, setIsSavingPDF] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [companyOptions, setCompanyOptions] = useState(DEFAULT_COMPANY_PROFILES.map(p => ({
        name: p.name,
        address: p.address,
        email: p.email,
        phone: p.phone,
        location: p.location || ""
    })));

    const initialCompanyCandidate =
        location.state?.autoSelectCompany ||
        (location.state?.tasks && location.state.tasks[0]?.companyName) ||
        (location.state?.tasks && location.state.tasks[0]?.company) ||
        location.state?.task?.companyName ||
        location.state?.task?.company ||
        "";

    const initialProfile = getCompanyProfile(initialCompanyCandidate) || DEFAULT_COMPANY_PROFILES[1];

    const [selectedEmail, setSelectedEmail] = useState(location.state?.email || "");
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState(location.state?.whatsappNumber || "");
    const [emailAddress, setEmailAddress] = useState(location.state?.email || "");

    useEffect(() => {
        if (location.state?.whatsappNumber !== undefined) {
            setWhatsappNumber(location.state.whatsappNumber);
        }
        if (location.state?.email !== undefined) {
            setEmailAddress(location.state.email);
            setSelectedEmail(location.state.email);
        }
    }, [location.state]);

    const [rbpLogoBase64, setRbpLogoBase64] = useState(null);

    useEffect(() => {
        fetch("/RBP-Logo.PNG")
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setRbpLogoBase64(reader.result);
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => console.error("Error loading RBP logo base64:", err));
    }, []);

    // Header Content State
    const [headerInfo, setHeaderInfo] = useState({
        companyName: initialProfile.name,
        address: initialProfile.address,
        location: initialProfile.location || "",
        contact: initialProfile.contact || ""
    });

    // Letter Content State (Dynamic)
    const [letterInfo, setLetterInfo] = useState({
        letterNoLabel: "पत्र क्र.",
        letterNo: `SSY/2025/${Math.floor(Math.random() * 900) + 100}`,
        dateLabel: "दिनांक",
        date: formatDateDot(new Date()),
        recipientLabel: "प्रति,",
        officerName: "जिला प्रभारी,",
        department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
        districtOffice: "जिला कार्यालय, कोण्डागांव (छ०ग०)",
        subjectLabel: "विषय:-",
        subject: "जिला कोण्डागांव में सौर सुजला योजनांतर्गत स्थापित सिंचाई सोलर पंप के संबंध में ।",
        referenceLabel: "संदर्भ:-",
        reference: [
            "पत्र क्र. 2386/क्रेडा/जि.का./SSY/O&M/F-04/2024-25 कोण्डागांव, दिनांक 06.11.2025,",
            "जिला कार्यालय कोण्डागांव का पत्र क्रमांक / दिनांक 2067 / 26.09.2025, 2282 / 29.10.2025, 2112 / 29.09.2025 |"
        ],
        salutation: "महोदय,",
        introParagraph: "उपरोक्त विषयांतर्गत लेख है कि, जिला कोण्डागांव अंतर्गत हमारे द्वारा विभिन्न स्थलों में सोलर पंपों स्थापित किया गया है। जिसकी अकार्य शीलता की सूचना हमें आपके संदर्भित पत्र के माध्यम से प्राप्त हुआ। जिसका विवरण निम्नानुसार है-",
        closingParagraph: "उपरोक्त साईट के संयंत्र का सुधार कार्य हमारे द्वारा कर दिया गया है, तथा संयंत्र वर्तमान में कार्य शील है। इस पत्र के साथ साईट की संपुष्टि पत्र संलग्न है। पत्र आपकी ओर सादर सूचनार्थ हेतु प्रेषित।",
        thankYou: "सधन्यवाद !",
        regards: "भवदीय,",
        forCompany: "वास्ते, तनय विद्युत (ई०) प्रा.लि.",
        signerName: "अंजली यादव",
        designation: "अधिकृत हस्ताक्षरकर्ता",
        enclosureLabel: "संलग्न :-",
        enclosure: "हमारे पूर्व पत्र की छायाप्रति।",
        enclosures: ["हमारे पूर्व पत्र की छायाप्रति।"],
        copiesToLabel: "प्रतिलिपि:—",
        copiesTo: [
            "कार्यपालन अभियंता महोदय, (RE-05) क्रेडा प्रधान कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।",
            "कार्यपालन अभियंता महोदय,क्रेडा जोनल कार्यालय, जगदलपुर को सादर सूचनार्थ प्रेषित।"
        ]
    });

    // Dynamic Table State
    const [tableColumns, setTableColumns] = useState(["क्र.", "सौर समाधान क्र.", "आई. डी. नं.", "हितग्राही का नाम", "ग्राम/ विकासखण्ड", "दिनांक", "रिमार्क"]);
    const [tableData, setTableData] = useState([]);

    const applyCompanyProfile = (targetName) => {
        if (!targetName) return;
        const profile = getCompanyProfile(targetName, companyOptions);
        if (!profile) return;

        setHeaderInfo({
            companyName: profile.name,
            address: profile.address,
            location: profile.location || "",
            contact: profile.contact || (profile.phone ? `Phone No. ${profile.phone} | Email : ${profile.email}` : "")
        });

        if (profile.email) {
            setSelectedEmail(profile.email);
            setEmailAddress(profile.email);
        }

        setLetterInfo(prev => {
            const isRBP = (profile.name || "").toUpperCase().includes("RBP");
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const updatedLetterNo = (isRBP && (!prev.letterNo || prev.letterNo.startsWith("SSY/")))
                ? `RBP/SPVPP/SER/25-26/${randomNum}`
                : prev.letterNo;

            return {
                ...prev,
                letterNo: updatedLetterNo,
                forCompany: profile.forCompany || `वास्ते, ${profile.name}`,
                designation: profile.designation || prev.designation || "अधिकृत हस्ताक्षरकर्ता",
                signerName: prev.signerName || "अंजली यादव",
                companyDetails: {
                    phone: profile.phone,
                    email: profile.email,
                    address: profile.address
                }
            };
        });
    };

    useEffect(() => {
        const fetchTaskDetails = async () => {
            setLoading(true);
            try {
                // Scenario 1: Data passed via navigation state (Multi-row or Single task array)
                if (location.state?.tasks) {
                    const tasksArr = location.state.tasks;
                    const task = tasksArr[0]; // Use first task for some header defaults
                    setTaskData(task);

                    // Template Configuration
                    const siteNames = tasksArr.map(t => t.village || t.siteName || "-").join(", ");
                    const blockNames = Array.from(new Set(tasksArr.map(t => t.block).filter(Boolean))).join(" व ") || task.block || "-";
                    const district = task.district || "-";
                    const actualDate = formatDateDot(task.actualDate || task.complaintDate || new Date());
                    const randomNum = Math.floor(Math.random() * 900) + 100;
                    const companyToUse = location.state.autoSelectCompany || task.companyName || task.company || "RBP ENERGY (INDIA) PVT. LTD.";

                    let itemType = location.state.itemType || "";
                    if (!itemType && task.product) {
                        const prod = String(task.product).toLowerCase();
                        if (prod.includes("street light") || prod.includes("sl")) itemType = "Street Light";
                        else if (prod.includes("inverter")) itemType = "Inverter";
                        else if (prod.includes("battery")) itemType = "Battery";
                    }

                    let columns = ["क्र.", "सौर समाधान क्र.", "आई. डी. नं.", "हितग्राही का नाम", "ग्राम/ विकासखण्ड", "दिनांक", "रिमार्क"];
                    let templateData = [];

                    if (itemType === "Street Light") {
                        columns = ["क्र.", "ग्राम", "विकासखण्ड", "जिला", "सिस्टम रेटिंग", "प्रोजेक्ट", "स्ट्रीट लाइट रेटिंग", "स्थापना दिनांक", "खराब संख्या", "प्रतिस्थापित संख्या", "स्थिति"];
                        templateData = tasksArr.map((t, idx) => ({
                            "क्र.": (idx + 1).toString().padStart(2, '0') + ".",
                            "ग्राम": t.village || "-",
                            "विकासखण्ड": t.block || "-",
                            "जिला": t.district || "-",
                            "सिस्टम रेटिंग": t.product || "-",
                            "प्रोजेक्ट": "सौभाग्य",
                            "स्ट्रीट लाइट रेटिंग": "15W",
                            "स्थापना दिनांक": formatDateDot(t.complaintDate || t.actualDate || "-"),
                            "खराब संख्या": "1",
                            "प्रतिस्थापित संख्या": "1",
                            "स्थिति": "पूर्ण (CLOSED)"
                        }));
                        const totalReplacedQty = templateData.reduce((sum, row) => sum + (parseInt(row["प्रतिस्थापित संख्या"]) || 0), 0);

                        setTableColumns(columns);
                        setTableData(templateData);

                        setLetterInfo(prev => ({
                            ...prev,
                            letterNo: `RBP/SL/SER/25-26/${randomNum.toString().padStart(2, '0')}`,
                            date: formatDateDot(new Date()),
                            subject: `जिला ${district} के विकासखण्ड ${blockNames} के अंतर्गत विभिन्न ग्रामों में स्थापित स्ट्रीट लाइट के सुधार / संधारण कार्य के संबंध में।`,
                            reference: [`पत्र क्र. 1188/क्रेडा/O&M/${district}/2024-25/${task.block || "बैकुंठपुर"} दिनांक: ${actualDate}`],
                            officerName: "जिला प्रभारी,",
                            department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
                            districtOffice: district && district !== "-" ? `जिला कार्यालय, ${district} (छ०ग०)` : "जिला कार्यालय, छत्तीसगढ़",
                            salutation: "महोदय,",
                            introParagraph: `उपरोक्त विषयांतर्गत लेख है कि, जिला ${district} के विकासखण्ड ${blockNames} के अंतर्गत विभिन्न ग्रामों में स्थापित स्ट्रीट लाइट के सुधार / संधारण कार्य हेतु पत्र प्राप्त हुआ था। प्राप्त पत्र के साथ खराब सामग्रियों के विरुद्ध कुल ${totalReplacedQty} नग कार्यशील स्ट्रीट लाइट चालान क्र. 4716 दिनांक ${actualDate} के माध्यम से प्रतिस्थापन हेतु प्रेषित कर दिया गया है।`,
                            closingParagraph: "आपसे अनुरोध है कि कृपया अपने रिकॉर्ड में अद्यतन कर शिकायत पंजी में शिकायत बंद करने का कष्ट करें।",
                            thankYou: "सधन्यवाद !",
                            regards: "भवदीय,",
                            forCompany: `वास्ते, ${companyToUse}`,
                            designation: "अधिकृत हस्ताक्षरकर्ता",
                            copiesTo: [
                                "अधीक्षण अभियंता महोदय, क्रेडा जोनल कार्यालय, सरगुजा को सादर सूचनार्थ प्रेषित।",
                                "कार्यपालन अभियंता महोदय, क्रेडा संभागीय कार्यालय, सरगुजा को सादर सूचनार्थ प्रेषित।"
                            ],
                            note: "टीप: कृपया अपने रिकॉर्ड में अद्यतन कर शिकायत पंजी में शिकायत बंद करने का कष्ट करें।",
                            totalQty: totalReplacedQty,
                            rbpTableRows: templateData
                        }));

                    } else if (itemType === "Inverter") {
                        columns = ["क्र.", "साइट का नाम / ग्राम", "विकासखण्ड", "जिला", "सिस्टम रेटिंग", "स्थापना दिनांक", "शिकायत विवरण", "रिमार्क"];
                        templateData = tasksArr.map((t, idx) => ({
                            "क्र.": (idx + 1).toString().padStart(2, '0') + ".",
                            "साइट का नाम / ग्राम": t.village || "-",
                            "विकासखण्ड": t.block || "-",
                            "जिला": t.district || "-",
                            "सिस्टम रेटिंग": t.product || "-",
                            "स्थापना दिनांक": formatDateDot(t.complaintDate || t.actualDate || "-"),
                            "शिकायत विवरण": t.natureOfComplaint || "इन्वर्टर खराब",
                            "रिमार्क": "इन्वर्टर का सुधार कार्य पूर्ण। वर्तमान में संयंत्र संतोषप्रद रूप से कार्यशील है।"
                        }));

                        setTableColumns(columns);
                        setTableData(templateData);

                        setLetterInfo(prev => ({
                            ...prev,
                            letterNo: `RBP/SPVPP/SER/25-26/${randomNum}`,
                            date: formatDateDot(new Date()),
                            subject: `जिला ${district}, विकासखण्ड ${task.block || ""} के अंतर्गत ${siteNames} स्थलों में स्थापित सोलर पावर प्लांट के इन्वर्टर सुधार के संबंध में।`,
                            reference: [`पत्र क्र. 392/क्रेडा/SPVPP/2024-25/${district.toUpperCase()} दिनांक: ${actualDate}`],
                            officerName: "सहायक अभियंता महोदय,",
                            department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
                            districtOffice: district && district !== "-" ? `जिला कार्यालय, ${district} (छ०ग०)` : "जिला कार्यालय, छत्तीसगढ़",
                            salutation: "महोदय,",
                            introParagraph: `उपरोक्त विषयांतर्गत लेख है कि, संदर्भित इन्वर्टर शिकायतों के निराकरण हेतु सर्विस इंजीनियर द्वारा विकासखण्ड ${task.block || ""} अंतर्गत ${siteNames} स्थलों का निरीक्षण कर इन्वर्टर का सुधार कार्य पूर्ण कर दिया गया है। (सर्विस रिपोर्ट संदर्भ हेतु संलग्न है)। वर्तमान में संयंत्र संतोषप्रद रूप से कार्यशील है।`,
                            closingParagraph: "आपसे अनुरोध है कि कृपया अपने रिकॉर्ड में अद्यतन कर शिकायत पंजी में शिकायत बंद करने का कष्ट करें।",
                            thankYou: "सधन्यवाद !",
                            regards: "भवदीय,",
                            forCompany: `वास्ते, ${companyToUse}`,
                            designation: "अधिकृत हस्ताक्षरकर्ता",
                            copiesTo: [
                                "कार्यपालन अभियंता महोदय, क्रेडा जोनल कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।"
                            ],
                            note: "टीप: कृपया अपने रिकॉर्ड में अद्यतन कर शिकायत पंजी में शिकायत बंद करने का कष्ट करें।",
                            rbpTableRows: templateData
                        }));

                    } else if (itemType === "Battery") {
                        columns = ["क्र.", "साइट का नाम / ग्राम", "विकासखण्ड", "जिला", "सिस्टम रेटिंग", "स्थापना दिनांक", "शिकायत विवरण", "रिमार्क"];
                        templateData = tasksArr.map((t, idx) => ({
                            "क्र.": (idx + 1).toString().padStart(2, '0') + ".",
                            "साइट का नाम / ग्राम": t.village || "-",
                            "विकासखण्ड": t.block || "-",
                            "जिला": t.district || "-",
                            "सिस्टम रेटिंग": t.product || "-",
                            "स्थापना दिनांक": formatDateDot(t.complaintDate || t.actualDate || "-"),
                            "शिकायत विवरण": t.natureOfComplaint || "बैटरी खराब",
                            "रिमार्क": "खराब सेल प्रतिस्थापित कर सुधार कार्य पूर्ण। वर्तमान में संयंत्र संतोषप्रद रूप से कार्यशील है।"
                        }));

                        setTableColumns(columns);
                        setTableData(templateData);

                        setLetterInfo(prev => ({
                            ...prev,
                            letterNo: `RBP/SPVPP/SER/25-26/${randomNum}`,
                            date: formatDateDot(new Date()),
                            subject: `जिला ${district}, विकासखण्ड ${task.block || ""} के अंतर्गत ${siteNames} में स्थापित सोलर पावर प्लांट की बैटरी सुधार के संबंध में।`,
                            reference: [`पत्र क्र. 1245/J.K/2024-25/${district.toUpperCase()} दिनांक: ${actualDate}`],
                            officerName: "जिला प्रभारी,",
                            department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
                            districtOffice: district && district !== "-" ? `जिला कार्यालय, ${district} (छ०ग०)` : "जिला कार्यालय, छत्तीसगढ़",
                            salutation: "महोदय,",
                            introParagraph: `उपरोक्त विषयांतर्गत लेख है कि, जिला ${district}, विकासखण्ड ${task.block || ""} अंतर्गत ${siteNames} स्थल पर बैटरी की शिकायत के परिप्रेक्ष्य में सर्विस इंजीनियर द्वारा दिनांक ${actualDate} को स्थल का निरीक्षण कर खराब सेल के स्थान पर नए सेल प्रतिस्थापित कर दिए गए हैं। वर्तमान में संयंत्र संतोषप्रद रूप से कार्यशील है। (सर्विस रिपोर्ट अवलोकनार्थ संलग्न है)।`,
                            closingParagraph: "आपसे अनुरोध है कि कृपया अपने रिकॉर्ड में अद्यतन कर शिकायत पंजी में शिकायत बंद करने का कष्ट करें।",
                            thankYou: "सधन्यवाद !",
                            regards: "भवदीय,",
                            forCompany: `वास्ते, ${companyToUse}`,
                            designation: "अधिकृत हस्ताक्षरकर्ता",
                            copiesTo: [
                                "अधीक्षण अभियंता महोदय (RE-05), क्रेडा प्रधान कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।"
                            ],
                            note: "टीप: कृपया अपने रिकॉर्ड में अद्यतन कर शिकायत पंजी में शिकायत बंद करने का कष्ट करें।",
                            rbpTableRows: templateData
                        }));

                    } else {
                        // Standard Beneficiary Complaint / Solar Pump / Saur Sujla Letter
                        templateData = tasksArr.map((t, idx) => ({
                            "क्र.": (idx + 1).toString().padStart(2, '0') + ".",
                            "सौर समाधान क्र.": t.complaintId || "-",
                            "आई. डी. नं.": t.idNumber || "-",
                            "हितग्राही का नाम": t.beneficiaryName || "-",
                            "ग्राम/ विकासखण्ड": `${t.village || ""}/ ${t.block || ""}`,
                            "दिनांक": formatDateDot(t.actualDate || t.complaintDate || new Date()),
                            "रिमार्क": t.natureOfComplaint ? "संयंत्र सुधार उपरांत कार्यशील है।" : "संयंत्र कार्य शील हैं।"
                        }));

                        setTableColumns(columns);
                        setTableData(templateData);

                        const isRBPInitial = (companyToUse || "").toUpperCase().includes("RBP");
                        setLetterInfo(prev => ({
                            ...prev,
                            letterNo: isRBPInitial ? `RBP/SPVPP/SER/25-26/${randomNum}` : `SSY/2025/${randomNum}`,
                            date: formatDateDot(new Date()),
                            subject: district && district !== "-" ? `जिला ${district} में सौर सुजला योजनांतर्गत स्थापित सिंचाई सोलर पंप के संबंध में ।` : "सौर सुजला योजनांतर्गत स्थापित सिंचाई सोलर पंप के संबंध में ।",
                            reference: [
                                `पत्र क्र. 2386/क्रेडा/जि.का./SSY/O&M/F-04/2024-25 ${district && district !== "-" ? district : "क्रेडा"}, दिनांक ${actualDate},`,
                                `जिला कार्यालय ${district && district !== "-" ? district : ""} का संदर्भित पत्र क्रमांक / दिनांक |`
                            ],
                            officerName: "जिला प्रभारी,",
                            department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
                            districtOffice: district && district !== "-" ? `जिला कार्यालय, ${district} (छ०ग०)` : "जिला कार्यालय, छत्तीसगढ़",
                            salutation: "महोदय,",
                            introParagraph: district && district !== "-" ? `उपरोक्त विषयांतर्गत लेख है कि, जिला ${district} अंतर्गत हमारे द्वारा विभिन्न स्थलों में सोलर पंपों स्थापित किया गया है। जिसकी अकार्य शीलता की सूचना हमें आपके संदर्भित पत्र के माध्यम से प्राप्त हुआ। जिसका विवरण निम्नानुसार है-` : "उपरोक्त विषयांतर्गत लेख है कि, हमारे द्वारा विभिन्न स्थलों में सोलर पंपों स्थापित किया गया है। जिसकी अकार्य शीलता की सूचना हमें आपके संदर्भित पत्र के माध्यम से प्राप्त हुआ। जिसका विवरण निम्नानुसार है-",
                            closingParagraph: "उपरोक्त साईट के संयंत्र का सुधार कार्य हमारे द्वारा कर दिया गया है, तथा संयंत्र वर्तमान में कार्य शील है। इस पत्र के साथ साईट की संपुष्टि पत्र संलग्न है। पत्र आपकी ओर सादर सूचनार्थ हेतु प्रेषित।",
                            thankYou: "सधन्यवाद !",
                            regards: "भवदीय",
                            forCompany: `वास्ते, ${companyToUse}`,
                            designation: "अधिकृत हस्ताक्षरकर्ता",
                            copiesTo: [
                                "कार्यपालन अभियंता महोदय, (RE-05) क्रेडा प्रधान कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।",
                                "कार्यपालन अभियंता महोदय,क्रेडा जोनल कार्यालय को सादर सूचनार्थ प्रेषित।"
                            ],
                            rbpTableRows: templateData
                        }));
                    }

                    const targetComp = location.state.autoSelectCompany || task.companyName || task.company;
                    if (targetComp) {
                        applyCompanyProfile(targetComp);
                    }

                    setLoading(false);
                    return;
                }

                // Scenario 2: Legacy single task support
                if (location.state?.task) {
                    const task = location.state.task;
                    setTaskData(task);
                    setTableData([{
                        "क्र.": "01.",
                        "सौर समाधान क्र.": task.complaintId || "-",
                        "आई. डी. नं.": task.idNumber || "-",
                        "हितग्राही का नाम": task.beneficiaryName || "-",
                        "ग्राम/ विकासखण्ड": `${task.village || ""}/ ${task.block || ""}`,
                        "दिनांक": formatDateDot(task.actualDate || task.complaintDate || new Date()),
                        "रिमार्क": "संयंत्र कार्य शील हैं।"
                    }]);
                    if (task.district) {
                        setLetterInfo(prev => ({
                            ...prev,
                            districtOffice: `जिला कार्यालय, ${task.district} (छ०ग०)`,
                            introParagraph: prev.introParagraph.replace(/कोण्डागांव/g, task.district)
                        }));
                    }

                    const targetComp = location.state.autoSelectCompany || task.companyName || task.company;
                    if (targetComp) {
                        applyCompanyProfile(targetComp);
                    }

                    setLoading(false);
                    return;
                }

                // Scenario 2: Check if we have saved progress in localStorage
                const savedData = localStorage.getItem(`admin_letter_${complaintId}`);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    if (parsed.letterInfo) {
                        if (parsed.letterInfo.date) parsed.letterInfo.date = formatDateDot(parsed.letterInfo.date);
                        if (parsed.letterInfo.reference) {
                            parsed.letterInfo.reference = parsed.letterInfo.reference.map(r => cleanTextDates(r));
                        }
                    }
                    if (parsed.tableData) {
                        parsed.tableData = parsed.tableData.map(row => {
                            const newRow = { ...row };
                            Object.keys(newRow).forEach(k => {
                                if (typeof newRow[k] === 'string' && newRow[k].includes('T') && !isNaN(Date.parse(newRow[k]))) {
                                    newRow[k] = formatDateDot(newRow[k]);
                                }
                            });
                            return newRow;
                        });
                    }
                    setLetterInfo(prev => ({ ...prev, ...parsed.letterInfo }));
                    setHeaderInfo(prev => ({ ...prev, ...parsed.headerInfo }));
                    if (parsed.tableColumns) setTableColumns(parsed.tableColumns);
                    if (parsed.tableData) setTableData(parsed.tableData);
                    setLoading(false);
                    return;
                }

                // Scenario 3: Fallback - Fetch from Supabase FMS
                const { data: row, error: fmsError } = await supabase
                    .from("FMS")
                    .select("complaint_id, id_number, beneficiary_name, village, block, district, company_name, company, actual, actual1, planned, planned1")
                    .eq("complaint_id", complaintId)
                    .maybeSingle();

                if (row) {
                    const task = {
                        complaintId: row.complaint_id || "",
                        idNumber: row.id_number || "-",
                        beneficiaryName: row.beneficiary_name || "",
                        village: row.village || "",
                        block: row.block || "",
                        district: row.district || "",
                        companyName: row.company_name || row.company || "",
                        actualDate: formatDateDot(row.actual1 || row.actual || new Date())
                    };
                    setTaskData(task);

                    setTableData([{
                        "क्र.": "01.",
                        "सौर समाधान क्र.": task.complaintId || "-",
                        "आई. डी. नं.": task.idNumber || "-",
                        "हितग्राही का नाम": task.beneficiaryName || "-",
                        "ग्राम/ विकासखण्ड": `${task.village || ""}/ ${task.block || ""}`,
                        "दिनांक": formatDateDot(task.actualDate || new Date()),
                        "रिमार्क": "संयंत्र कार्य शील हैं."
                    }]);

                    if (task.district) {
                        setLetterInfo(prev => ({
                            ...prev,
                            districtOffice: `जिला कार्यालय, ${task.district} (छ०ग०)`,
                            introParagraph: prev.introParagraph.replace(/कोण्डागांव/g, task.district)
                        }));
                    }

                    const targetComp = location.state?.autoSelectCompany || task.companyName;
                    if (targetComp) {
                        applyCompanyProfile(targetComp);
                    }
                }
            } catch (error) {
                console.error("Error fetching task details from Supabase:", error);
            } finally {
                setLoading(false);
            }
        };

        if (complaintId) {
            fetchTaskDetails();
            fetchCompanyOptions();
        }
    }, [complaintId, location.state]);

    const fetchCompanyOptions = async () => {
        try {
            const { data: rows, error: masterError } = await supabase
                .from("Master")
                .select("company_name, company_name1, address, email_id, phone_no");

            const optionsMap = new Map();

            // First add default profiles
            DEFAULT_COMPANY_PROFILES.forEach(p => {
                optionsMap.set(p.name.toLowerCase(), {
                    name: p.name,
                    address: p.address,
                    email: p.email,
                    phone: p.phone,
                    location: p.location || ""
                });
            });

            // Then merge Master table rows
            if (rows && !masterError) {
                rows.forEach((row) => {
                    const rawName = row.company_name || row.company_name1;
                    if (rawName) {
                        const nameStr = String(rawName).trim();
                        const lower = nameStr.toLowerCase();
                        if (
                            nameStr === "Company Name1" ||
                            nameStr === "Company Name" ||
                            nameStr === "Company Name 1" ||
                            lower === "select"
                        ) {
                            return;
                        }

                        if (!optionsMap.has(lower)) {
                            optionsMap.set(lower, {
                                name: nameStr,
                                address: row.address || "",
                                email: row.email_id || "",
                                phone: row.phone_no || "",
                                location: ""
                            });
                        } else {
                            const existing = optionsMap.get(lower);
                            if (row.address && !existing.address) existing.address = row.address;
                            if (row.email_id && !existing.email) existing.email = row.email_id;
                            if (row.phone_no && !existing.phone) existing.phone = row.phone_no;
                        }
                    }
                });
            }

            const combinedOptions = Array.from(optionsMap.values());
            setCompanyOptions(combinedOptions);

            const targetCompany = location.state?.autoSelectCompany || 
                                  location.state?.task?.companyName || 
                                  (location.state?.tasks && location.state.tasks[0]?.companyName);
            if (targetCompany) {
                applyCompanyProfile(targetCompany);
            }
        } catch (error) {
            console.error("Error fetching company options from Supabase:", error);
            setCompanyOptions(DEFAULT_COMPANY_PROFILES.map(p => ({
                name: p.name,
                address: p.address,
                email: p.email,
                phone: p.phone,
                location: p.location || ""
            })));
        }
    };

    useEffect(() => {
        const candidate =
            location.state?.autoSelectCompany ||
            location.state?.task?.companyName ||
            (location.state?.tasks && location.state.tasks[0]?.companyName);

        if (candidate && headerInfo.companyName !== candidate) {
            applyCompanyProfile(candidate);
        }
    }, [location.state, companyOptions]);


    const addRow = () => {
        const newRow = {};
        tableColumns.forEach(col => {
            newRow[col] = "";
        });
        const lastRow = tableData[tableData.length - 1];
        if (lastRow && lastRow["क्र."]) {
            const lastNum = parseInt(lastRow["क्र."]);
            if (!isNaN(lastNum)) {
                newRow["क्र."] = (lastNum + 1).toString().padStart(2, '0') + ".";
            }
        } else {
            newRow["क्र."] = "01."; // If no rows or first row, start with 01.
        }
        setTableData([...tableData, newRow]);
    };

    const removeRow = (index) => {
        const newData = [...tableData];
        newData.splice(index, 1);
        setTableData(newData);
    };

    const handleTableEdit = (rowIndex, colName, value) => {
        const newData = [...tableData];
        newData[rowIndex][colName] = value;
        setTableData(newData);
    };

    const handleLetterEdit = (field, value) => {
        setLetterInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleHeaderEdit = (field, value) => {
        setHeaderInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        const dataToSave = {
            letterInfo,
            headerInfo,
            tableColumns,
            tableData
        };
        localStorage.setItem(`admin_letter_${complaintId}`, JSON.stringify(dataToSave));
        setTimeout(() => {
            setIsSaving(false);
            alert("Letter data saved successfully!");
        }, 500);
    };

    const handleSavePDF = async () => {
        setIsSavingPDF(true);

        try {
            // 🔥 STEP 1: Generate Hindi PDF component
            const PdfComponent = (
                <LetterPDFDocument
                    headerInfo={headerInfo}
                    letterInfo={letterInfo}
                    tableColumns={tableColumns}
                    tableData={tableData}
                    logoSrc={rbpLogoBase64}
                />
            );

            // 🔥 STEP 2: Generate PDF blob
            const pdfBlob = await pdf(PdfComponent).toBlob();

            // 🔥 STEP 3: Upload to Supabase Storage (vendor_tracker bucket)
            const fileName = `AdminLetter_${complaintId || Date.now()}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage
                .from("vendor_tracker")
                .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });

            if (uploadError) throw new Error("PDF upload failed: " + uploadError.message);

            const { data: urlData } = supabase.storage
                .from("vendor_tracker")
                .getPublicUrl(fileName);

            const pdfUrl = urlData.publicUrl;
            console.log("✅ PDF uploaded to Supabase Storage:", pdfUrl);

            const currentDate = new Date().toISOString().split('T')[0];
            const cleanEmail = (emailAddress || selectedEmail || "").trim();
            const cleanWhatsapp = (whatsappNumber || "").trim();

            // 🔥 STEP 4: Update FMS table in Supabase
            // (setting actual1 & planned1 so this letter immediately belongs in History)
            try {
                const updatePayload = {
                    pdf: pdfUrl,
                    company: headerInfo.companyName,
                    company_name: headerInfo.companyName,
                    email: cleanEmail || null,
                    actual1: currentDate,
                    planned1: taskData?.columnV || currentDate
                };
                if (cleanWhatsapp) {
                    updatePayload.assignee_whatsapp_number = cleanWhatsapp;
                }

                const { error: updateError } = await supabase
                    .from("FMS")
                    .update(updatePayload)
                    .eq("complaint_id", complaintId);

                if (updateError) {
                    console.warn("FMS update warning:", updateError.message);
                }

                // If multiple tasks/complaints were selected in letter, update all of them
                if (location.state?.tasks && location.state.tasks.length > 1) {
                    const extraIds = location.state.tasks.map(t => t.complaintId).filter(Boolean);
                    if (extraIds.length > 0) {
                        await supabase.from("FMS").update(updatePayload).in("complaint_id", extraIds);
                    }
                }
            } catch (updateErr) {
                console.warn("FMS save error:", updateErr);
            }

            // 🔥 STEP 5: Send WhatsApp Notification (Meta Cloud API)
            let waStatus = { attempted: false, success: false, note: "" };
            if (cleanWhatsapp) {
                waStatus.attempted = true;
                try {
                    console.log("[WhatsApp] Sending to:", cleanWhatsapp);
                    const { data: waData, error: waError } = await supabase.functions.invoke(
                        "send-whatsapp-vendor-letter",
                        {
                            body: {
                                whatsappNumber: cleanWhatsapp,
                                vendorName: headerInfo.companyName,
                                letterNo: letterInfo.letterNo,
                                complaintId: complaintId || taskData?.complaintId || "",
                                beneficiaryName: taskData?.beneficiaryName || "Beneficiary",
                                pdfUrl: pdfUrl,
                                date: letterInfo.date,
                                subject: letterInfo.subject
                            }
                        }
                    );

                    if (!waError && (waData?.success || waData?.result)) {
                        waStatus.success = true;
                        console.log("[WhatsApp] Sent via Edge Function:", waData);
                    } else {
                        console.warn("[WhatsApp] Edge function unready, using direct Meta API fallback...");
                        const directWa = await sendDirectMetaWhatsApp({
                            whatsappNumber: cleanWhatsapp,
                            vendorName: headerInfo.companyName,
                            letterNo: letterInfo.letterNo,
                            complaintId: complaintId || taskData?.complaintId || "",
                            beneficiaryName: taskData?.beneficiaryName || "Beneficiary",
                            pdfUrl: pdfUrl,
                            date: letterInfo.date
                        });
                        waStatus.success = directWa.success;
                        if (!directWa.success) {
                            waStatus.note = directWa.error?.message || "Meta template approval needed";
                        }
                    }
                } catch (waErr) {
                    console.warn("[WhatsApp] Send error:", waErr);
                    waStatus.note = waErr.message;
                }
            }

            // 🔥 STEP 6: Send Email Notification (EmailJS)
            let emailStatus = { attempted: false, success: false, note: "" };
            if (cleanEmail) {
                emailStatus.attempted = true;
                try {
                    console.log("[EmailJS] Sending to:", cleanEmail);
                    const emailResult = await sendEmailViaEmailJS({
                        to_email: cleanEmail,
                        to_name: headerInfo.companyName || "Vendor",
                        company_name: headerInfo.companyName,
                        letter_no: letterInfo.letterNo,
                        complaint_id: complaintId || taskData?.complaintId || "",
                        subject: letterInfo.subject,
                        pdf_url: pdfUrl,
                        date: letterInfo.date,
                        officer_name: letterInfo.officerName || "District Incharge",
                        department: letterInfo.department || "CREDA",
                        district: taskData?.district || "Kondagaon",
                        beneficiary_name: taskData?.beneficiaryName || "Beneficiary"
                    });

                    emailStatus.success = emailResult.success;
                    if (!emailResult.success) {
                        emailStatus.note = emailResult.error || "Verify EmailJS configuration";
                    }
                } catch (emailErr) {
                    console.warn("[EmailJS] Send error:", emailErr);
                    emailStatus.note = emailErr.message;
                }
            }

            // User notification feedback
            let feedback = `✅ Letter PDF generated and saved successfully!\n\n📄 PDF Link: ${pdfUrl}`;
            if (waStatus.attempted) {
                feedback += waStatus.success
                    ? `\n\n🟢 WhatsApp: Message sent successfully to +91 ${cleanWhatsapp}`
                    : `\n\n🟡 WhatsApp: Queued (${waStatus.note || "Verify Meta template approval"})`;
            }
            if (emailStatus.attempted) {
                feedback += emailStatus.success
                    ? `\n\n🟢 Email: Sent successfully via EmailJS to ${cleanEmail}`
                    : `\n\n🟡 Email: Queued (${emailStatus.note || "Add EmailJS Template ID in .env"})`;
            }

            alert(feedback);

            setIsSavingPDF(false);
            setIsSaveModalOpen(false);

            // Navigate directly to History tab in Assign to Vendor Letter
            navigate("/dashboard/assign-vendor-letter", { state: { tab: "history" } });

        } catch (error) {
            console.error("Error saving PDF:", error);
            alert("Error: " + error.message);
            setIsSavingPDF(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloadingPDF(true);

        try {
            const PdfComponent = (
                <LetterPDFDocument
                    headerInfo={headerInfo}
                    letterInfo={letterInfo}
                    tableColumns={tableColumns}
                    tableData={tableData}
                    logoSrc={rbpLogoBase64}
                />
            );

            const pdfBlob = await pdf(PdfComponent).toBlob();
            const blobUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `AdminLetter_${complaintId || "letter"}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Error downloading PDF: " + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };


    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
                {/* Toolbar */}
                <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className={`flex items-center gap-2 px-4 py-2 ${isDownloadingPDF ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'} text-white rounded-lg transition-colors shadow-md`}
                            disabled={isSaving || isSavingPDF || isDownloadingPDF}
                        >
                            <Download size={18} />
                            {isDownloadingPDF ? "Downloading..." : "Download"}
                        </button>

                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 ${isSavingPDF ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white rounded-lg transition-colors shadow-md`}
                            disabled={isSaving || isSavingPDF || isDownloadingPDF}
                        >
                            <FileText size={18} />
                            {isSavingPDF ? "Saving..." : "Save Letter"}
                        </button>
                    </div>
                </div>

                {/* Letter Content */}
                <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-none p-12 print:shadow-none print:p-8 min-h-[1056px] relative overflow-hidden border border-gray-100" id="letter-content">
                    {/* Editable Header */}
                    <div id="letter-header" className="text-center mb-10 border-b-2 border-black pb-4">
                        <div className="mb-6 no-print flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 max-w-md mx-auto shadow-sm">
                            <label htmlFor="company-select" className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                Company Header:
                            </label>
                            <select
                                id="company-select"
                                value={headerInfo.companyName}
                                className="border border-gray-300 rounded px-3 py-1.5 bg-white text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                onChange={(e) => {
                                    applyCompanyProfile(e.target.value);
                                }}
                            >
                                <option value="">-- Select Company Header --</option>
                                {Array.from(
                                    new Map(
                                        companyOptions
                                            .filter(opt => opt && opt.name && opt.name.trim() !== "")
                                            .map(opt => [opt.name.trim().toLowerCase(), opt])
                                    ).values()
                                ).map((opt) => (
                                    <option key={opt.name} value={opt.name}>{opt.name}</option>
                                ))}
                                {headerInfo.companyName && !companyOptions.some(opt => opt.name?.trim().toLowerCase() === headerInfo.companyName.trim().toLowerCase()) && (
                                    <option value={headerInfo.companyName}>{headerInfo.companyName}</option>
                                )}
                            </select>
                        </div>

                        {(headerInfo.companyName || "").toUpperCase().includes("RBP") ? (
                            <div className="flex flex-col items-center mb-0 mt-2 text-center">
                                <img src="/RBP-Logo.PNG" alt="RBP Logo" className="h-24 object-contain mb-1" />
                                <h1 className="text-xl font-bold tracking-wider text-gray-900 uppercase">
                                    {headerInfo.companyName || "RBP ENERGY (INDIA) PVT. LTD."}
                                </h1>
                                <p className="text-xs text-gray-700 mt-0.5">
                                    {headerInfo.address || "303 Guru Ghasidas Plaza, Amapara, G.E Road, Raipur (C.G) 492001"}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {headerInfo.contact || "T : 9200012500 | Email : info@rbpindia.com | Website : www.rbpindia.com"}
                                </p>
                            </div>
                        ) : (headerInfo.companyName || "").toLowerCase().includes("rotomag") ? (
                            <div className="flex flex-col items-end mb-4 mt-2">
                                <img src="/rotomag.png?v=3" alt="Rotomag Logo" className="h-24 object-contain" />
                                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mt-1">
                                    {headerInfo.companyName || "ROTOMAG MOTORS & CONTROLS PVT. LTD."}
                                </h2>
                                {headerInfo.address && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {headerInfo.address}
                                    </p>
                                )}
                            </div>
                        ) : (headerInfo.companyName || "").toLowerCase().includes("solex") ? (
                            <div className="flex flex-col items-end mb-4 mt-2">
                                <img src="/solex.png" alt="Solex Logo" className="h-20 object-contain" />
                                <h2 className="text-base font-bold text-[#f58220] uppercase tracking-wide mt-1">
                                    {headerInfo.companyName || "SOLEX ENERGY LIMITED"}
                                </h2>
                                {headerInfo.address && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {headerInfo.address}
                                    </p>
                                )}
                            </div>
                        ) : (headerInfo.companyName || "").toLowerCase().includes("suraj") ? (
                            <div className="w-full font-sans mb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-5xl font-extrabold text-[#ed7d31] tracking-tight" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                                            Suraj Enterprises
                                        </h1>
                                        <div className="mt-1 ml-2">
                                            <p className="font-bold text-xs text-[#ed7d31]">Deals of -</p>
                                            <ul className="list-disc pl-5 text-[10px] font-bold text-[#ed7d31] leading-tight">
                                                <li>Civil & Electrical Works</li>
                                                <li>Renewable Sources of Energy</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end text-xs font-bold text-[#ed7d31]">
                                        <p className="text-lg">Prop. Rahul Kumar Sharma</p>
                                        <p className="mt-1">Call- 88895-44440, 70240-58958</p>
                                        <p>Email - surajenterprise0587@gmail.com</p>
                                    </div>
                                </div>
                                <div className="border-t-2 border-[#ed7d31] my-1 w-full"></div>
                                <div className="text-center font-bold text-[#ed7d31] text-xs">
                                    Jayanti Nagar, Shri Ram Chowk, Sikola Bhata, Durg (C.G.) 491001
                                </div>
                                <div className="border-t-2 border-[#ed7d31] my-1 w-full"></div>
                            </div>
                        ) : (headerInfo.companyName || "").toLowerCase().includes("premier") ? (
                            <div className="flex flex-col items-start mb-4 mt-2">
                                <img src="/premier.png" alt="Premier Logo" className="h-28 object-contain" />
                                <h2 className="text-base font-bold text-[#2f5597] uppercase tracking-wide mt-1">
                                    {headerInfo.companyName || "PREMIER ENERGIES LTD."}
                                </h2>
                                {headerInfo.address && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {headerInfo.address}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={headerInfo.companyName}
                                    onChange={(e) => handleHeaderEdit("companyName", e.target.value)}
                                    className="text-3xl font-bold text-gray-900 tracking-wider w-full text-center focus:outline-none border-none bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={headerInfo.address}
                                    onChange={(e) => handleHeaderEdit("address", e.target.value)}
                                    className="text-sm mt-1 w-full text-center focus:outline-none border-none bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={headerInfo.location}
                                    onChange={(e) => handleHeaderEdit("location", e.target.value)}
                                    className="text-sm font-medium w-full text-center focus:outline-none border-none bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={headerInfo.contact}
                                    onChange={(e) => handleHeaderEdit("contact", e.target.value)}
                                    className="text-sm w-full text-center focus:outline-none border-none bg-transparent"
                                />
                            </>
                        )}
                    </div>

                    {/* Letter Body - Hindi Format */}
                    <div className="space-y-6 text-base text-gray-800 leading-relaxed font-serif">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={letterInfo.letterNoLabel ?? "पत्र क्र."}
                                    onChange={(e) => handleLetterEdit("letterNoLabel", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold w-20 text-sm"
                                    title="पत्र क्रमांक शीर्षक संपादित करें"
                                />
                                <input
                                    type="text"
                                    value={letterInfo.letterNo}
                                    onChange={(e) => handleLetterEdit("letterNo", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold w-64 text-sm"
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={letterInfo.dateLabel ?? "दिनांक"}
                                    onChange={(e) => handleLetterEdit("dateLabel", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold w-16 text-sm text-right"
                                    title="दिनांक शीर्षक संपादित करें"
                                />
                                <input
                                    type="text"
                                    value={letterInfo.date ? (typeof letterInfo.date === 'string' && letterInfo.date.includes('T') ? formatDateDot(letterInfo.date) : letterInfo.date) : ""}
                                    onChange={(e) => handleLetterEdit("date", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold w-32 text-sm"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <input
                                type="text"
                                value={letterInfo.recipientLabel ?? "प्रति,"}
                                onChange={(e) => handleLetterEdit("recipientLabel", e.target.value)}
                                className="font-bold border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent w-24 text-base"
                                title="प्रति शीर्षक संपादित करें"
                            />
                            <div className="pl-12 space-y-1">
                                <input
                                    className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-semibold"
                                    value={letterInfo.officerName}
                                    onChange={(e) => handleLetterEdit("officerName", e.target.value)}
                                />
                                <input
                                    className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent"
                                    value={letterInfo.department}
                                    onChange={(e) => handleLetterEdit("department", e.target.value)}
                                />
                                <input
                                    className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent"
                                    value={letterInfo.districtOffice}
                                    onChange={(e) => handleLetterEdit("districtOffice", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <input
                                type="text"
                                value={letterInfo.subjectLabel ?? "विषय:-"}
                                onChange={(e) => handleLetterEdit("subjectLabel", e.target.value)}
                                className="font-bold whitespace-nowrap border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent w-20 self-start text-base"
                                title="विषय शीर्षक संपादित करें"
                            />
                            <textarea
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent h-auto resize-none font-bold align-top pt-0"
                                rows="2"
                                value={letterInfo.subject}
                                onChange={(e) => handleLetterEdit("subject", e.target.value)}
                            />
                        </div>

                        <div className="mt-4 flex gap-2">
                            <input
                                type="text"
                                value={letterInfo.referenceLabel ?? "संदर्भ:-"}
                                onChange={(e) => handleLetterEdit("referenceLabel", e.target.value)}
                                className="font-bold whitespace-nowrap border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent w-20 self-start text-base"
                                title="संदर्भ शीर्षक संपादित करें"
                            />
                            <div className="w-full space-y-2">
                                {letterInfo.reference?.map((ref, idx) => (
                                    <div key={idx} className="flex gap-2 items-start group">
                                        <span className="min-w-[20px] pt-0.5">{idx + 1}.</span>
                                        <textarea
                                            className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent h-auto resize-none align-top pt-0"
                                            rows="2"
                                            value={cleanTextDates(ref) || ""}
                                            onChange={(e) => {
                                                const newRefs = [...letterInfo.reference];
                                                newRefs[idx] = e.target.value;
                                                handleLetterEdit("reference", newRefs);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newRefs = letterInfo.reference.filter((_, i) => i !== idx);
                                                handleLetterEdit("reference", newRefs);
                                            }}
                                            className="text-red-400 hover:text-red-600 no-print opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                            title="संदर्भ हटाएं"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleLetterEdit("reference", [...(letterInfo.reference || []), ""]);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 no-print mt-1 cursor-pointer"
                                >
                                    <Plus size={14} /> संदर्भ जोड़ें (Add Reference)
                                </button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <input
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold"
                                value={letterInfo.salutation}
                                onChange={(e) => handleLetterEdit("salutation", e.target.value)}
                            />
                        </div>

                        <div className="mt-2 text-justify">
                            <textarea
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent h-auto resize-none leading-8"
                                rows="3"
                                value={letterInfo.introParagraph}
                                onChange={(e) => handleLetterEdit("introParagraph", e.target.value)}
                            />
                        </div>

                        {/* Dynamic Table */}
                        <div className="my-8 overflow-x-auto rounded-md border border-black relative">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-black">
                                        {tableColumns.map((col, idx) => (
                                            <th key={idx} className="border-r border-black p-2 text-center text-sm font-bold last:border-r-0 relative group">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="text"
                                                        value={col}
                                                        onChange={(e) => {
                                                            const oldName = col;
                                                            const newName = e.target.value;
                                                            const newCols = [...tableColumns];
                                                            newCols[idx] = newName;
                                                            setTableColumns(newCols);
                                                            setTableData(tableData.map(row => {
                                                                const newRow = { ...row };
                                                                newRow[newName] = row[oldName];
                                                                if (newName !== oldName) delete newRow[oldName];
                                                                return newRow;
                                                            }));
                                                        }}
                                                        className="w-full text-center focus:outline-none border-none bg-transparent font-bold text-xs"
                                                    />
                                                    {tableColumns.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const colToRemove = col;
                                                                setTableColumns(tableColumns.filter((_, i) => i !== idx));
                                                                setTableData(tableData.map(row => {
                                                                    const newRow = { ...row };
                                                                    delete newRow[colToRemove];
                                                                    return newRow;
                                                                }));
                                                            }}
                                                            className="text-red-400 hover:text-red-600 no-print opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 cursor-pointer"
                                                            title="कॉलम हटाएं (Remove Column)"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {/* Action Header Column for Add Row and Add Column */}
                                        <th className="p-2 text-center text-sm font-bold bg-gray-100 no-print w-16 border-l border-black">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={addRow}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                                    title="पंक्ति जोड़ें (Add Row)"
                                                >
                                                    <SquarePlus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const colName = prompt("नया कॉलम नाम दर्ज करें (Enter column name):");
                                                        if (colName && colName.trim()) {
                                                            const trimmed = colName.trim();
                                                            if (!tableColumns.includes(trimmed)) {
                                                                setTableColumns([...tableColumns, trimmed]);
                                                                setTableData(tableData.map(r => ({ ...r, [trimmed]: "" })));
                                                            }
                                                        }
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer text-xs font-bold px-1 py-0.5 border border-emerald-400 rounded bg-emerald-50"
                                                    title="कॉलम जोड़ें (Add Column)"
                                                >
                                                    +Col
                                                </button>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="border-b border-black last:border-b-0 group">
                                            {tableColumns.map((col, colIndex) => (
                                                <td key={colIndex} className="border-r border-black p-2 text-center text-sm last:border-r-0">
                                                    <input
                                                        type="text"
                                                        value={row[col] ? (typeof row[col] === 'string' && row[col].includes('T') && !isNaN(Date.parse(row[col])) ? formatDateDot(row[col]) : row[col]) : ""}
                                                        onChange={(e) => handleTableEdit(rowIndex, col, e.target.value)}
                                                        className="w-full text-center focus:outline-none border-none bg-transparent font-semibold text-xs"
                                                    />
                                                </td>
                                            ))}
                                            {/* Action Column for Delete Row */}
                                            <td className="p-2 text-center text-sm no-print border-l border-black bg-gray-50/50 w-16">
                                                <button
                                                    onClick={() => removeRow(rowIndex)}
                                                    className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                                    title="पंक्ति हटाएं (Remove Row)"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 text-justify">
                            <textarea
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent h-auto resize-none leading-8"
                                rows="3"
                                value={letterInfo.closingParagraph}
                                onChange={(e) => handleLetterEdit("closingParagraph", e.target.value)}
                            />
                        </div>

                        {/* Note (if present) */}
                        {letterInfo.note && (
                            <div className="mt-3">
                                <textarea
                                    className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent resize-none text-sm font-medium"
                                    rows="2"
                                    value={letterInfo.note}
                                    onChange={(e) => handleLetterEdit("note", e.target.value)}
                                />
                            </div>
                        )}

                        <div className="mt-10">
                            <input
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left"
                                value={letterInfo.thankYou || "सधन्यवाद !"}
                                onChange={(e) => handleLetterEdit("thankYou", e.target.value)}
                            />
                        </div>

                        {/* Signature Section */}
                        <div className="mt-12 flex flex-col items-start space-y-1">
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-40"
                                value={letterInfo.regards || "भवदीय,"}
                                onChange={(e) => handleLetterEdit("regards", e.target.value)}
                            />
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-80"
                                value={letterInfo.forCompany || (headerInfo.companyName ? `वास्ते, ${headerInfo.companyName}` : "वास्ते, तनय विद्युत (ई०) प्रा.लि.")}
                                onChange={(e) => handleLetterEdit("forCompany", e.target.value)}
                            />
                            <div className="h-8"></div> {/* Space for signature */}
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-64 text-base"
                                placeholder="हस्ताक्षरकर्ता का नाम (Signer Name)"
                                value={letterInfo.signerName !== undefined ? letterInfo.signerName : "अंजली यादव"}
                                onChange={(e) => handleLetterEdit("signerName", e.target.value)}
                                title="हस्ताक्षरकर्ता का नाम संपादित करें"
                            />
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-64"
                                value={letterInfo.designation || "अधिकृत हस्ताक्षरकर्ता"}
                                onChange={(e) => handleLetterEdit("designation", e.target.value)}
                                title="पद संपादित करें"
                            />
                        </div>

                        {/* Enclosure Section (संलग्न) */}
                        <div className="mt-8 flex gap-2 items-start">
                            <input
                                type="text"
                                value={letterInfo.enclosureLabel ?? "संलग्न :-"}
                                onChange={(e) => handleLetterEdit("enclosureLabel", e.target.value)}
                                className="font-bold whitespace-nowrap border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent w-24 self-start"
                                title="संलग्न शीर्षक संपादित करें"
                            />
                            <div className="w-full space-y-1">
                                {(Array.isArray(letterInfo.enclosures) ? letterInfo.enclosures : (letterInfo.enclosure ? [letterInfo.enclosure] : ["हमारे पूर्व पत्र की छायाप्रति।"])).map((enc, idx, arr) => (
                                    <div key={idx} className="flex gap-2 items-center group">
                                        {arr.length > 1 && <span className="min-w-[16px] text-sm">{idx + 1}.</span>}
                                        <input
                                            type="text"
                                            className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent text-sm font-medium"
                                            value={enc}
                                            placeholder="संलग्न विवरण दर्ज करें"
                                            onChange={(e) => {
                                                const newEncs = [...arr];
                                                newEncs[idx] = e.target.value;
                                                handleLetterEdit("enclosures", newEncs);
                                                handleLetterEdit("enclosure", newEncs.join(", "));
                                            }}
                                        />
                                        {arr.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newEncs = arr.filter((_, i) => i !== idx);
                                                    handleLetterEdit("enclosures", newEncs);
                                                    handleLetterEdit("enclosure", newEncs.join(", "));
                                                }}
                                                className="text-red-400 hover:text-red-600 no-print opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                                title="संलग्नक हटाएं"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const current = Array.isArray(letterInfo.enclosures) ? letterInfo.enclosures : (letterInfo.enclosure ? [letterInfo.enclosure] : ["हमारे पूर्व पत्र की छायाप्रति।"]);
                                        const updated = [...current, ""];
                                        handleLetterEdit("enclosures", updated);
                                        handleLetterEdit("enclosure", updated.join(", "));
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 no-print mt-1 cursor-pointer"
                                >
                                    <Plus size={14} /> संलग्नक जोड़ें (Add Enclosure)
                                </button>
                            </div>
                        </div>

                        {/* CC Section */}
                        <div className="mt-8 text-sm space-y-2">
                            <input
                                type="text"
                                value={letterInfo.copiesToLabel ?? "प्रतिलिपि:—"}
                                onChange={(e) => handleLetterEdit("copiesToLabel", e.target.value)}
                                className="font-bold border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent w-28 text-sm"
                                title="प्रतिलिपि शीर्षक संपादित करें"
                            />
                            <div className="pl-0 space-y-1">
                                {letterInfo.copiesTo?.map((copy, idx) => (
                                    <div key={idx} className="flex gap-2 items-center group">
                                        <span className="min-w-[20px] text-sm">{idx + 1}.</span>
                                        <input
                                            className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent text-sm"
                                            value={copy}
                                            onChange={(e) => {
                                                const newCopies = [...letterInfo.copiesTo];
                                                newCopies[idx] = e.target.value;
                                                handleLetterEdit("copiesTo", newCopies);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newCopies = letterInfo.copiesTo.filter((_, i) => i !== idx);
                                                handleLetterEdit("copiesTo", newCopies);
                                            }}
                                            className="text-red-400 hover:text-red-600 no-print opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                            title="प्रतिलिपि हटाएं"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleLetterEdit("copiesTo", [...(letterInfo.copiesTo || []), ""]);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 no-print mt-1 cursor-pointer"
                                >
                                    <Plus size={14} /> प्रतिलिपि जोड़ें (Add CC)
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Dynamic Footer Section */}
                    {(headerInfo.companyName.toLowerCase().includes("suraj") || headerInfo.companyName.toLowerCase().includes("tanay") || (headerInfo.companyName || "").toUpperCase().includes("RBP")) ? null : (
                        <div id="letter-footer" className="mt-20 border-t border-black pt-4 text-center text-[10px] leading-tight">
                            {headerInfo.companyName.includes("RBP") ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-xs uppercase tracking-widest text-black">
                                        RBP ENERGY (INDIA) PVT. LTD.
                                    </p>
                                    <p className="text-gray-900 font-medium">
                                        303 Guru Ghasidas Plaza, Amapara, G.E Road, Raipur (C.G) 492001
                                    </p>
                                    <p className="text-gray-900">
                                        <span className="text-[#00CCCC] font-bold">T :</span> 9200012500 <span className="text-[#00CCCC] font-bold">Email :</span> info@rbpindia.com, <span className="text-[#00CCCC] font-bold">Website :</span> www.rbpindia.com
                                    </p>
                                </div>
                            ) : headerInfo.companyName.toLowerCase().includes("rotomag") ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900">
                                        CIN No. : U34100GJ1993PTCO20063
                                    </p>
                                    <p className="text-gray-900 font-medium">
                                        Regd.Off. : 2102/3&4, GIDC Estate, Vitthal Udyognagar Gujarat-388 121, India
                                    </p>
                                    <p className="text-gray-900">
                                        Ph. : +91-2692-236005, 236409(Unit), 230430, 9227110023/24/25 (unit 2) Fax:+91-2692-239805
                                    </p>
                                    <p className="text-blue-700 underline">
                                        Mail@rotomag.com | www.rotomag.com
                                    </p>
                                </div>
                            ) : headerInfo.companyName.toLowerCase().includes("solex") ? (
                                <div className="space-y-1 relative pb-2 w-full font-sans">
                                    <h1 className="text-xl font-bold text-[#f58220] uppercase tracking-wide">Solex Energy Limited</h1>
                                    <p className="text-[10px] font-bold text-gray-800">(Formerly known as SOLEX ENERGY PVT LTD)</p>
                                    <p className="text-[9px] text-gray-800 leading-tight">
                                        <span className="font-extrabold text-[#f58220]">Regd. Off & Works:</span> Plot No: 131/A, Phase - 1, Nr. Krimy, H M Road, G. I. D. C, Vitthal Udyognagar - 388121, Dist: Anand (Gujarat), India.
                                    </p>
                                    <p className="text-[9px] text-gray-800 leading-tight">
                                        <span className="font-extrabold text-[#f58220]">Customer Care:</span> 1800 233 28298 <span className="font-extrabold text-[#f58220]">Tel.:</span> +91-2692-230317 <span className="font-extrabold text-[#f58220]">Fax:</span> +91-2692-231216 <span className="font-extrabold text-[#f58220]">Mob.</span> +91 94265 91750
                                    </p>
                                    <p className="text-[9px] text-gray-800 leading-tight">
                                        <span className="font-extrabold text-[#f58220]">Mail:</span> <a href="mailto:solexin14@gmail.com" className="text-blue-700 underline">solexin14@gmail.com</a>, <a href="mailto:info@solex.in" className="text-blue-700 underline">info@solex.in</a> <span className="font-extrabold text-[#f58220]">Web:</span> <a href="http://www.solex.in" target="_blank" rel="noreferrer" className="text-blue-700 underline">www.solex.in</a> <span className="font-extrabold text-[#f58220]">CIN:</span> L40106GJ2014PLC081036
                                    </p>
                                    <p className="text-[9px] text-gray-800 leading-tight">
                                        <span className="font-extrabold text-[#f58220]">GST No.:</span> 24AAVCS0328R1ZN <span className="font-extrabold text-[#f58220]">PAN No.:</span> AAVCS 0328 R
                                    </p>
                                    <div className="mt-1 border-t-2 border-[#f58220] pt-1">
                                        <p className="text-[9px] text-[#f58220] font-bold uppercase tracking-wider">
                                            Mfg. Of SPV Module, Solar Lighting System, Solar Rooftop System, Solar Pumping Systems & Solar Power Plants
                                        </p>
                                    </div>
                                </div>
                            ) : headerInfo.companyName.toLowerCase().includes("premier") ? (
                                <div className="w-full font-sans">
                                    {/* Color Bar */}
                                    <div className="flex w-full text-white text-[10px] font-bold mb-2">
                                        <div className="bg-[#4472c4] flex-1 py-1 px-4 flex items-center gap-2">
                                            <Mail size={12} className="fill-current" />
                                            <span>info@premierenergies.com</span>
                                        </div>
                                        <div className="bg-[#70ad47] flex-1 py-1 px-4 flex items-center justify-end gap-2 relative">
                                            <div className="absolute left-[-10px] top-0 bottom-0 w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-l-[15px] border-l-[#4472c4]"></div>
                                            <Globe size={12} className="fill-current" />
                                            <span>www.premierenergies.com</span>
                                        </div>
                                    </div>

                                    <div className="text-center space-y-1 text-[9px] text-[#2f5597]">
                                        <h2 className="text-sm font-bold uppercase tracking-wider">PREMIER ENERGIES LTD.</h2>
                                        <p className="font-medium">
                                            Regd Office: Sy.No.54/Part, Above G.Pulla Reddy Sweets, Vikrampuri, Secunderabad-500009, Telangana, India
                                        </p>
                                        <p>
                                            Factory: Sy.No. 53, Annaram Village, Gummadidala-Mandal, Sangareddy District. -502313, Telangana, India.
                                        </p>
                                        <div className="flex justify-center items-center gap-2 font-bold">
                                            <Phone size={10} className="fill-current" />
                                            <span>+91-40-27744415/16</span>
                                            <span className="text-gray-400">|</span>
                                            <span>GST: 36AABCP8800D1ZP</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="font-bold uppercase">{headerInfo.companyName}</p>
                                    <p>{headerInfo.address}</p>
                                    <p>{headerInfo.contact}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Print specific styles */}
                    <style>{`
                #letter-content {
                  padding: 20mm 20mm 50mm 20mm !important;
                  background-color: #ffffff !important;
                  color: #1f2937 !important;
                }
                #letter-content .bg-gray-50 {
                  background-color: #f9fafb !important;
                }
                #letter-content .text-gray-800 {
                  color: #1f2937 !important;
                }
                #letter-content .text-gray-900 {
                  color: #111827 !important;
                }
                #letter-content .border-gray-100 {
                  border-color: #f3f4f6 !important;
                }
                #letter-content .border-black {
                  border-color: #000000 !important;
                }
                /* Global footer positioning */
                #letter-footer {
                  position: absolute !important;
                  bottom: 15mm !important;
                  left: 20mm !important;
                  right: 20mm !important;
                  width: auto !important;
                }

                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #letter-content, #letter-content * {
                    visibility: visible;
                  }
                  #letter-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    border: none;
                    box-shadow: none;
                  }
                  .no-print {
                    display: none !important;
                  }
                  textarea, input {
                    border: none !important;
                    background: transparent !important;
                    resize: none !important;
                  }
                  #letter-footer {
                    position: absolute !important;
                    bottom: 15mm !important;
                    left: 20mm !important;
                    right: 20mm !important;
                    width: auto !important;
                  }
                }
              `}</style>
                </div>
            </div>

            {/* Modal for Save Letter (WhatsApp & Email options) */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Save Letter</h3>
                                    <p className="text-xs text-blue-100 font-medium">
                                        शिकायत क्र.: {complaintId || taskData?.complaintId || "-"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSaveModalOpen(false)}
                                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                disabled={isSavingPDF}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-600">
                                पत्र सुरक्षित करने के लिए कृपया WhatsApp नंबर एवं Email विवरण दर्ज करें:
                            </p>

                            {/* Option 1: WhatsApp Number */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                                        <Phone size={12} />
                                    </span>
                                    <span>1) WhatsApp Number / व्हाट्सएप नंबर</span>
                                </label>
                                <div className="relative rounded-lg shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="उदा. 9876543210"
                                        value={whatsappNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            setWhatsappNumber(val);
                                        }}
                                        className="block w-full pl-16 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder-gray-400 font-medium"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    पत्र की प्रति इस व्हाट्सएप नंबर पर साझा की जाएगी।
                                </p>
                            </div>

                            {/* Option 2: Email Address */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
                                        <Mail size={12} />
                                    </span>
                                    <span>2) Email Address / ईमेल आईडी</span>
                                </label>
                                <div className="relative rounded-lg shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="उदा. vendor@company.com"
                                        value={emailAddress}
                                        onChange={(e) => {
                                            setEmailAddress(e.target.value);
                                            setSelectedEmail(e.target.value);
                                        }}
                                        className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 font-medium"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    पत्र की प्रति इस ईमेल आईडी पर भेजी जाएगी।
                                </p>
                            </div>

                            {/* Information Note */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                                <span className="text-emerald-600 text-xs mt-0.5">🚀</span>
                                <p className="text-xs text-emerald-800 leading-relaxed">
                                    <strong className="font-semibold">लाइव इंटीग्रेशन:</strong> "Save Letter" पर क्लिक करते ही लेटर PDF स्वतः WhatsApp (Meta Cloud API) एवं Email (EmailJS) पर भेजा जाएगा, तथा कार्य History टैब में दर्ज हो जाएगा।
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsSaveModalOpen(false)}
                                disabled={isSavingPDF}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                रद्द करें (Cancel)
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePDF}
                                disabled={isSavingPDF}
                                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isSavingPDF ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={16} />
                                        <span>Save Letter</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AdminLetter;
