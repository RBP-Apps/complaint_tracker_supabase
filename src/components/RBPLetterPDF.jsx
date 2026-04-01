import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 60,
        paddingLeft: 40,
        paddingRight: 40,
        fontSize: 9,
        backgroundColor: "#ffffff",
        fontFamily: "Helvetica",
    },
    // ---- HEADER ----
    header: {
        alignItems: "center",
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingBottom: 8,
    },
    logo: {
        width: 80,
        height: 45,
        objectFit: "contain",
        marginBottom: 4,
    },
    companyName: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 7.5,
        textAlign: "center",
        color: "#333",
        marginBottom: 1,
    },
    // ---- LETTER NO + DATE ----
    letterNoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        marginBottom: 10,
    },
    boldText: {
        fontFamily: "Helvetica-Bold",
    },
    // ---- TO SECTION ----
    toSection: {
        marginBottom: 8,
    },
    toLabel: {
        fontFamily: "Helvetica-Bold",
        marginBottom: 2,
    },
    toLine: {
        fontFamily: "Helvetica-Bold",
        marginBottom: 1,
    },
    // ---- SUB + REF ----
    subRow: {
        flexDirection: "row",
        marginBottom: 4,
        marginTop: 4,
    },
    subLabel: {
        fontFamily: "Helvetica-Bold",
        minWidth: 30,
    },
    subText: {
        fontFamily: "Helvetica-Bold",
        flex: 1,
        textAlign: "justify",
    },
    refRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    refLabel: {
        fontFamily: "Helvetica-Bold",
        minWidth: 30,
    },
    refText: {
        flex: 1,
    },
    // ---- SALUTATION + BODY ----
    salutation: {
        marginBottom: 6,
        fontFamily: "Helvetica-Bold",
    },
    paragraph: {
        marginBottom: 8,
        textAlign: "justify",
        lineHeight: 1.3,
    },
    closingPara: {
        marginBottom: 8,
        lineHeight: 1.3,
    },
    // ---- TABLE ----
    table: {
        width: "100%",
        marginTop: 5,
        marginBottom: 5,
        borderWidth: 0.5,
        borderColor: "#000000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#000000",
    },
    tableRowLast: {
        flexDirection: "row",
    },
    tableHeaderCell: {
        padding: 3,
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        borderRightWidth: 0.5,
        borderRightColor: "#000000",
        textAlign: "center",
        backgroundColor: "#f0f0f0",
    },
    tableCell: {
        padding: 3,
        fontSize: 7,
        borderRightWidth: 0.5,
        borderRightColor: "#000000",
        textAlign: "center",
        justifyContent: "center",
    },
    tableCellLast: {
        padding: 3,
        fontSize: 7,
        textAlign: "center",
        justifyContent: "center",
    },
    tableHeaderCellLast: {
        padding: 3,
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        backgroundColor: "#f0f0f0",
    },
    // ---- SIGNATURE ----
    signatureSection: {
        marginTop: 15,
        marginBottom: 5,
    },
    signatureName: {
        fontFamily: "Helvetica-Bold",
        textDecoration: "underline",
        marginTop: 25,
    },
    // ---- CC ----
    ccSection: {
        marginTop: 10,
        fontSize: 8,
    },
    // ---- FOOTER ----
    footer: {
        position: "absolute",
        bottom: 15,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 7,
        borderTopWidth: 0.5,
        borderTopColor: "#000000",
        paddingTop: 4,
        color: "#333",
    },
});

const RBPLetterPDF = ({ letterInfo, headerInfo, tableData, taskData, tableColumns }) => {
    const letter = letterInfo || {};
    
    // Resolve table columns from letterInfo or prop
    const columns = tableColumns || (letter.rbpTableRows && letter.rbpTableRows.length > 0 
        ? Object.keys(letter.rbpTableRows[0]) 
        : ["SR No", "Site Name", "District", "System Rating", "Installation date", "Problem Reported", "RBP Remarks"]);

    const rows = letter.rbpTableRows || tableData || [];

    // Helper for column widths - smarter distribution
    const getColStyle = (colName, index) => {
        const totalCols = columns.length;
        if (totalCols > 8) {
            // Street Light format (11 cols)
            if (colName.includes("VILLAGE") || colName.includes("Site Name")) return { flex: 2 };
            if (colName.includes("NO.")) return { flex: 0.5 };
            return { flex: 1 };
        } else {
            // Standard format (7 cols)
            if (index === 1 || index === totalCols - 1) return { flex: 2 };
            if (index === 0) return { flex: 0.5 };
            return { flex: 1 };
        }
    };

    return (
        <Document title={`Letter - ${letter.letterNo || "Draft"}`}>
            <Page size="A4" style={styles.page}>

                {/* ===== HEADER ===== */}
                <View style={styles.header}>
                    <Image style={styles.logo} src="/RBP-Logo.jpg" />
                    <Text style={styles.companyName}>RBP ENERGY (INDIA) PVT. LTD.</Text>
                    <Text style={styles.companyAddress}>
                        303 Guru Ghasidas Plaza, Amapara, G.E Road, Raipur (C.G) 492001
                    </Text>
                    <Text style={styles.companyAddress}>
                        T: 9200012500 | Email: info@rbpindia.com | Website: www.rbpindia.com
                    </Text>
                </View>

                {/* ===== LETTER NO + DATE ===== */}
                <View style={styles.letterNoRow}>
                    <Text style={styles.boldText}>{letter.letterNo}</Text>
                    <Text>Dt: {letter.date}</Text>
                </View>

                {/* ===== TO SECTION ===== */}
                <View style={styles.toSection}>
                    <Text style={styles.toLabel}>To</Text>
                    <Text style={styles.toLine}>{letter.officerName}</Text>
                    <Text style={styles.toLine}>{letter.department}</Text>
                    <Text style={styles.toLine}>{letter.districtOffice}</Text>
                </View>

                {/* ===== SUBJECT ===== */}
                <View style={styles.subRow}>
                    <Text style={styles.subLabel}>(Sub:</Text>
                    <Text style={styles.subText}>{letter.subject}</Text>
                    <Text style={styles.subLabel}>)</Text>
                </View>

                {/* ===== REFERENCE ===== */}
                <View style={styles.refRow}>
                    <Text style={styles.refLabel}>Ref:</Text>
                    <Text style={styles.refText}>
                        {(letter.reference || []).map((ref, idx) => `${["i","ii","iii","iv","v"][idx] || idx+1}) ${ref}`).join("  ")}
                    </Text>
                </View>

                {/* ===== SALUTATION ===== */}
                <Text style={styles.salutation}>{letter.salutation}</Text>

                {/* ===== BODY PARAGRAPH ===== */}
                <Text style={styles.paragraph}>{letter.introParagraph}</Text>

                {/* ===== CLOSING PARA (before table) ===== */}
                <Text style={styles.closingPara}>{letter.closingParagraph}</Text>

                {/* ===== TABLE ===== */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableRow}>
                        {columns.map((col, i) => (
                            <Text 
                                key={i} 
                                style={[
                                    i === columns.length - 1 ? styles.tableHeaderCellLast : styles.tableHeaderCell, 
                                    getColStyle(col, i),
                                    columns.length > 8 ? { fontSize: 6, padding: 2 } : {} 
                                ]}
                            >
                                {col}
                            </Text>
                        ))}
                    </View>

                    {/* Data Rows */}
                    {rows.map((row, idx) => (
                        <View key={idx} style={idx === rows.length - 1 ? styles.tableRowLast : styles.tableRow}>
                            {columns.map((col, i) => (
                                <Text 
                                    key={i} 
                                    style={[
                                        i === columns.length - 1 ? styles.tableCellLast : styles.tableCell, 
                                        getColStyle(col, i),
                                        columns.length > 8 ? { fontSize: 6, padding: 2 } : {}
                                    ]}
                                >
                                    {row[col] || "-"}
                                </Text>
                            ))}
                        </View>
                    ))}
                </View>

                {/* ===== NOTE ===== */}
                {letter.note && (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.paragraph, { fontFamily: "Helvetica-Bold" }]}>{letter.note}</Text>
                    </View>
                )}

                {/* ===== THANK YOU ===== */}
                <Text style={{ marginBottom: 15 }}>{letter.thankYou || "Thanking you."}</Text>

                {/* ===== SIGNATURE ===== */}
                <View style={styles.signatureSection}>
                    <Text style={styles.boldText}>{letter.forCompany}</Text>
                    <Text style={styles.signatureName}>{letter.designation || "S.N.Sahoo"}</Text>
                </View>

                {/* ===== CC SECTION ===== */}
                {letter.copiesTo && letter.copiesTo.length > 0 && (
                    <View style={styles.ccSection}>
                        <Text style={styles.boldText}>CC:</Text>
                        {letter.copiesTo.map((c, i) => (
                            <Text key={i} style={{ marginTop: 1 }}>{i+1}) {c}</Text>
                        ))}
                    </View>
                )}

                {/* ===== FOOTER ===== */}
                <View style={styles.footer}>
                    <Text>RBP ENERGY (INDIA) PVT. LTD. | 303 Guru Ghasidas Plaza, Amapara, G.E. Road, Raipur (C.G.) 492001 | T: 9200012500 | info@rbpindia.com</Text>
                </View>

            </Page>
        </Document>
    );
};

export default RBPLetterPDF;