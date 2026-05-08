import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Save, FileText, Mail, Globe, Phone, Trash2, SquarePlus } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import DashboardLayout from "../components/DashboardLayout";
import LetterPDFDocument from "../components/LetterPDFDocument";
import RBPLetterPDF from "../components/RBPLetterPDF";
import supabase from "../utils/supabase";


const AdminLetter = () => {
    const { complaintId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [taskData, setTaskData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPDF, setIsSavingPDF] = useState(false);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState("tanay.vidhyut@gmail.com");

    // Header Content State
    const [headerInfo, setHeaderInfo] = useState({
        companyName: "TANAY VIDHYUT (I) PVT. LTD.",
        address: "P.S. City Colony, House No. 08, Changorabhata",
        location: "Raipur (C.G.) - 492013",
        contact: "Phone No. +91 94255398289 Email : tanay.vidhyut@gmail.com"
    });

    // Letter Content State (Dynamic)
    const [letterInfo, setLetterInfo] = useState({
        letterNo: `SSY/2025/${Math.floor(Math.random() * 900) + 100}`,
        date: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
        subject: "जिला कोण्डागांव में सौर सुजला योजनांतर्गत स्थापित सिंचाई सोलर पंप के संबंध में ।",
        reference: [
            "पत्र क्र. 2386/क्रेडा/जि.का./SSY/O&M/F-04/2024-25 कोण्डागांव, दिनांक 06.11.2025,",
            "जिला कार्यालय कोण्डागांव का पत्र क्रमांक / दिनांक 2067 / 26.09.2025, 2282 / 29.10.2025, 2112 / 29.09.2025 |"
        ],
        officerName: "जिला प्रभारी,",
        department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
        districtOffice: "जिला कार्यालय, कोण्डागांव (छ०ग०)",
        salutation: "महोदय,",
        introParagraph: "उपरोक्त विषयांतर्गत लेख है कि, जिला कोण्डागांव अंतर्गत हमारे द्वारा विभिन्न स्थलों में सोलर पंपों स्थापित किया गया है। जिसकी अकार्य शीलता की सूचना हमें आपके संदर्भित पत्र के माध्यम से प्राप्त हुआ। जिसका विवरण निम्नानुसार है-",
        closingParagraph: "उपरोक्त साईट के संयंत्र का सुधार कार्य हमारे द्वारा कर दिया गया है, तथा संयंत्र वर्तमान में कार्य शील है। इस पत्र के साथ साईट की संपुष्टि पत्र संलग्न है। पत्र आपकी ओर सादर सूचनार्थ हेतु प्रेषित।",
        thankYou: "सधन्यवाद !",
        regards: "भवदीय",
        forCompany: "वास्ते, तनय विद्युत (ई०) प्रा.लि.",
        designation: "अधिकृत हस्ताक्षरकर्ता",
        copiesTo: [
            "कार्यपालन अभियंता महोदय, (RE-05) क्रेडा प्रधान कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।",
            "कार्यपालन अभियंता महोदय,क्रेडा जोनल कार्यालय, जगदलपुर को सादर सूचनार्थ प्रेषित।"
        ]
    });

    // Dynamic Table State
    const [tableColumns, setTableColumns] = useState(["क्र.", "सौर समाधान क्र.", "आई. डी. नं.", "हितग्राही का नाम", "ग्राम/ विकासखण्ड", "दिनांक", "रिमार्क"]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            setLoading(true);
            try {
                // Scenario 1: Data passed via navigation state (Multi-row)
                if (location.state?.tasks) {
                    const tasksArr = location.state.tasks;
                    const itemType = location.state.itemType || "Battery";
                    const task = tasksArr[0]; // Use first task for some header defaults
                    setTaskData(task);
                    
                    // Template Configuration
                    const siteNames = tasksArr.map(t => t.village || t.siteName || "-").join(", ");
                    const blockNames = Array.from(new Set(tasksArr.map(t => t.block))).join(" & ");
                    const district = task.district || "-";
                    const actualDate = task.actualDate || new Date().toLocaleDateString("en-GB");

                    let columns = ["SR No", "Site Name", "District", "System Rating", "Installation date", "Problem Reported", "RBP Remarks"];
                    let templateData = [];

                    if (itemType === "Street Light") {
                        columns = ["SL NO.", "VILLAGE", "BLOCK", "DIST", "SYSTEM RATING", "PROJECT", "STREET LIGHT RATING", "DATE OF INSTALLATION", "DEFECTIVE QTY", "REPLACED QTY", "STATUS"];
                        templateData = tasksArr.map((t, idx) => ({
                            "SL NO.": (idx + 1).toString().padStart(2, '0') + ".",
                            "VILLAGE": t.village || "-",
                            "BLOCK": t.block || "-",
                            "DIST": t.district || "-",
                            "SYSTEM RATING": t.product || "-",
                            "PROJECT": "SOUBHAGYA",
                            "STREET LIGHT RATING": "15W",
                            "DATE OF INSTALLATION": t.complaintDate || "-",
                            "DEFECTIVE QTY": "1",
                            "REPLACED QTY": "1",
                            "STATUS": "CLOSED"
                        }));
                    } else if (itemType === "Inverter") {
                        templateData = tasksArr.map((t, idx) => ({
                            "SR No": (idx + 1).toString().padStart(2, '0') + ".",
                            "Site Name": t.village || "-",
                            "District": t.district || "-",
                            "System Rating": t.product || "-",
                            "Installation date": t.complaintDate || "-",
                            "Problem Reported": t.natureOfComplaint || "INVERTER FAULTY",
                            "RBP Remarks": "RECTIFIED THE INVERTER. NOW SYSTEM IS WORKING SATISFACTORY."
                        }));
                    } else { // Battery
                        templateData = tasksArr.map((t, idx) => ({
                            "SR No": (idx + 1).toString().padStart(2, '0') + ".",
                            "Site Name": t.village || "-",
                            "District": t.district || "-",
                            "System Rating": t.product || "-",
                            "Installation date": t.complaintDate || "-",
                            "Problem Reported": t.natureOfComplaint || "BATTERY FAULTY",
                            "RBP Remarks": "REPLACED Defective Cell. NOW SYSTEM IS WORKING SATISFACTORY."
                        }));
                    }

                    setTableColumns(columns);
                    setTableData(templateData);

                    // Update Letter Info based on Item Type
                    const randomNum = Math.floor(Math.random() * 900) + 100;
                    // if (itemType === "Street Light") {
                    //     setLetterInfo(prev => ({
                    //         ...prev,
                    //         letterNo: `RBP/SL/SER/21-22/${randomNum}`,
                    //         subject: `Regarding Repair/Maintenance of Street Lights at following Villages of ${blockNames} Blocks, ${district} Dist.`,
                    //         introParagraph: `With reference to the above subject Complaints, We have received Letter regarding Repair/Maintenance of Street Lights at Following villages of ${blockNames} Blocks, Dist: ${district}. Today we have received the faulty materials along with this Letter. We have dispatched ${templateData.length}nos of ${templateData[0]["STREET LIGHT RATING"]} Working Street Lights against DC No:XXXX Dt:${actualDate} for replacement against defective.`,
                    //         officerName: "THE DIST INCHARGE",
                    //         department: "DIST OFFICE-BAIKUNTHPUR, DIST:KORIA",
                    //         districtOffice: "CHHATTISGARH",
                    //         copiesTo: [
                    //             "Superintending Engineer, CREDA Zonal Office, Sarguja",
                    //             "Executive Engineer, CREDA RO, Sarguja"
                    //         ],
                    //         forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
                    //         salutation: "Dear Sir,",
                    //         rbpTableRows: templateData // Save to special key for RBP format if needed
                    //     }));
                    if (itemType === "Street Light") {
    // Calculate total defective and replaced quantity
    const totalDefectiveQty = templateData.reduce((sum, row) => sum + (parseInt(row["DEFECTIVE QTY"]) || 0), 0);
    const totalReplacedQty = templateData.reduce((sum, row) => sum + (parseInt(row["REPLACED QTY"]) || 0), 0);
    
    setLetterInfo(prev => ({
        ...prev,
        letterNo: `RBP/SL/SER/21-22/${randomNum.toString().padStart(2, '0')}`,
        date: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
        subject: `Regarding Repair/Maintenance of Street Lights at following Villages of ${blockNames} Blocks, ${district} Dist.`,
        reference: [`i) Your Letter Ref No: 1188/CREDA/O&M/${district}/2021-2022/${task.block || "Baikunthpur"} Dt:${actualDate}`],
        officerName: "THE DIST INCHARGE",
        department: `DIST OFFICE-${task.block === "Bharatpur" ? "BAIKUNTHPUR" : task.block?.toUpperCase() || "BAIKUNTHPUR"}, DIST:${district.toUpperCase()}`,
        districtOffice: "CHHATTISGARH",
        salutation: "Dear Sir,",
        introParagraph: `With reference to the above subject Complaints, We have received Letter regarding Repair/Maintenance of Street Lights at Following villages of ${blockNames} Blocks, Dist: ${district}. Today we have received the faulty materials along with this Letter. We have dispatched ${totalReplacedQty}nos of ${templateData[0]["STREET LIGHT RATING"]} Working Street Lights against DC No:4716 Dt:${actualDate} for replacement against defective.`,
        closingParagraph: "Request you to update in your records & close the complaints in your complaint register.",
        thankYou: "Thanking you.",
        regards: "Yours faithfully,",
        forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
        designation: "S.N.Sahoo",
        copiesTo: [
            "Superintending Engineer, CREDA Zonal Office, Sarguja",
            "Executive Engineer, CREDA RO, Sarguja"
        ],
        note: "Note: Request you to update in your record & close the complaints in your Complaint register.",
        totalQty: totalReplacedQty,
        rbpTableRows: templateData
    }));


                    // } else if (itemType === "Inverter") {
                    //     setLetterInfo(prev => ({
                    //         ...prev,
                    //         letterNo: `RBP/SPVPP/SER/24-25/${randomNum}`,
                    //         subject: `Regarding Rectification of Power plant Inverter complaints of ${siteNames} sites, Block-${task.block || ""}, Dist: ${district}`,
                    //         introParagraph: `With reference to the above subject Complaints, M/s Statcon Powtech service Engineer visited to ${siteNames} sites against inverter complaints & rectified the inverter. (M/s Statcon Powtech Service report enclosed for your reference). Now system is working satisfactory.`,
                    //         officerName: "The ASSISTANT ENGINEER",
                    //         department: "CREDA DIST OFFICE",
                    //         districtOffice: `CREDA DIST OFFICE- ${district}, DIST: ${district}`,
                    //         copiesTo: ["Executive Engineer, CREDA ZO, RAIPUR"],
                    //         forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
                    //         salutation: "Dear Sir,"
                    //     }));

}else if (itemType === "Inverter") {
    setLetterInfo(prev => ({
        ...prev,
        letterNo: `RBP/SPVPP/SER/24-25/${randomNum}`,
        date: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
        subject: `Regarding Rectification of Power plant Inverter complaints of ${siteNames} sites, Block-${task.block || ""}, Dist: ${district}`,
        reference: [`i) 392/CREDA/SPVPP/2024-25/${district.toUpperCase().replace(/ /g, "_")} Dt:${actualDate}`],
        officerName: "The ASSISTANT ENGINEER",
        department: "CREDA DIST OFFICE",
        districtOffice: `CREDA DIST OFFICE- ${district}, DIST: ${district}`,
        salutation: "Dear Sir,",
        introParagraph: `With reference to the above subject Complaints, M/s Statcon Powtech service Engineer visited to ${siteNames} sites against inverter complaints & rectified the inverter. (M/s Statcon Powtech Service report enclosed for your reference). Now system is working satisfactory.`,
        closingParagraph: "Request you to update in your record & close the complaints in your complaint register.",
        thankYou: "Thanking you.",
        regards: "Yours faithfully,", 
        forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
        designation: "S.N.Sahoo",
        copiesTo: ["Executive Engineer, CREDA ZO, RAIPUR"],
        note: "Note: Request you to update in your record & close the complaints in your Complaint register.",
        rbpTableRows: templateData
    }));

                    // } else { // Battery
                    //     setLetterInfo(prev => ({
                    //         ...prev,
                    //         letterNo: `RBP/SPVPP/SER/24-25/${randomNum}`,
                    //         subject: `Regarding Rectification of Power Plant Battery complaint of ${siteNames}, Block-${task.block || ""}, Dist:${district}`,
                    //         introParagraph: `With reference to the above subject Complaints of ${siteNames} site, Block-${task.block || ""}, Dist-${district} , M/s HBL Engineer visited site on Dt:${actualDate} against Battery complaint & replaced 3nos cell against defective. Now System is working satisfactory(Service reports enclosed for your reference).`,
                    //         officerName: "THE DIST INCHARGE",
                    //         department: "CREDA DIST OFFICE",
                    //         districtOffice: `CREDA DIST OFFICE- ${district}, DIST: ${district}`,
                    //         copiesTo: ["Superintending Engineer(RE-05), CREDA HO, RAIPUR"],
                    //         forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
                    //         salutation: "Dear Sir,"
                    //     }));
                    // }

                    } else { // Battery
    setLetterInfo(prev => ({
        ...prev,
        letterNo: `RBP/SPVPP/SER/24-25/${randomNum}`,
        date: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
        subject: `Regarding Rectification of Power Plant Battery complaint of ${siteNames}, Block-${task.block || ""}, Dist:${district}`,
        reference: [`i) Your Letter Ref No:1245/J.K/2024-25/${district.toUpperCase().replace(/ /g, "_")} Dt:${actualDate}`],
        officerName: "THE DIST INCHARGE",
        department: "CREDA DIST OFFICE",
        districtOffice: `CREDA DIST OFFICE- ${district}, DIST:${district}`,
        salutation: "Dear Sir,",
        introParagraph: `With reference to the above subject Complaints of ${siteNames} site, Block-${task.block || ""}, Dist-${district} , M/s HBL Engineer visited site on Dt:${actualDate} against Battery complaint & replaced 3nos cell against defective. Now System is working satisfactory(Service reports enclosed for your reference).`,
        closingParagraph: "Request you to update in your record & close the complaints in your complaint register.",
        thankYou: "Thanking you.",
        regards: "Yours faithfully,",
        forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
        designation: "S.N.Sahoo",
        copiesTo: ["Superintending Engineer(RE-05), CREDA HO, RAIPUR"],
        note: "Note: Request you to update in your record & close the complaints in your Complaint register.",
        rbpTableRows: templateData
    }));
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
                        "दिनांक": task.actualDate || "-",
                        "रिमार्क": "संयंत्र कार्य शील हैं।"
                    }]);
                    if (task.district) {
                        setLetterInfo(prev => ({
                            ...prev,
                            districtOffice: `जिला कार्यालय, ${task.district} (छ०ग०)`,
                            introParagraph: prev.introParagraph.replace(/कोण्डागांव/g, task.district)
                        }));
                    }
                    setLoading(false);
                    return;
                }

                // Scenario 2: Check if we have saved progress in localStorage
                const savedData = localStorage.getItem(`admin_letter_${complaintId}`);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setLetterInfo(prev => ({ ...prev, ...parsed.letterInfo }));
                    setHeaderInfo(prev => ({ ...prev, ...parsed.headerInfo }));
                    if (parsed.tableColumns) setTableColumns(parsed.tableColumns);
                    if (parsed.tableData) setTableData(parsed.tableData);
                    setLoading(false);
                    return;
                }

                // Scenario 3: Fallback - Fetch from FMS sheet (same indices as DraftLetter)
                const fmsSheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS";
                const response = await fetch(fmsSheetUrl);
                const text = await response.text();
                const jsonStart = text.indexOf("{");
                const jsonEnd = text.lastIndexOf("}") + 1;
                const jsonData = text.substring(jsonStart, jsonEnd);
                const data = JSON.parse(jsonData);

                if (data?.table?.rows) {
                    // Match by Complaint ID (Index 1 in FMS)
                    const row = data.table.rows.find(r => r.c && r.c[1] && String(r.c[1].v).trim() === complaintId);
                    if (row) {
                        const task = {
                            complaintId: row.c[1]?.v || "",
                            idNumber: row.c[4]?.v || "-",
                            beneficiaryName: row.c[8]?.v || "",
                            village: row.c[10]?.v || "",
                            block: row.c[11]?.v || "",
                            district: row.c[12]?.v || "",
                            actualDate: row.c[34]?.v || new Date().toLocaleDateString("en-GB")
                        };
                        setTaskData(task);

                        setTableData([{
                            "क्र.": "01.",
                            "सौर समाधान क्र.": task.complaintId || "-",
                            "आई. डी. नं.": task.idNumber || "-",
                            "हितग्राही का नाम": task.beneficiaryName || "-",
                            "ग्राम/ विकासखण्ड": `${task.village || ""}/ ${task.block || ""}`,
                            "दिनांक": task.actualDate || "-",
                            "रिमार्क": "संयंत्र कार्य शील हैं."
                        }]);

                        if (task.district) {
                            setLetterInfo(prev => ({
                                ...prev,
                                districtOffice: `जिला कार्यालय, ${task.district} (छ०ग०)`,
                                introParagraph: prev.introParagraph.replace(/कोण्डागांव/g, task.district)
                            }));
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching task details:", error);
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
            const masterSheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=Master";
            const response = await fetch(masterSheetUrl);
            const text = await response.text();
            const jsonStart = text.indexOf("{");
            const jsonEnd = text.lastIndexOf("}") + 1;
            const jsonData = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonData);

            const options = [];
            if (data?.table?.rows) {
                // Using column J (index 9) for Company Name1
                // Skip header row only if it matches the header text, otherwise include all data
                data.table.rows.forEach((row) => {
                    const companyName = row.c[9]?.v;
                    if (companyName) {
                        const nameStr = String(companyName).trim();
                        // Ignore the literal header labels
                        if (nameStr === "Company Name1" || nameStr === "Company Name" || nameStr === "Company Name 1") {
                            return;
                        }

                        options.push({
                            name: nameStr,
                            address: row.c[10]?.v || "",
                            email: row.c[11]?.v || "",
                            phone: row.c[12]?.v || ""
                        });
                    }
                });
            }
            setCompanyOptions(options);
        } catch (error) {
            console.error("Error fetching company options:", error);
        }
    };

    useEffect(() => {
        if (location.state?.autoSelectCompany && companyOptions.length > 0) {
            if (headerInfo.companyName !== location.state.autoSelectCompany) {
                const selected = companyOptions.find(c => c.name === location.state.autoSelectCompany);
                if (selected) {
                    console.log("=== AUTO SELECTING COMPANY ===");
                    console.log("Selected company:", selected.name);
                    
                    const newHeaderInfo = {
                        companyName: selected.name,
                        address: selected.address,
                        location: "",
                        contact: `Phone No. ${selected.phone} | Email : ${selected.email}`
                    };
                    
                    setHeaderInfo(newHeaderInfo);
                    setSelectedEmail(selected.email);
                    
                    const isColumnANTrueLocal = taskData?.columnAN === true || taskData?.columnAN === "true" || taskData?.columnAN === "TRUE";
                    
                    // Fixed for RBP Auto-selection logic
                    if ((isColumnANTrueLocal || location.state?.itemType) && selected.name.toUpperCase().includes("RBP")) {
                        // Template values already set in initial useEffect if location.state.tasks exists
                        // If only company auto-select is triggered, we can set defaults here if not already set
                        if (!location.state?.tasks) {
                            setLetterInfo(prev => ({
                                ...prev,
                                letterNo: `RBP/SPVPP/SER/25-26/${Math.floor(Math.random() * 900) + 100}`,
                                officerName: "The DIST INCHARGE",
                                department: "CREDA DIST OFFICE",
                                districtOffice: `CREDA DIST OFFICE-${taskData?.district || ""}, DIST:${taskData?.district || ""}`,
                                subject: "Regarding Rectification of Power Plant Inverter & Battery complaints",
                                reference: ["Whatsapp"],
                                salutation: "Dear Sir,",
                                introParagraph: `With reference to the above subject Complaints M/s Statcon Powtech Service Engineer visited to ${taskData?.block || ""} sites from ${taskData?.actualDate || ""} against Power plant inverter complaints & rectified the inverters. Now System is working satisfactory. (Service report enclosed for your reference).`,
                                closingParagraph: "Note: Request you to update in your record & close the complaints in your Complaint register.",
                                thankYou: "Thanking you.",
                                regards: "Yours faithfully,",
                                forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
                                designation: "S.N.Sahoo",
                                copiesTo: [
                                    "Executive Engineer (RE-05), CREDA HO, Raipur",
                                    "Executive Engineer, CREDA ZO, Bilaspur"
                                ],
                                companyDetails: {
                                    phone: selected.phone,
                                    email: selected.email,
                                    address: selected.address
                                }
                            }));
                        } else {
                            // Overlay company details onto existing letterInfo set by template logic
                            setLetterInfo(prev => ({
                                ...prev,
                                companyDetails: {
                                    phone: selected.phone,
                                    email: selected.email,
                                    address: selected.address
                                }
                            }));
                        }
                    } else {
                        setLetterInfo(prev => ({
                            ...prev,
                            forCompany: `वास्ते, ${selected.name}`,
                            companyDetails: {
                                phone: selected.phone,
                                email: selected.email,
                                address: selected.address
                            }
                        }));
                    }
                }
            }
        }
    }, [companyOptions, location.state, headerInfo.companyName, taskData]);


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
            // 🔥 STEP 2: condition check
            const isColumnANTrue =
                taskData?.columnAN === true ||
                taskData?.columnAN === "true" ||
                taskData?.columnAN === "TRUE";

            const isRBP = headerInfo?.companyName?.toUpperCase().includes("RBP");

            console.log("STEP2 CHECK 👉", { columnAN: taskData?.columnAN, company: headerInfo?.companyName, isColumnANTrue, isRBP });

            // 🔥 STEP 3: decide PDF component
            const PdfComponent = isColumnANTrue && isRBP
                ? (<RBPLetterPDF headerInfo={headerInfo} letterInfo={letterInfo} tableColumns={tableColumns} tableData={tableData} />)
                : (<LetterPDFDocument headerInfo={headerInfo} letterInfo={letterInfo} tableColumns={tableColumns} tableData={tableData} />);

            // 🔥 STEP 4: generate PDF blob
            const pdfBlob = await pdf(PdfComponent).toBlob();

            // 🔥 STEP 5: Upload to Supabase Storage (vendor_tracker bucket)
            const fileName = `AdminLetter_${complaintId}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage
                .from("vendor_tracker")
                .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });

            if (uploadError) throw new Error("PDF upload failed: " + uploadError.message);

            const { data: urlData } = supabase.storage
                .from("vendor_tracker")
                .getPublicUrl(fileName);

            const pdfUrl = urlData.publicUrl;
            console.log("✅ PDF uploaded to Supabase Storage:", pdfUrl);

            // 🔥 STEP 6: Update FMS table in Supabase (non-blocking if fails)
            try {
                const currentDate = new Date().toISOString().split('T')[0];
                const { error: updateError } = await supabase
                    .from("FMS")
                    .update({
                        pdf: pdfUrl,
                        company: headerInfo.companyName,
                        email: selectedEmail,
                        actual1: currentDate
                    })
                    .eq("complaint_id", complaintId);

                if (updateError) {
                    console.warn("FMS update failed (non-critical):", updateError.message);
                    alert(`Letter PDF generated successfully!\n\nPDF Link: ${pdfUrl}\n\n(Note: FMS auto-update failed.)`);
                } else {
                    alert("Letter PDF generated and saved successfully!");
                }
            } catch (updateErr) {
                console.warn("FMS save error (non-critical):", updateErr);
                alert(`Letter PDF generated successfully!\n\nPDF Link: ${pdfUrl}`);
            }

            setIsSavingPDF(false);
            navigate(-1);

        } catch (error) {
            console.error("Error saving PDF:", error);
            alert("Error: " + error.message);
            setIsSavingPDF(false);
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
                            onClick={handleSavePDF}
                            className={`flex items-center gap-2 px-4 py-2 ${isSavingPDF ? 'bg-gray-400' : 'bg-blue-600'} text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md`}
                            disabled={isSaving || isSavingPDF}
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
                        <div className="mb-4 no-print flex justify-center">
                        {!location.state?.autoSelectCompany && (
                            <select
                                id="company-select"
                                value={headerInfo.companyName}  
                                className="border border-gray-300 rounded px-2 py-1 bg-white text-sm"
                                onChange={(e) => {
                                    const selected = companyOptions.find(c => c.name === e.target.value);
                                    if (selected) {
                                        console.log("=== DROPDOWN SELECTED ===");
                                        console.log("Selected company:", selected.name);
                                        
                                        const newHeaderInfo = {
                                            companyName: selected.name,
                                            address: selected.address,
                                            location: "",
                                            contact: `Phone No. ${selected.phone} | Email : ${selected.email}`
                                        };
                                        
                                        setHeaderInfo(newHeaderInfo);
                                        setSelectedEmail(selected.email);
                                        
                                        const isColumnANTrueLocal = taskData?.columnAN === true || taskData?.columnAN === "true" || taskData?.columnAN === "TRUE";
                                        
                                        if (isColumnANTrueLocal && selected.name.toUpperCase().includes("RBP")) {
                                            setLetterInfo(prev => ({
                                                ...prev,
                                                letterNo: `RBP/SPVPP/SER/25-26/${Math.floor(Math.random() * 900) + 100}`,
                                                officerName: "The DIST INCHARGE",
                                                department: "CREDA DIST OFFICE",
                                                districtOffice: `CREDA DIST OFFICE-${taskData?.district || ""}, DIST:${taskData?.district || ""}`,
                                                subject: "Regarding Rectification of Power Plant Inverter & Battery complaints",
                                                reference: ["Whatsapp"],
                                                salutation: "Dear Sir,",
                                                introParagraph: `With reference to the above subject Complaints M/s Statcon Powtech Service Engineer visited to ${taskData?.block || ""} sites from ${taskData?.actualDate || ""} against Power plant inverter complaints & rectified the inverters. Now System is working satisfactory. (Service report enclosed for your reference).`,
                                                closingParagraph: "Note: Request you to update in your record & close the complaints in your Complaint register.",
                                                thankYou: "Thanking you.",
                                                regards: "Yours faithfully,",
                                                forCompany: "For RBP ENERGY (INDIA) PVT Ltd",
                                                designation: "S.N.Sahoo",
                                                copiesTo: [
                                                    "Executive Engineer (RE-05), CREDA HO, Raipur",
                                                    "Executive Engineer, CREDA ZO, Bilaspur"
                                                ],
                                                companyDetails: {
                                                    phone: selected.phone,
                                                    email: selected.email,
                                                    address: selected.address
                                                }
                                            }));
                                        } else {
                                            setLetterInfo(prev => ({
                                                ...prev,
                                                forCompany: `वास्ते, ${selected.name}`,
                                                companyDetails: {
                                                    phone: selected.phone,
                                                    email: selected.email,
                                                    address: selected.address
                                                }
                                            }));
                                        }
                                    }
                                }}
                            >
                                <option value="">Select Company Header</option>
                                {companyOptions.map((opt, i) => (
                                    <option key={i} value={opt.name}>{opt.name}</option>
                                ))}
                            </select>
                        )}
                        </div>
                        {headerInfo.companyName.includes("RBP") ? (
                            <div className="flex flex-col items-center mb-0 mt-4">
                                <img src="/RBP-Logo.jpg" alt="RBP Logo" className="h-28 object-contain mb-0" />
                            </div>
                        ) : headerInfo.companyName.toLowerCase().includes("rotomag") ? (
                            <div className="flex justify-end mb-4 mt-4">
                                <img src="/rotomag.png?v=3" alt="Rotomag Logo" className="h-32 object-contain" />
                            </div>
                        ) : headerInfo.companyName.toLowerCase().includes("solex") ? (
                            <div className="flex justify-end mb-4 mt-4">
                                <img src="/solex.png" alt="Solex Logo" className="h-24 object-contain" />
                            </div>
                        ) : headerInfo.companyName.toLowerCase().includes("suraj") ? (
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
                        ) : headerInfo.companyName.toLowerCase().includes("premier") ? (
                            <div className="flex justify-start mb-4 mt-4">
                                <img src="/premier.png" alt="Premier Logo" className="h-28 object-contain" />
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

                    {/* Letter Body */}
                    { (taskData?.columnAN === true || taskData?.columnAN === "true" || taskData?.columnAN === "TRUE") && headerInfo.companyName.toUpperCase().includes("RBP") ? (
                        /* ======== RBP ENGLISH FORMAT ======== */
                        <div className="text-sm text-gray-800 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>

                            {/* Letter No + Date */}
                            <div className="flex justify-between items-center mb-5">
                                <input
                                    type="text"
                                    value={letterInfo.letterNo}
                                    onChange={(e) => handleLetterEdit("letterNo", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent font-bold w-72 text-sm"
                                />
                                <div className="flex gap-1 items-center">
                                    <span className="font-bold">Dt:</span>
                                    <input
                                        type="text"
                                        value={letterInfo.date}
                                        onChange={(e) => handleLetterEdit("date", e.target.value)}
                                        className="border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent font-bold w-28 text-sm"
                                    />
                                </div>
                            </div>

                            {/* To Section */}
                            <div className="mb-4 space-y-0.5">
                                <p className="font-bold">To</p>
                                <input
                                    className="w-full font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm py-0.5"
                                    value={letterInfo.officerName}
                                    onChange={(e) => handleLetterEdit("officerName", e.target.value)}
                                />
                                <input
                                    className="w-full font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm py-0.5"
                                    value={letterInfo.department}
                                    onChange={(e) => handleLetterEdit("department", e.target.value)}
                                />
                                <input
                                    className="w-full font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm py-0.5"
                                    value={letterInfo.districtOffice}
                                    onChange={(e) => handleLetterEdit("districtOffice", e.target.value)}
                                />
                            </div>

                            {/* Subject */}
                            <div className="mb-2 flex gap-1 items-start">
                                <span className="font-bold whitespace-nowrap">(Sub:</span>
                                <textarea
                                    className="flex-1 font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent resize-none text-sm leading-snug"
                                    rows="2"
                                    value={letterInfo.subject}
                                    onChange={(e) => handleLetterEdit("subject", e.target.value)}
                                />
                                <span className="font-bold">)</span>
                            </div>

                            {/* Reference */}
                            <div className="mb-4 flex gap-1 items-start">
                                <span className="font-bold whitespace-nowrap">Ref:</span>
                                <div className="flex-1 space-y-1">
                                    {letterInfo.reference?.map((ref, idx) => (
                                        <div key={idx} className="flex gap-1 items-center">
                                            <span className="text-xs shrink-0">{["i","ii","iii","iv","v"][idx] || idx+1})</span>
                                            <input
                                                className="flex-1 border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
                                                value={ref}
                                                onChange={(e) => {
                                                    const newRefs = [...letterInfo.reference];
                                                    newRefs[idx] = e.target.value;
                                                    handleLetterEdit("reference", newRefs);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Salutation */}
                            <div className="mb-3">
                                <input
                                    className="font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
                                    value={letterInfo.salutation}
                                    onChange={(e) => handleLetterEdit("salutation", e.target.value)}
                                />
                            </div>

                            {/* Intro Paragraph */}
                            <div className="mb-3">
                                <textarea
                                    className="w-full border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent resize-none text-sm leading-relaxed"
                                    rows="4"
                                    value={letterInfo.introParagraph}
                                    onChange={(e) => handleLetterEdit("introParagraph", e.target.value)}
                                />
                            </div>

                            {/* Closing Para (before table) */}
                            <div className="mb-4">
                                <textarea
                                    className="w-full border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent resize-none text-sm"
                                    rows="2"
                                    value={letterInfo.closingParagraph}
                                    onChange={(e) => handleLetterEdit("closingParagraph", e.target.value)}
                                />
                            </div>

                            {/* ===== RBP TABLE - Fully Editable ===== */}
                      <div className="my-4 border border-black overflow-x-auto">
    <table className="w-full border-collapse text-xs">
        <thead>
            <tr className="bg-gray-100">
                {tableColumns.map((col, i) => (
                    <th key={i} className={`border border-black p-1.5 font-bold text-center ${
                        col === "Site Name" ? "min-w-[180px]" : 
                        col === "Problem Reported" ? "min-w-[200px]" : 
                        col === "RBP Remarks" ? "min-w-[180px]" : "min-w-[80px]"
                    }`}>{col}</th>
                ))}
                <th className="border border-black p-1 bg-gray-200 w-8 no-print"></th>
            </tr>
        </thead>
        <tbody>
            {(letterInfo.rbpTableRows || tableData).map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-black">
                    {tableColumns.map((col, colIdx) => (
                        <td key={colIdx} className="border border-black p-0">
                            <textarea
                                className="w-full text-left p-1.5 bg-transparent focus:outline-none focus:bg-blue-50 resize-none text-[11px] leading-tight"
                                rows={col === "Problem Reported" ? 2 : 1}
                                value={row[col] || ""}
                                onChange={(e) => {
                                    const newRows = [...(letterInfo.rbpTableRows || tableData)];
                                    newRows[rowIdx] = { ...newRows[rowIdx], [col]: e.target.value };
                                    handleLetterEdit("rbpTableRows", newRows);
                                    setTableData(newRows);
                                }}
                            />
                        </td>
                    ))}
                    <td className="border border-black p-1 text-center no-print">
                        <button
                            onClick={() => {
                                const newRows = (letterInfo.rbpTableRows || tableData).filter((_, i) => i !== rowIdx);
                                handleLetterEdit("rbpTableRows", newRows);
                                setTableData(newRows);
                            }}
                            className="text-red-400 hover:text-red-600 text-xs"
                        >✕</button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
    <button
        className="w-full py-1 text-xs text-blue-600 hover:bg-blue-50 border-t border-black no-print"
        onClick={() => {
            const currentRows = letterInfo.rbpTableRows || tableData;
            const newRow = {};
            tableColumns.forEach(col => {
                if (col === "SR No") {
                    newRow[col] = (currentRows.length + 1).toString().padStart(2, '0') + ".";
                } else {
                    newRow[col] = "-";
                }
            });
            handleLetterEdit("rbpTableRows", [...currentRows, newRow]);
            setTableData([...currentRows, newRow]);
        }}
    >+ Add Row</button>
</div>

{/* Note Section */}
<div className="mb-3">
    <textarea
        className="w-full border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent resize-none text-sm"
        rows="2"
        value={letterInfo.note || "Note: Request you to update in your record & close the complaints in your Complaint register."}
        onChange={(e) => handleLetterEdit("note", e.target.value)}
    />
</div>

{/* Thank You */}
<div className="mb-4">
    <input
        className="border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
        value={letterInfo.thankYou || "Thanking you."}
        onChange={(e) => handleLetterEdit("thankYou", e.target.value)}
    />
</div>

{/* Signature Section */}
<div className="mb-1 mt-8">
    <input
        className="font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
        value={letterInfo.forCompany || "For RBP ENERGY (INDIA) PVT Ltd"}
        onChange={(e) => handleLetterEdit("forCompany", e.target.value)}
    />
</div>
<div className="h-12"></div>
<div className="mb-6">
    <input
        className="font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
        value={letterInfo.designation || "S.N.Sahoo"}
        onChange={(e) => handleLetterEdit("designation", e.target.value)}
    />
</div>

{/* CC Section */}
<div className="text-sm mt-2 space-y-1">
    <p className="font-bold">CC:</p>
    {letterInfo.copiesTo?.map((copy, idx) => (
        <div key={idx} className="flex gap-2 items-center">
            <span className="shrink-0">{idx + 1})</span>
            <input
                className="flex-1 border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
                value={copy}
                onChange={(e) => {
                    const newCopies = [...letterInfo.copiesTo];
                    newCopies[idx] = e.target.value;
                    handleLetterEdit("copiesTo", newCopies);
                }}
            />
        </div>
    ))}
</div>

                            {/* Note */}
                            <div className="mb-2">
                                <textarea
                                    className="w-full border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent resize-none text-sm font-bold"
                                    rows="2"
                                    value={letterInfo.note || "Note: Request you to update in your record & close the complaints in your Complaint register."}
                                    onChange={(e) => handleLetterEdit("note", e.target.value)}
                                />
                            </div>

                            {/* Thank You */}
                            <div className="mb-6">
                                <input
                                    className="border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
                                    value={letterInfo.thankYou}
                                    onChange={(e) => handleLetterEdit("thankYou", e.target.value)}
                                />
                            </div>

                            {/* Signature */}
                            <div className="mb-1">
                                <input
                                    className="font-bold border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
                                    value={letterInfo.forCompany}
                                    onChange={(e) => handleLetterEdit("forCompany", e.target.value)}
                                />
                            </div>
                            <div className="h-10"></div>
                            <div className="mb-4">
                                <input
                                    className="font-bold border-b border-black focus:border-blue-400 focus:outline-none bg-transparent text-sm underline"
                                    value={letterInfo.designation}
                                    onChange={(e) => handleLetterEdit("designation", e.target.value)}
                                />
                            </div>

                            {/* CC */}
                            <div className="text-sm mt-2 space-y-1">
                                <p className="font-bold">CC:</p>
                                {letterInfo.copiesTo?.map((copy, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="shrink-0">{idx + 1})</span>
                                        <input
                                            className="flex-1 border-b border-transparent focus:border-blue-400 focus:outline-none bg-transparent text-sm"
                                            value={copy}
                                            onChange={(e) => {
                                                const newCopies = [...letterInfo.copiesTo];
                                                newCopies[idx] = e.target.value;
                                                handleLetterEdit("copiesTo", newCopies);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                        </div>
                    ) : (
                        <div className="space-y-6 text-base text-gray-800 leading-relaxed font-serif">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2 items-center">
                                <span>पत्र क्र.</span>
                                <input
                                    type="text"
                                    value={letterInfo.letterNo}
                                    onChange={(e) => handleLetterEdit("letterNo", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold w-40"
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <span>दिनांक</span>
                                <input
                                    type="text"
                                    value={letterInfo.date}
                                    onChange={(e) => handleLetterEdit("date", e.target.value)}
                                    className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold w-32"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="font-bold">प्रति,</p>
                            <div className="pl-12 space-y-1">
                                <input
                                    className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent"
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
                            <span className="font-bold whitespace-nowrap min-w-[60px]">विषय:-</span>
                            <textarea
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent h-auto resize-none font-bold align-top pt-0"
                                rows="2"
                                value={letterInfo.subject}
                                onChange={(e) => handleLetterEdit("subject", e.target.value)}
                            />
                        </div>

                        <div className="mt-4 flex gap-2">
                            <span className="font-bold whitespace-nowrap min-w-[60px]">संदर्भ:-</span>
                            <div className="w-full space-y-2">
                                {letterInfo.reference?.map((ref, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="min-w-[20px]">{idx + 1})</span>
                                        <textarea
                                            className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent h-auto resize-none align-top pt-0"
                                            rows="2"
                                            value={ref}
                                            onChange={(e) => {
                                                const newRefs = [...letterInfo.reference];
                                                newRefs[idx] = e.target.value;
                                                handleLetterEdit("reference", newRefs);
                                            }}
                                        />
                                    </div>
                                ))}
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
                        <div className="my-8 overflow-hidden rounded-md border border-black relative">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-black">
                                        {tableColumns.map((col, idx) => (
                                            <th key={idx} className="border-r border-black p-2 text-center text-sm font-bold last:border-r-0">
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
                                                    className="w-full text-center focus:outline-none border-none bg-transparent font-bold"
                                                />
                                            </th>
                                        ))}
                                        {/* Action Header Column for Add Row */}
                                        <th className="p-2 text-center text-sm font-bold bg-gray-100 no-print w-10 border-l border-black">
                                            <button
                                                onClick={addRow}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Add Row"
                                            >
                                                <SquarePlus size={20} />
                                            </button>
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
                                                        value={row[col] || ""}
                                                        onChange={(e) => handleTableEdit(rowIndex, col, e.target.value)}
                                                        className="w-full text-center focus:outline-none border-none bg-transparent font-semibold"
                                                    />
                                                </td>
                                            ))}
                                            {/* Action Column for Delete Row */}
                                            <td className="p-2 text-center text-sm no-print border-l border-black bg-gray-50/50 w-10">
                                                <button
                                                    onClick={() => removeRow(rowIndex)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                    title="Remove Row"
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

                        <div className="mt-10">
                            <input
                                className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left"
                                value={letterInfo.thankYou}
                                onChange={(e) => handleLetterEdit("thankYou", e.target.value)}
                            />
                        </div>

                        {/* Signature Section - MOVED TO LEFT AS REQUESTED */}
                        <div className="mt-12 flex flex-col items-start space-y-1">
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-40"
                                value={letterInfo.regards}
                                onChange={(e) => handleLetterEdit("regards", e.target.value)}
                            />
                            <div className="h-10"></div> {/* Space for signature */}
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-64"
                                value={letterInfo.forCompany}
                                onChange={(e) => handleLetterEdit("forCompany", e.target.value)}
                            />
                            <input
                                className="border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent font-bold text-left w-64"
                                value={letterInfo.designation}
                                onChange={(e) => handleLetterEdit("designation", e.target.value)}
                            />
                        </div>

                        {/* CC Section */}
                        <div className="mt-10 text-sm space-y-2 italic">
                            <p className="font-bold">प्रतिलिपि:—</p>
                            <div className="pl-0 space-y-1">
                                {letterInfo.copiesTo?.map((copy, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="min-w-[20px]">{idx + 1})</span>
                                        <input
                                            className="w-full border-b border-transparent focus:border-blue-300 focus:outline-none bg-transparent"
                                            value={copy}
                                            onChange={(e) => {
                                                const newCopies = [...letterInfo.copiesTo];
                                                newCopies[idx] = e.target.value;
                                                handleLetterEdit("copiesTo", newCopies);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                    {/* Dynamic Footer Section */}
                    {(headerInfo.companyName.toLowerCase().includes("suraj") || headerInfo.companyName.toLowerCase().includes("tanay")) ? null : (
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
        </DashboardLayout>
    );
};

export default AdminLetter;
