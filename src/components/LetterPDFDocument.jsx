import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from "@react-pdf/renderer";
import { LOGO_BASE64, getLogoForCompany } from "../utils/logoBase64";

// Register Hind (simpler Devanagari font) to avoid rendering crashes
Font.register({
    family: "Hind",
    fonts: [
        {
            src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hind/Hind-Regular.ttf",
            fontWeight: "normal",
        },
        {
            src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hind/Hind-Bold.ttf",
            fontWeight: "bold",
        },
    ],
});

// Also register a Latin font for English text
Font.register({
    family: "NotoSans",
    fonts: [
        {
            src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
            fontWeight: "normal",
        },
        {
            src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
            fontWeight: "bold",
        },
    ],
});

// A4 dimensions: 595.28 x 841.89 points
const styles = StyleSheet.create({
    page: {
        paddingTop: 150,
        paddingBottom: 130,
        paddingLeft: 40,
        paddingRight: 40,
        fontFamily: "Hind",
        fontSize: 10,
        color: "#000000",
        lineHeight: 1.3,
        hyphenation: false,
    },

    // Header
    headerContainer: {
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        paddingBottom: 8,
        marginBottom: 12,
    },
    headerTopRow: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 4,
    },
    logoContainer: {
        width: 150,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 20,
    },
    logoContainerSmall: {
        width: 120,
        height: 70,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 20,
    },
    logo: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },
    companyInfoContainer: {
        flex: 1,
        alignItems: "center",
    },
    companyName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        textAlign: "center",
        fontFamily: "NotoSans",
        letterSpacing: 1,
    },
    headerDetail: {
        fontSize: 8,
        textAlign: "center",
        color: "#333333",
        marginTop: 2,
    },
    // Suraj header styles
    surajHeaderContainer: {
        width: "100%",
        marginBottom: 8,
    },
    surajTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    surajName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#ed7d31",
        fontFamily: "NotoSans",
        letterSpacing: -0.5,
    },
    surajDealsLabel: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#ed7d31",
        marginTop: 4,
        marginLeft: 8,
    },
    surajList: {
        fontSize: 7,
        fontWeight: "bold",
        color: "#ed7d31",
        lineHeight: 1.3,
    },
    surajPropInfo: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#ed7d31",
        textAlign: "right",
    },
    surajDivider: {
        borderBottomWidth: 2,
        borderBottomColor: "#ed7d31",
        marginVertical: 4,
    },
    surajAddress: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#ed7d31",
        textAlign: "center",
    },
    // Logo right aligned container
    logoRightContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 8,
    },
    logoRightImage: {
        width: 180,
        height: 80,
        objectFit: "contain",
    },

    // Letter Info Row
    letterInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        marginTop: 2,
    },
    letterInfoText: {
        fontSize: 10,
        fontWeight: "bold",
    },

    // Recipient
    recipientBlock: {
        marginBottom: 4,
    },
    recipientLabel: {
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 2,
    },
    recipientIndented: {
        paddingLeft: 30,
        fontSize: 10,
        lineHeight: 1.4,
    },

    // Subject & Reference
    sectionBlock: {
        marginBottom: 4,
    },
    labelBold: {
        fontWeight: "bold",
        fontSize: 10,
    },
    bodyText: {
        fontSize: 10,
        textAlign: "left",
        lineHeight: 1.4,
        hyphenation: false,
    },
    referenceItem: {
        fontSize: 10,
        paddingLeft: 15,
        marginBottom: 2,
    },

    // Table
    tableContainer: {
        marginTop: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: "#000000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
    },
    tableRowLast: {
        flexDirection: "row",
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
    },
    tableCell: {
        padding: 4,
        fontSize: 8,
        textAlign: "center",
        borderRightWidth: 1,
        borderRightColor: "#000000",
        flex: 1,
    },
    tableCellLast: {
        padding: 4,
        fontSize: 8,
        textAlign: "center",
        flex: 1,
    },
    tableHeaderCell: {
        padding: 4,
        fontSize: 8,
        fontWeight: "bold",
        textAlign: "center",
        borderRightWidth: 1,
        borderRightColor: "#000000",
        flex: 1,
    },
    tableHeaderCellLast: {
        padding: 4,
        fontSize: 8,
        fontWeight: "bold",
        textAlign: "center",
        flex: 1,
    },

    // Closing
    closingText: {
        fontSize: 10,
        textAlign: "left",
        lineHeight: 1.4,
        marginTop: 6,
        hyphenation: false,
    },
    thankYou: {
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "left",
        marginTop: 10,
    },

    // Signature
    signatureBlock: {
        marginTop: 15,
        alignItems: "flex-start",
    },
    signatureText: {
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 2,
    },

    // Copies To
    copiesBlock: {
        marginTop: 10,
        fontSize: 9,
    },
    copiesLabel: {
        fontWeight: "bold",
        marginBottom: 4,
    },
    copyItem: {
        fontSize: 9,
        paddingLeft: 15,
        marginBottom: 2,
    },

    // Footer
    footerContainer: {
        position: "absolute",
        bottom: 20,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: "#cccccc",
        paddingTop: 8,
    },
    footerText: {
        fontSize: 7,
        color: "#666666",
        textAlign: "center",
    },
    // RBP Footer
    rbpFooter: {
        fontSize: 7,
        textAlign: "center",
        lineHeight: 1.4,
    },
    rbpFooterBold: {
        fontSize: 8,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    // Rotomag Footer
    rotomagFooter: {
        fontSize: 7,
        textAlign: "center",
        lineHeight: 1.4,
    },
    // Solex Footer
    solexFooter: {
        fontSize: 6,
        textAlign: "left",
        lineHeight: 1.3,
        color: "#333333",
    },
    solexFooterBold: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#f58220",
        marginBottom: 2,
    },
    solexFooterOrange: {
        fontSize: 6,
        color: "#f58220",
        fontWeight: "bold",
    },
    solexFooterBlue: {
        fontSize: 6,
        color: "#0066cc",
        textDecoration: "underline",
    },
    solexDivider: {
        borderBottomWidth: 2,
        borderBottomColor: "#f58220",
        marginTop: 4,
        paddingTop: 4,
    },
    // Premier Footer
    premierFooter: {
        fontSize: 6,
        textAlign: "center",
        lineHeight: 1.4,
    },
    premierColorBar: {
        flexDirection: "row",
        marginBottom: 6,
    },
    premierBlueBar: {
        flex: 1,
        backgroundColor: "#4472c4",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 12,
        paddingRight: 12,
    },
    premierGreenBar: {
        flex: 1,
        backgroundColor: "#70ad47",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 12,
        paddingRight: 12,
    },
    premierBarText: {
        fontSize: 6,
        color: "#ffffff",
        fontWeight: "bold",
    },
    premierTitle: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#2f5597",
        textAlign: "center",
        marginBottom: 4,
    },
    premierText: {
        fontSize: 6,
        color: "#2f5597",
        textAlign: "center",
    },
});

const LetterPDFDocument = ({ headerInfo, letterInfo, tableColumns, tableData }) => {
    const logoSrc = getLogoForCompany(headerInfo.companyName);
    const isSuraj = headerInfo.companyName && headerInfo.companyName.toLowerCase().includes('suraj');
    const isRotomag = headerInfo.companyName && headerInfo.companyName.toLowerCase().includes('rotomag');
    const isSolex = headerInfo.companyName && headerInfo.companyName.toLowerCase().includes('solex');
    const isPremier = headerInfo.companyName && headerInfo.companyName.toLowerCase().includes('premier');
    const isRBP = headerInfo.companyName && headerInfo.companyName.toLowerCase().includes('rbp');
    const isTanay = headerInfo.companyName && headerInfo.companyName.toLowerCase().includes('tanay');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ===== HEADER - Fixed on every page ===== */}
                <View style={{ position: "absolute", top: 15, left: 40, right: 40, borderBottomWidth: (isSuraj || isTanay) ? 0 : 2, borderBottomColor: "#000000", paddingBottom: 8 }} fixed>
                    {isRBP && logoSrc ? (
                        /* RBP - Centered logo */
                        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 0 }}>
                            <Image src={logoSrc} style={{ width: 220, height: 110, objectFit: "contain" }} />
                        </View>
                    ) : isRotomag && logoSrc ? (
                        /* Rotomag - Right aligned, h-28 */
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8, marginTop: 8 }}>
                            <Image src={logoSrc} style={{ width: 200, height: 110, objectFit: "contain" }} />
                        </View>
                    ) : isSolex && logoSrc ? (
                        /* Solex - Right aligned, h-24 */
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 16, marginTop: 16 }}>
                            <Image src={logoSrc} style={{ width: 180, height: 96, objectFit: "contain" }} />
                        </View>
                    ) : isPremier && logoSrc ? (
                        /* Premier - Left aligned, h-28 */
                        <View style={{ flexDirection: "row", justifyContent: "flex-start", marginBottom: 16, marginTop: 16 }}>
                            <Image src={logoSrc} style={{ width: 200, height: 112, objectFit: "contain" }} />
                        </View>
                    ) : isSuraj ? (
                        /* Suraj - Custom text header */
                        <View style={{ width: "100%", marginBottom: 16, fontFamily: "NotoSans" }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <View>
                                    <Text style={{ fontSize: 32, fontWeight: "bold", color: "#ed7d31", letterSpacing: -1, lineHeight: 1.1 }}>
                                        Suraj Enterprises
                                    </Text>
                                    <View style={{ marginLeft: 8, marginTop: 14 }}>
                                        <Text style={{ fontSize: 8, fontWeight: "bold", color: "#ed7d31", marginBottom: 2 }}>Deals of -</Text>
                                        <Text style={{ fontSize: 7, fontWeight: "bold", color: "#ed7d31", lineHeight: 1.3 }}>• Civil & Electrical Works</Text>
                                        <Text style={{ fontSize: 7, fontWeight: "bold", color: "#ed7d31", lineHeight: 1.3 }}>• Renewable Sources of Energy</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ fontSize: 11, fontWeight: "bold", color: "#ed7d31", marginBottom: 4 }}>Prop. Rahul Kumar Sharma</Text>
                                    <Text style={{ fontSize: 8, fontWeight: "bold", color: "#ed7d31", marginBottom: 4 }}>Call- 88895-44440, 70240-58958</Text>
                                    <Text style={{ fontSize: 8, fontWeight: "bold", color: "#ed7d31" }}>Email - surajenterprise0587@gmail.com</Text>
                                </View>
                            </View>
                            <View style={{ borderBottomWidth: 2, borderBottomColor: "#ed7d31", marginVertical: 4 }} />
                            <Text style={{ fontSize: 8, fontWeight: "bold", color: "#ed7d31", textAlign: "center", marginVertical: 4 }}>
                                Jayanti Nagar, Shri Ram Chowk, Sikola Bhata, Durg (C.G.) 491001
                            </Text>
                            <View style={{ borderBottomWidth: 2, borderBottomColor: "#ed7d31", marginVertical: 4 }} />
                        </View>
                    ) : isTanay ? (
                        /* Tanay - Text header with custom padding and increased spacing */
                        <View style={{ alignItems: "center", marginTop: 16, paddingBottom: 10 }}>
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1f2937", textAlign: "center", letterSpacing: 1, marginBottom: 8 }}>
                                {headerInfo.companyName || "TANAY VIDHYUT (I) PVT. LTD."}
                            </Text>
                            <Text style={{ fontSize: 9, color: "#333333", textAlign: "center", marginTop: 6 }}>
                                {headerInfo.address || ""}
                            </Text>
                            {headerInfo.location ? (
                                <Text style={{ fontSize: 9, fontWeight: "medium", color: "#333333", textAlign: "center", marginTop: 4 }}>
                                    {headerInfo.location}
                                </Text>
                            ) : null}
                            <Text style={{ fontSize: 9, color: "#333333", textAlign: "center", marginTop: 4 }}>
                                {headerInfo.contact || ""}
                            </Text>
                        </View>
                    ) : (
                        /* Default - Text header */
                        <View style={{ alignItems: "center", marginTop: 16 }}>
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1f2937", textAlign: "center", letterSpacing: 1, marginBottom: 4 }}>
                                {headerInfo.companyName || ""}
                            </Text>
                            <Text style={{ fontSize: 9, color: "#333333", textAlign: "center", marginTop: 4 }}>
                                {headerInfo.address || ""}
                            </Text>
                            {headerInfo.location ? (
                                <Text style={{ fontSize: 9, fontWeight: "medium", color: "#333333", textAlign: "center", marginTop: 2 }}>
                                    {headerInfo.location}
                                </Text>
                            ) : null}
                            <Text style={{ fontSize: 9, color: "#333333", textAlign: "center", marginTop: 2 }}>
                                {headerInfo.contact || ""}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ===== LETTER NO & DATE ===== */}
                <View style={styles.letterInfoRow}>
                    <Text style={styles.letterInfoText}>
                        पत्र क्र.: {letterInfo.letterNo || ""}
                    </Text>
                    <Text style={styles.letterInfoText}>
                        दिनांक: {letterInfo.date || ""}
                    </Text>
                </View>

                {/* ===== RECIPIENT ===== */}
                <View style={styles.recipientBlock}>
                    <Text style={styles.recipientLabel}>प्रति,</Text>
                    <View style={styles.recipientIndented}>
                        <Text>{letterInfo.officerName || ""}</Text>
                        <Text>{letterInfo.department || ""}</Text>
                        <Text>{letterInfo.districtOffice || ""}</Text>
                    </View>
                </View>

                {/* ===== SUBJECT ===== */}
                <View style={styles.sectionBlock}>
                    <Text style={styles.bodyText}>
                        <Text style={styles.labelBold}>विषय:- </Text>
                        {letterInfo.subject || ""}
                    </Text>
                </View>

                {/* ===== REFERENCE ===== */}
                <View style={styles.sectionBlock}>
                    <Text style={styles.labelBold}>संदर्भ:-</Text>
                    {(letterInfo.reference || []).map((ref, idx) => (
                        <Text key={idx} style={styles.referenceItem}>
                            {idx + 1}. {ref}
                        </Text>
                    ))}
                </View>

                {/* ===== SALUTATION & INTRO ===== */}
                <View style={styles.sectionBlock}>
                    <Text style={styles.bodyText}>
                        {letterInfo.salutation || ""}
                    </Text>
                    <Text style={[styles.bodyText, { marginTop: 6 }]}>
                        {letterInfo.introParagraph || ""}
                    </Text>
                </View>

                {/* ===== DYNAMIC TABLE ===== */}
                {tableColumns && tableColumns.length > 0 && (
                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                            {tableColumns.map((col, idx) => (
                                <Text
                                    key={idx}
                                    style={
                                        idx === tableColumns.length - 1
                                            ? styles.tableHeaderCellLast
                                            : styles.tableHeaderCell
                                    }
                                >
                                    {col}
                                </Text>
                            ))}
                        </View>

                        {/* Table Body */}
                        {(tableData || []).map((row, rowIdx) => (
                            <View
                                key={rowIdx}
                                style={
                                    rowIdx === (tableData || []).length - 1
                                        ? styles.tableRowLast
                                        : styles.tableRow
                                }
                            >
                                {tableColumns.map((col, colIdx) => (
                                    <Text
                                        key={colIdx}
                                        style={
                                            colIdx === tableColumns.length - 1
                                                ? styles.tableCellLast
                                                : styles.tableCell
                                        }
                                    >
                                        {row[col] || ""}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* ===== CLOSING PARAGRAPH ===== */}
                <Text style={styles.closingText}>
                    {letterInfo.closingParagraph || ""}
                </Text>

                {/* ===== THANK YOU ===== */}
                <Text style={styles.thankYou}>
                    {letterInfo.thankYou || ""}
                </Text>

                {/* ===== SIGNATURE ===== */}
                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureText}>
                        {letterInfo.regards || ""}
                    </Text>
                    <Text style={[styles.signatureText, { marginTop: 25 }]}>
                        {letterInfo.forCompany || ""}
                    </Text>
                    <Text style={styles.signatureText}>
                        {letterInfo.designation || ""}
                    </Text>
                </View>

                {/* ===== COPIES TO ===== */}
                <View style={styles.copiesBlock}>
                    <Text style={styles.copiesLabel}>प्रतिलिपि:—</Text>
                    {(letterInfo.copiesTo || []).map((copy, idx) => (
                        <Text key={idx} style={styles.copyItem}>
                            {idx + 1}. {copy}
                        </Text>
                    ))}
                </View>

                {/* ===== FOOTER - Fixed on every page ===== */}
                <View style={{ position: "absolute", bottom: 20, left: 40, right: 40, borderTopWidth: (isSuraj || isTanay) ? 0 : 1, borderTopColor: "#000000", paddingTop: 4 }} fixed>
                    {isRBP ? (
                        /* RBP Footer */
                        <View>
                            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#000000", textAlign: "center", marginBottom: 4, letterSpacing: 1 }}>
                                RBP ENERGY (INDIA) PVT. LTD.
                            </Text>
                            <Text style={{ fontSize: 9, color: "#1f2937", textAlign: "center", marginBottom: 4 }}>
                                303 Guru Ghasidas Plaza, Amapara, G.E Road, Raipur (C.G) 492001
                            </Text>
                            <Text style={{ fontSize: 8, color: "#1f2937", textAlign: "center" }}>
                                <Text style={{ color: "#00CCCC", fontWeight: "bold" }}>T :</Text> 9200012500{" "}
                                <Text style={{ color: "#00CCCC", fontWeight: "bold" }}>Email :</Text> info@rbpindia.com, {" "}
                                <Text style={{ color: "#00CCCC", fontWeight: "bold" }}>Website :</Text> www.rbpindia.com
                            </Text>
                        </View>
                    ) : isRotomag ? (
                        /* Rotomag Footer */
                        <View>
                            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: 4 }}>
                                CIN No. : U34100GJ1993PTCO20063
                            </Text>
                            <Text style={{ fontSize: 9, color: "#1f2937", textAlign: "center", marginBottom: 4 }}>
                                Regd.Off. : 2102/3&4, GIDC Estate, Vitthal Udyognagar Gujarat-388 121, India
                            </Text>
                            <Text style={{ fontSize: 8, color: "#1f2937", textAlign: "center", marginBottom: 4 }}>
                                Ph. : +91-2692-236005, 236409(Unit), 230430, 9227110023/24/25 (unit 2) Fax:+91-2692-239805
                            </Text>
                            <Text style={{ fontSize: 8, color: "#1e40af", textDecoration: "underline", textAlign: "center" }}>
                                Mail@rotomag.com | www.rotomag.com
                            </Text>
                        </View>
                    ) : isSolex ? (
                        /* Solex Footer */
                        <View style={{ fontFamily: "NotoSans" }}>
                            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#f58220", textAlign: "center", marginBottom: 4, letterSpacing: 1 }}>
                                Solex Energy Limited
                            </Text>
                            <Text style={{ fontSize: 8, fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: 6 }}>
                                (Formerly known as SOLEX ENERGY PVT LTD)
                            </Text>
                            <Text style={{ fontSize: 7, color: "#1f2937", textAlign: "left", marginBottom: 4, lineHeight: 1.3 }}>
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Regd. Off & Works:</Text> Plot No: 131/A, Phase - 1, Nr. Krimy, H M Road, G. I. D. C, Vitthal Udyognagar - 388121, Dist: Anand (Gujarat), India.
                            </Text>
                            <Text style={{ fontSize: 7, color: "#1f2937", textAlign: "left", marginBottom: 4, lineHeight: 1.3 }}>
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Customer Care:</Text> 1800 233 28298{" "}
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Tel.:</Text> +91-2692-230317{" "}
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Fax:</Text> +91-2692-231216{" "}
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Mob.</Text> +91 94265 91750
                            </Text>
                            <Text style={{ fontSize: 7, color: "#1f2937", textAlign: "left", marginBottom: 4, lineHeight: 1.3 }}>
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Mail:</Text>{" "}
                                <Text style={{ color: "#1e40af", textDecoration: "underline" }}>solexin14@gmail.com</Text>,{" "}
                                <Text style={{ color: "#1e40af", textDecoration: "underline" }}>info@solex.in</Text>{" "}
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>Web:</Text>{" "}
                                <Text style={{ color: "#1e40af", textDecoration: "underline" }}>www.solex.in</Text>{" "}
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>CIN:</Text> L40106GJ2014PLC081036
                            </Text>
                            <Text style={{ fontSize: 7, color: "#1f2937", textAlign: "left", marginBottom: 6, lineHeight: 1.3 }}>
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>GST No.:</Text> 24AAVCS0328R1ZN{" "}
                                <Text style={{ fontWeight: "bold", color: "#f58220" }}>PAN No.:</Text> AAVCS 0328 R
                            </Text>
                            <View style={{ borderTopWidth: 2, borderTopColor: "#f58220", paddingTop: 4, marginTop: 4 }}>
                                <Text style={{ fontSize: 7, color: "#f58220", fontWeight: "bold", textAlign: "center", letterSpacing: 1 }}>
                                    Mfg. Of SPV Module, Solar Lighting System, Solar Rooftop System, Solar Pumping Systems & Solar Power Plants
                                </Text>
                            </View>
                        </View>
                    ) : isPremier ? (
                        /* Premier Footer */
                        <View style={{ fontFamily: "NotoSans" }}>
                            {/* Color Bar - Simplified without icons */}
                            <View style={{ flexDirection: "row", marginBottom: 8 }}>
                                <View style={{ flex: 1, backgroundColor: "#4472c4", paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16 }}>
                                    <Text style={{ fontSize: 8, color: "#ffffff", fontWeight: "bold" }}>✉ info@premierenergies.com</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: "#70ad47", paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16 }}>
                                    <Text style={{ fontSize: 8, color: "#ffffff", fontWeight: "bold", textAlign: "right" }}>🌐 www.premierenergies.com</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#2f5597", textAlign: "center", marginBottom: 6, letterSpacing: 1 }}>
                                PREMIER ENERGIES LTD.
                            </Text>
                            <Text style={{ fontSize: 7, color: "#2f5597", textAlign: "center", marginBottom: 4 }}>
                                Regd Office: Sy.No.54/Part, Above G.Pulla Reddy Sweets, Vikrampuri, Secunderabad-500009, Telangana, India
                            </Text>
                            <Text style={{ fontSize: 7, color: "#2f5597", textAlign: "center", marginBottom: 6 }}>
                                Factory: Sy.No. 53, Annaram Village, Gummadidala-Mandal, Sangareddy District. -502313, Telangana, India.
                            </Text>
                            <Text style={{ fontSize: 7, color: "#2f5597", textAlign: "center" }}>
                                <Text style={{ fontWeight: "bold" }}>+91-40-27744415/16</Text>{" "}
                                <Text style={{ color: "#d1d5db" }}>|</Text>{" "}
                                <Text style={{ fontWeight: "bold" }}>GST: 36AABCP8800D1ZP</Text>
                            </Text>
                        </View>
                    ) : isSuraj || isTanay ? (
                        /* Suraj & Tanay - No footer */
                        null
                    ) : (
                        /* Default Footer */
                        <View>
                            <Text style={{ fontSize: 9, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
                                {headerInfo.companyName || ""}
                            </Text>
                            <Text style={{ fontSize: 8, textAlign: "center", marginBottom: 2 }}>
                                {headerInfo.address || ""}
                            </Text>
                            <Text style={{ fontSize: 8, textAlign: "center" }}>
                                {headerInfo.contact || ""}
                            </Text>
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};

export default LetterPDFDocument;
