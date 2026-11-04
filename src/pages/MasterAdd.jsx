"use client";

import { useEffect, useState, useMemo } from "react";
import supabase from "../utils/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  Building2,
  PhoneCall,
  Folder,
  MapPin,
  UserCheck,
  Shield,
  Activity,
  Building,
  Handshake,
  Package,
  CheckSquare,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Database,
  Stamp,
  FileSignature,
  UploadCloud,
  Eye,
  Image as ImageIcon,
  Maximize2
} from "lucide-react";

// Master categories definition with icons and description
const MASTER_CATEGORIES = [
  {
    id: "company_name",
    label: "Company Name",
    dbField: "company_name",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Master list of company names, modes of call, and project references.",
    inputs: [
      { key: "company_name", label: "Company Name", placeholder: "e.g. Tata Power, Adani Solar, NTPC", type: "text", required: true },
      { key: "mode_of_call", label: "Mode of Call", placeholder: "e.g. Phone Call, WhatsApp, Email, Web Portal", type: "text" },
      { key: "project_name", label: "Project Name", placeholder: "e.g. PM-KUSUM Scheme, Rooftop Phase-2", type: "text" }
    ]
  },
  {
    id: "mode_of_call",
    label: "Mode of Call",
    dbField: "mode_of_call",
    icon: PhoneCall,
    color: "from-purple-500 to-pink-600",
    lightBg: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Intake channels for complaints (e.g. Phone, WhatsApp, Email, Portal, In-Person).",
    inputs: [
      { key: "mode_of_call", label: "Mode of Call", placeholder: "e.g. Phone Call, WhatsApp, Email, Web Portal", type: "text", required: true }
    ]
  },
  {
    id: "mode_of_letter",
    label: "Mode of Letter",
    dbField: "mode_of_letter",
    icon: Mail,
    color: "from-fuchsia-500 to-rose-600",
    lightBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    description: "Dispatch modes for letters (e.g. Speed Post, Registered Post, Courier, By Hand, Email).",
    inputs: [
      { key: "mode_of_letter", label: "Mode of Letter", placeholder: "e.g. Speed Post, Registered Post, Courier, By Hand, Email", type: "text", required: true }
    ]
  },
  {
    id: "project_name",
    label: "Project Name",
    dbField: "project_name",
    icon: Folder,
    color: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Active project names, solar installations, and operational sites.",
    inputs: [
      { key: "project_name", label: "Project Name", placeholder: "e.g. PM-KUSUM Scheme, Rooftop Phase-2", type: "text", required: true }
    ]
  },
  {
    id: "district",
    label: "District",
    dbField: "district",
    icon: MapPin,
    color: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Districts, cities, and operational regions for complaint filtering.",
    inputs: [
      { key: "district", label: "District Name", placeholder: "e.g. Patna, Gaya, Muzaffarpur, Bhagalpur", type: "text", required: true }
    ]
  },
  {
    id: "technician",
    label: "Technician",
    dbField: "technician_name",
    icon: UserCheck,
    color: "from-cyan-500 to-blue-600",
    lightBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Service technicians with contact numbers for job dispatch and tracking.",
    inputs: [
      { key: "technician_name", label: "Technician Name", placeholder: "e.g. Ramesh Kumar", type: "text", required: true },
      { key: "technician_contact", label: "Contact Number", placeholder: "e.g. 9876543210", type: "tel", maxLength: 15 }
    ]
  },
  {
    id: "insurance_type",
    label: "Insurance Type",
    dbField: "insurance_type",
    icon: Shield,
    color: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Insurance policy and warranty coverage categories.",
    inputs: [
      { key: "insurance_type", label: "Insurance Type", placeholder: "e.g. Comprehensive, Transit, Equipment Warranty", type: "text", required: true }
    ]
  },
  {
    id: "tracker_status",
    label: "Tracker Status",
    dbField: "tracker_status",
    icon: Activity,
    color: "from-rose-500 to-red-600",
    lightBg: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Status options used across technician and complaint trackers.",
    inputs: [
      { 
        key: "tracker_status", 
        label: "Tracker Status", 
        placeholder: "Select or type status", 
        type: "select", 
        options: ["Active", "Inactive", "Pending", "Resolved", "In Progress"],
        required: true 
      }
    ]
  },
  {
    id: "company_name1",
    label: "Beneficiary / Company 1",
    dbField: "company_name1",
    icon: Building,
    color: "from-indigo-500 to-violet-600",
    lightBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Official beneficiary firms, mailing address, email, and phone for letters.",
    inputs: [
      { key: "company_name1", label: "Company / Beneficiary Name", placeholder: "e.g. Bihar Renewable Energy Agency", type: "text", required: true },
      { key: "phone_no", label: "Phone Number", placeholder: "e.g. 0612-2500000 / 9876543210", type: "tel", maxLength: 15 },
      { key: "email_id", label: "Email Address", placeholder: "e.g. contact@agency.org", type: "email" },
      { key: "address", label: "Office Address", placeholder: "e.g. Vidyut Bhawan, Bailey Road, Patna", type: "textarea", fullWidth: true }
    ]
  },
  {
    id: "vendor_name",
    label: "Vendor Name",
    dbField: "vendor_name",
    icon: Handshake,
    color: "from-teal-500 to-emerald-600",
    lightBg: "bg-teal-50 text-teal-700 border-teal-200",
    description: "Authorized third-party equipment and service vendors with contact and email details.",
    inputs: [
      { key: "vendor_name", label: "Vendor Name", placeholder: "e.g. SolarTech Solutions Pvt Ltd", type: "text", required: true },
      { key: "phone_no", label: "Vendor Mobile Number", placeholder: "e.g. 9876543210", type: "tel", maxLength: 15 },
      { key: "email_id", label: "Vendor Email", placeholder: "e.g. vendor@example.com", type: "email" }
    ]
  },
  {
    id: "product_type",
    label: "Product Type",
    dbField: "product_type",
    icon: Package,
    color: "from-fuchsia-500 to-pink-600",
    lightBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    description: "Product categories, solar pump types, panels, and inverters.",
    inputs: [
      { key: "product_type", label: "Product Type", placeholder: "e.g. 3HP AC Submersible, 5HP Solar Pump, Mono PERC Panel", type: "text", required: true }
    ]
  },
  {
    id: "checked",
    label: "Checked Status",
    dbField: "checked",
    icon: CheckSquare,
    color: "from-sky-500 to-blue-600",
    lightBg: "bg-sky-50 text-sky-700 border-sky-200",
    description: "Verification and quality approval flags (e.g. Approved, Reject, Pending).",
    inputs: [
      { 
        key: "checked", 
        label: "Checked Status Option", 
        placeholder: "e.g. Approved, Reject, Verified", 
        type: "select",
        options: ["Approved", "Reject", "Pending", "Verified"],
        required: true 
      }
    ]
  },
  {
    id: "seal_and_signature",
    label: "Seal and Signature",
    dbField: "seal",
    icon: Stamp,
    color: "from-amber-500 to-rose-600",
    lightBg: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Upload and manage official company seals and authorized signature images.",
    inputs: [
      { key: "company_name", label: "Company Name", placeholder: "e.g. Tanay Vidyut / Tata Power", type: "text", required: true },
      { key: "seal", label: "Seal Image", type: "file", accept: "image/png,image/webp" },
      { key: "signature", label: "Signature Image", type: "file", accept: "image/png,image/webp" }
    ]
  },
  {
    id: "all_records",
    label: "All Master Records",
    dbField: null,
    icon: Layers,
    color: "from-slate-700 to-gray-800",
    lightBg: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Overview of all master records stored in the database.",
    inputs: []
  }
];

export default function MasterDataManagement() {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("company_name");
  const [categorySearch, setCategorySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Creation form state for active category
  const [newEntryData, setNewEntryData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seal & Signature specific state
  const [sealCompanyName, setSealCompanyName] = useState("");
  const [sealFile, setSealFile] = useState(null);
  const [sealPreview, setSealPreview] = useState("");
  const [sigFile, setSigFile] = useState(null);
  const [sigPreview, setSigPreview] = useState("");

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [editSealCompanyName, setEditSealCompanyName] = useState("");
  const [editSealFile, setEditSealFile] = useState(null);
  const [editSealPreview, setEditSealPreview] = useState("");
  const [editSigFile, setEditSigFile] = useState(null);
  const [editSigPreview, setEditSigPreview] = useState("");

  // Image zoom modal
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const [previewModalTitle, setPreviewModalTitle] = useState("");

  // Show message banner with auto-hide
  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 4000);
  };

  // Upload image to Supabase Storage (with fallback to Base64 Data URL)
  const uploadImageToSupabase = async (file) => {
    if (!file) return "";
    if (typeof file === "string") return file;

    const fileExt = file.name ? file.name.split(".").pop() : "png";
    const fileName = `seal-sign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    try {
      let uploadRes = await supabase.storage.from("vendor_tracker").upload(fileName, file, { upsert: true });
      if (!uploadRes.error) {
        const { data } = supabase.storage.from("vendor_tracker").getPublicUrl(fileName);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch (err) {
      console.warn("Storage upload vendor_tracker error:", err);
    }

    try {
      let uploadRes = await supabase.storage.from("complaint_documents").upload(fileName, file, { upsert: true });
      if (!uploadRes.error) {
        const { data } = supabase.storage.from("complaint_documents").getPublicUrl(fileName);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch (err) {
      console.warn("Storage upload complaint_documents error:", err);
    }

    // Seamless fallback to Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // ================= CHECK IMAGE TRANSPARENCY =================
  const checkImageTransparency = (file) => {
    return new Promise((resolve) => {
      // JPG / JPEG does not support transparency at all
      if (
        file.type === "image/jpeg" ||
        file.type === "image/jpg" ||
        /\.(jpe?g)$/i.test(file.name)
      ) {
        resolve({
          isTransparent: false,
          reason: "JPG/JPEG format me background transparent nahi hota. Kripya transparent background wali PNG image upload karein."
        });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve({ isTransparent: true });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const totalPixels = width * height;
        let transparentPixels = 0;

        // Check alpha channel (every 4th element)
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 240) {
            transparentPixels++;
          }
        }

        // Check corner pixels (corners are almost always background for seals & signatures)
        const cornerCoords = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1]
        ];
        let transparentCorners = 0;
        cornerCoords.forEach(([x, y]) => {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] < 240) {
            transparentCorners++;
          }
        });

        const transparentRatio = transparentPixels / totalPixels;

        // Valid transparent background:
        // Must have at least 5% transparent pixels AND at least 2 transparent corners, OR at least 8% transparent pixels overall
        if (transparentRatio >= 0.05 && (transparentCorners >= 2 || transparentRatio >= 0.08)) {
          resolve({ isTransparent: true, transparentRatio });
        } else {
          resolve({
            isTransparent: false,
            reason: "Image ka background transparent nahi hai! Kripya transparent background (no background / transparent PNG) wali image upload karein."
          });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          isTransparent: false,
          reason: "Image load karne me error aayi. Kripya valid transparent PNG file upload karein."
        });
      };
    });
  };

  // Image select handler with transparency verification
  const handleImageSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Kripya valid image file select karein (PNG format recommended)", "error");
      e.target.value = "";
      return;
    }

    // Verify background transparency
    const check = await checkImageTransparency(file);
    if (!check.isTransparent) {
      showToast(check.reason, "error");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "seal") {
      setSealFile(file);
      setSealPreview(previewUrl);
    } else if (type === "sig") {
      setSigFile(file);
      setSigPreview(previewUrl);
    } else if (type === "editSeal") {
      setEditSealFile(file);
      setEditSealPreview(previewUrl);
    } else if (type === "editSig") {
      setEditSigFile(file);
      setEditSigPreview(previewUrl);
    }
    showToast("✓ Transparent background verify ho gaya!", "success");
  };

  // ================= FETCH MASTER DATA =================
  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Master")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Merge with localStorage cached seal/signature records
      let localSeals = [];
      try {
        localSeals = JSON.parse(localStorage.getItem("master_seal_signatures") || "[]");
      } catch (e) {}

      const fetchedList = data || [];
      const existingIds = new Set(fetchedList.map((r) => r.id));
      const filteredLocal = localSeals.filter((r) => !existingIds.has(r.id));

      setMasterData([...fetchedList, ...filteredLocal]);
    } catch (error) {
      console.error("Error fetching master data:", error);
      try {
        const localSeals = JSON.parse(localStorage.getItem("master_seal_signatures") || "[]");
        if (localSeals.length > 0) {
          setMasterData(localSeals);
        }
      } catch (e) {}
      showToast("Error fetching records: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Active Category Object
  const activeCategory = useMemo(() => {
    return (
      MASTER_CATEGORIES.find((cat) => cat.id === activeCategoryId) ||
      MASTER_CATEGORIES[0]
    );
  }, [activeCategoryId]);

  // Reset form when switching category
  useEffect(() => {
    setNewEntryData({});
    setEditId(null);
    setEditData({});
    setItemSearch("");
    setSealCompanyName("");
    setSealFile(null);
    setSealPreview("");
    setSigFile(null);
    setSigPreview("");
    setEditSealCompanyName("");
    setEditSealFile(null);
    setEditSealPreview("");
    setEditSigFile(null);
    setEditSigPreview("");
  }, [activeCategoryId]);

  // Dynamic counts for each category
  const categoryCounts = useMemo(() => {
    const counts = {};
    MASTER_CATEGORIES.forEach((cat) => {
      if (cat.id === "all_records") {
        counts[cat.id] = masterData.length;
      } else if (cat.id === "seal_and_signature") {
        counts[cat.id] = masterData.filter(
          (item) =>
            (item.seal && item.seal.toString().trim() !== "") ||
            (item.seal_url && item.seal_url.toString().trim() !== "") ||
            (item.signature && item.signature.toString().trim() !== "") ||
            (item.signature_url && item.signature_url.toString().trim() !== "")
        ).length;
      } else if (cat.id === "technician") {
        counts[cat.id] = masterData.filter(
          (item) =>
            (item.technician_name && item.technician_name.toString().trim() !== "") ||
            (item.technician_contact && item.technician_contact.toString().trim() !== "")
        ).length;
      } else if (cat.id === "company_name1") {
        counts[cat.id] = masterData.filter(
          (item) =>
            !item.vendor_name &&
            ((item.company_name1 && item.company_name1.toString().trim() !== "") ||
              (item.address && item.address.toString().trim() !== "") ||
              (item.email_id && item.email_id.toString().trim() !== "") ||
              (item.phone_no && item.phone_no.toString().trim() !== ""))
        ).length;
      } else if (cat.id === "vendor_name") {
        counts[cat.id] = masterData.filter(
          (item) => item.vendor_name && item.vendor_name.toString().trim() !== ""
        ).length;
      } else if (cat.id === "checked") {
        counts[cat.id] = masterData.filter(
          (item) => item.checked !== null && item.checked !== undefined && item.checked !== ""
        ).length;
      } else {
        counts[cat.id] = masterData.filter(
          (item) => item[cat.dbField] && item[cat.dbField].toString().trim() !== ""
        ).length;
      }
    });
    return counts;
  }, [masterData]);

  // Filtered categories for left sidebar search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return MASTER_CATEGORIES;
    const q = categorySearch.toLowerCase();
    return MASTER_CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        (cat.dbField && cat.dbField.toLowerCase().includes(q))
    );
  }, [categorySearch]);

  // Filtered items for selected category
  const activeItems = useMemo(() => {
    let items = [];
    if (activeCategory.id === "all_records") {
      items = masterData;
    } else if (activeCategory.id === "seal_and_signature") {
      items = masterData.filter(
        (item) =>
          (item.seal && item.seal.toString().trim() !== "") ||
          (item.seal_url && item.seal_url.toString().trim() !== "") ||
          (item.signature && item.signature.toString().trim() !== "") ||
          (item.signature_url && item.signature_url.toString().trim() !== "")
      );
    } else if (activeCategory.id === "technician") {
      items = masterData.filter(
        (item) =>
          (item.technician_name && item.technician_name.toString().trim() !== "") ||
          (item.technician_contact && item.technician_contact.toString().trim() !== "")
      );
    } else if (activeCategory.id === "company_name1") {
      items = masterData.filter(
        (item) =>
          !item.vendor_name &&
          ((item.company_name1 && item.company_name1.toString().trim() !== "") ||
            (item.address && item.address.toString().trim() !== "") ||
            (item.email_id && item.email_id.toString().trim() !== "") ||
            (item.phone_no && item.phone_no.toString().trim() !== ""))
      );
    } else if (activeCategory.id === "vendor_name") {
      items = masterData.filter(
        (item) => item.vendor_name && item.vendor_name.toString().trim() !== ""
      );
    } else if (activeCategory.id === "checked") {
      items = masterData.filter(
        (item) => item.checked !== null && item.checked !== undefined && item.checked !== ""
      );
    } else {
      items = masterData.filter(
        (item) => item[activeCategory.dbField] && item[activeCategory.dbField].toString().trim() !== ""
      );
    }

    // Filter by item search query
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();

    return items.filter((item) => {
      return Object.entries(item).some(([k, val]) => {
        if (!val) return false;
        return val.toString().toLowerCase().includes(q);
      });
    });
  }, [masterData, activeCategory, itemSearch]);

  // Handle Input Changes for Quick Add
  const handleNewInputChange = (key, value, type) => {
    if (type === "tel") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 15);
      setNewEntryData((prev) => ({ ...prev, [key]: digitsOnly }));
      return;
    }
    setNewEntryData((prev) => ({ ...prev, [key]: value }));
  };

  // Handle Input Changes for Edit Mode
  const handleEditInputChange = (key, value, type) => {
    if (type === "tel") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 15);
      setEditData((prev) => ({ ...prev, [key]: digitsOnly }));
      return;
    }
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  // ================= CREATE RECORD =================
  const handleCreateRecord = async (e) => {
    e.preventDefault();

    if (activeCategory.id === "seal_and_signature") {
      if (!sealCompanyName.trim()) {
        showToast("Kripya Company Name enter karein.", "error");
        return;
      }

      if (!sealPreview && !sigPreview) {
        showToast("Kripya kam se kam ek Seal ya Signature image upload karein.", "error");
        return;
      }

      // Check transparency before submitting
      if (sealFile) {
        const check = await checkImageTransparency(sealFile);
        if (!check.isTransparent) {
          showToast("Seal Image: " + check.reason + " Isliye submit nahi kiya ja sakta.", "error");
          return;
        }
      }

      if (sigFile) {
        const check = await checkImageTransparency(sigFile);
        if (!check.isTransparent) {
          showToast("Signature Image: " + check.reason + " Isliye submit nahi kiya ja sakta.", "error");
          return;
        }
      }

      try {
        setIsSubmitting(true);

        let sealUrl = sealPreview;
        if (sealFile) {
          sealUrl = await uploadImageToSupabase(sealFile);
        }

        let signatureUrl = sigPreview;
        if (sigFile) {
          signatureUrl = await uploadImageToSupabase(sigFile);
        }

        let insertSuccess = false;
        let createdRecord = null;

        // Try insert with primary column names (company_name, seal, signature)
        try {
          const { data, error } = await supabase.from("Master").insert([
            { company_name: sealCompanyName.trim(), seal: sealUrl, signature: signatureUrl }
          ]).select();
          if (!error && data?.length) {
            insertSuccess = true;
            createdRecord = data[0];
          }
        } catch (err) {
          console.warn("Insert seal/signature notice:", err);
        }

        // Fallback: try with seal_url, signature_url
        if (!insertSuccess) {
          try {
            const { data, error } = await supabase.from("Master").insert([
              { company_name: sealCompanyName.trim(), seal_url: sealUrl, signature_url: signatureUrl }
            ]).select();
            if (!error && data?.length) {
              insertSuccess = true;
              createdRecord = data[0];
            }
          } catch (err) {
            console.warn("Insert seal_url/signature_url notice:", err);
          }
        }

        // Cache in localStorage as backup
        const fallbackRecord = createdRecord || {
          id: "local_" + Date.now(),
          company_name: sealCompanyName.trim(),
          seal: sealUrl,
          seal_url: sealUrl,
          signature: signatureUrl,
          signature_url: signatureUrl,
          created_at: new Date().toISOString()
        };

        try {
          const stored = JSON.parse(localStorage.getItem("master_seal_signatures") || "[]");
          localStorage.setItem("master_seal_signatures", JSON.stringify([fallbackRecord, ...stored]));
        } catch (e) {}

        showToast("Seal and Signature uploaded successfully!", "success");
        setSealCompanyName("");
        setSealFile(null);
        setSealPreview("");
        setSigFile(null);
        setSigPreview("");
        fetchMasterData();
      } catch (error) {
        console.error("Error adding seal/signature:", error);
        showToast("Error adding record: " + error.message, "error");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Check if at least one input has value
    const hasValues = Object.values(newEntryData).some(
      (val) => val !== undefined && val !== null && val.toString().trim() !== ""
    );

    if (!hasValues) {
      showToast("Please provide a value to add.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload for active category
      const payload = {};
      if (activeCategory.inputs) {
        activeCategory.inputs.forEach((input) => {
          if (newEntryData[input.key] !== undefined && newEntryData[input.key] !== "") {
            payload[input.key] = newEntryData[input.key];
          }
        });
      }

      const { error } = await supabase.from("Master").insert([payload]);
      if (error) throw error;

      showToast(`Added successfully to ${activeCategory.label}!`, "success");
      setNewEntryData({});
      fetchMasterData();
    } catch (error) {
      console.error("Error adding master record:", error);
      showToast("Error adding record: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a record
  const startEdit = (item) => {
    setEditId(item.id);
    setEditData({ ...item });
    if (activeCategory.id === "seal_and_signature") {
      setEditSealCompanyName(item.company_name || "");
      setEditSealPreview(item.seal || item.seal_url || "");
      setEditSigPreview(item.signature || item.signature_url || "");
      setEditSealFile(null);
      setEditSigFile(null);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
    setEditSealCompanyName("");
    setEditSealFile(null);
    setEditSealPreview("");
    setEditSigFile(null);
    setEditSigPreview("");
  };

  // ================= UPDATE RECORD =================
  const handleUpdateRecord = async (id) => {
    try {
      if (activeCategory.id === "seal_and_signature") {
        if (!editSealCompanyName.trim()) {
          showToast("Kripya Company Name enter karein.", "error");
          return;
        }
        if (editSealFile) {
          const check = await checkImageTransparency(editSealFile);
          if (!check.isTransparent) {
            showToast("Seal Image: " + check.reason + " Isliye update nahi ho sakta.", "error");
            return;
          }
        }
        if (editSigFile) {
          const check = await checkImageTransparency(editSigFile);
          if (!check.isTransparent) {
            showToast("Signature Image: " + check.reason + " Isliye update nahi ho sakta.", "error");
            return;
          }
        }
      }

      setIsUpdating(true);

      if (activeCategory.id === "seal_and_signature") {
        let sealUrl = editSealPreview;
        if (editSealFile) {
          sealUrl = await uploadImageToSupabase(editSealFile);
        }

        let signatureUrl = editSigPreview;
        if (editSigFile) {
          signatureUrl = await uploadImageToSupabase(editSigFile);
        }

        let updateSuccess = false;
        try {
          const { error } = await supabase
            .from("Master")
            .update({ company_name: editSealCompanyName.trim(), seal: sealUrl, signature: signatureUrl })
            .eq("id", id);
          if (!error) updateSuccess = true;
        } catch (e) {}

        if (!updateSuccess) {
          try {
            await supabase
              .from("Master")
              .update({ company_name: editSealCompanyName.trim(), seal_url: sealUrl, signature_url: signatureUrl })
              .eq("id", id);
          } catch (e) {}
        }

        // Update in localStorage
        try {
          const stored = JSON.parse(localStorage.getItem("master_seal_signatures") || "[]");
          const updated = stored.map((item) =>
            item.id === id
              ? {
                  ...item,
                  company_name: editSealCompanyName.trim(),
                  seal: sealUrl,
                  seal_url: sealUrl,
                  signature: signatureUrl,
                  signature_url: signatureUrl
                }
              : item
          );
          localStorage.setItem("master_seal_signatures", JSON.stringify(updated));
        } catch (e) {}

        showToast("Seal and Signature updated successfully!", "success");
        cancelEdit();
        fetchMasterData();
        return;
      }

      // Build update payload
      const payload = {};
      if (activeCategory.id === "all_records") {
        Object.keys(editData).forEach((key) => {
          if (key !== "id" && key !== "created_at") {
            payload[key] = editData[key];
          }
        });
      } else {
        activeCategory.inputs.forEach((input) => {
          payload[input.key] = editData[input.key] || null;
        });
      }

      const { error } = await supabase
        .from("Master")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      showToast("Record updated successfully!", "success");
      setEditId(null);
      setEditData({});
      fetchMasterData();
    } catch (error) {
      console.error("Error updating record:", error);
      showToast("Error updating record: " + error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ================= DELETE RECORD =================
  const handleDeleteRecord = async (id, label = "record") => {
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;

    try {
      if (typeof id === "number" || (typeof id === "string" && !id.startsWith("local_"))) {
        const { error } = await supabase.from("Master").delete().eq("id", id);
        if (error) throw error;
      }

      // Also clean up from localStorage if present
      try {
        const stored = JSON.parse(localStorage.getItem("master_seal_signatures") || "[]");
        const updated = stored.filter((item) => item.id !== id);
        localStorage.setItem("master_seal_signatures", JSON.stringify(updated));
      } catch (e) {}

      showToast("Record deleted successfully.", "success");
      if (editId === id) cancelEdit();
      fetchMasterData();
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast("Error deleting record: " + error.message, "error");
    }
  };

  const ActiveIcon = activeCategory.icon;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/20 p-3 sm:p-5 md:p-8">
        {/* ================= TOP HEADER ================= */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-md shadow-purple-200">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Master Data Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Manage all dropdown options, lookup values, and system fields across forms
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Master Records
              </p>
              <p className="text-2xl font-extrabold text-purple-700">
                {masterData.length}
              </p>
            </div>

            <button
              onClick={fetchMasterData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 shadow-sm hover:shadow transition active:scale-95 disabled:opacity-60"
              title="Refresh Records"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : "text-gray-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* TOAST / ALERT MESSAGE */}
        {message.text && (
          <div
            className={`mb-5 flex items-center justify-between p-4 rounded-xl text-sm font-medium border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              message.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ text: "", type: "" })}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================= MOBILE FIELD SELECTOR (SCROLLABLE PILLS) ================= */}
        <div className="lg:hidden mb-4 overflow-x-auto pb-2 scrollbar-none flex gap-2">
          {MASTER_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;
            const isActive = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 scale-100"
                    : "bg-white text-gray-700 hover:bg-purple-50 border border-gray-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-purple-600"}`} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: FIELD CATEGORIES ================= */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-4 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4">
              {/* Category Search Box */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                <span>Master Fields ({filteredCategories.length})</span>
                <span>Entries</span>
              </div>

              {/* Categories Navigation List */}
              <div className="space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.id] || 0;
                  const isActive = activeCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-300/40 font-semibold translate-x-0.5"
                          : "bg-white hover:bg-purple-50/60 text-gray-700 hover:text-purple-700 border border-transparent hover:border-purple-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">
                            {cat.label}
                          </p>
                          {cat.dbField && (
                            <p
                              className={`text-[10px] truncate ${
                                isActive ? "text-purple-100" : "text-gray-400"
                              }`}
                            >
                              {cat.dbField}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700"
                          }`}
                        >
                          {count}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            isActive
                              ? "text-white translate-x-0.5"
                              : "text-gray-300 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 px-4 text-xs text-gray-400">
                    No matching fields found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SELECTED FIELD CRUD WORKSPACE ================= */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-5">
            {/* WORKSPACE HEADER */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-tr ${activeCategory.color} text-white shadow-md`}
                  >
                    <ActiveIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {activeCategory.label}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        {activeItems.length} {activeItems.length === 1 ? "Record" : "Records"}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                      {activeCategory.description}
                    </p>
                  </div>
                </div>

                {/* In-category search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeCategory.label}...`}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                  />
                  {itemSearch && (
                    <button
                      onClick={() => setItemSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ================= ADD NEW RECORD FORM (FOR ACTIVE FIELD) ================= */}
              {activeCategory.id !== "all_records" && (
                <div className="mt-5 bg-gradient-to-br from-purple-50/50 via-indigo-50/20 to-white rounded-xl border border-purple-100 p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 rounded-md bg-purple-600 text-white">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">
                      Add New {activeCategory.label}
                    </h3>
                  </div>

                  {activeCategory.id === "seal_and_signature" ? (
                    <form onSubmit={handleCreateRecord} className="space-y-4">
                      {/* Field: Company Name */}
                      <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-sm">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-purple-600" />
                          <span>Company Name (कंपनी का नाम) <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Tanay Vidyut / Tata Power / BREDA"
                          value={sealCompanyName}
                          onChange={(e) => setSealCompanyName(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition font-medium text-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Field 1: Seal Image Upload */}
                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-rose-200 hover:border-rose-400 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                              <Stamp className="h-4 w-4 text-rose-600" />
                              <span>Seal Image (सील / मुहर)</span>
                            </label>
                            <div className="flex items-center gap-2">
                              {sealPreview && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Transparent
                                </span>
                              )}
                              {sealPreview && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSealFile(null);
                                    setSealPreview("");
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                                >
                                  <X className="h-3.5 w-3.5" /> Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {sealPreview ? (
                            <div className="relative group bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col items-center justify-center min-h-[150px]">
                              <img
                                src={sealPreview}
                                alt="Seal Preview"
                                className="max-h-28 max-w-full object-contain rounded drop-shadow-sm cursor-pointer"
                                onClick={() => {
                                  setPreviewModalUrl(sealPreview);
                                  setPreviewModalTitle("Seal Image Preview");
                                }}
                              />
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewModalUrl(sealPreview);
                                    setPreviewModalTitle("Seal Image Preview");
                                  }}
                                  className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1 shadow-sm"
                                >
                                  <Eye className="h-3.5 w-3.5 text-rose-600" /> View Full
                                </button>
                                <label className="px-2.5 py-1 text-xs bg-rose-50 border border-rose-200 rounded-md text-rose-700 hover:bg-rose-100 flex items-center gap-1 cursor-pointer">
                                  Change Image
                                  <input
                                    type="file"
                                    accept="image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleImageSelect(e, "seal")}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center min-h-[150px] cursor-pointer hover:bg-rose-50/40 rounded-lg transition-colors p-4 text-center border border-dashed border-rose-100">
                              <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-2">
                                <UploadCloud className="h-6 w-6" />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">Click to upload Seal image</span>
                              <span className="text-[11px] text-amber-600 font-medium mt-1">Sirf Transparent PNG background wali image upload karein</span>
                              <span className="text-[10px] text-gray-400 mt-0.5">(Non-transparent background submit nahi hoga)</span>
                              <input
                                type="file"
                                accept="image/png,image/webp"
                                className="hidden"
                                onChange={(e) => handleImageSelect(e, "seal")}
                              />
                            </label>
                          )}
                        </div>

                        {/* Field 2: Signature Image Upload */}
                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                              <FileSignature className="h-4 w-4 text-indigo-600" />
                              <span>Signature Image (हस्ताक्षर / सिग्नेचर)</span>
                            </label>
                            <div className="flex items-center gap-2">
                              {sigPreview && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Transparent
                                </span>
                              )}
                              {sigPreview && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSigFile(null);
                                    setSigPreview("");
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                                >
                                  <X className="h-3.5 w-3.5" /> Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {sigPreview ? (
                            <div className="relative group bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col items-center justify-center min-h-[150px]">
                              <img
                                src={sigPreview}
                                alt="Signature Preview"
                                className="max-h-28 max-w-full object-contain rounded drop-shadow-sm cursor-pointer"
                                onClick={() => {
                                  setPreviewModalUrl(sigPreview);
                                  setPreviewModalTitle("Signature Image Preview");
                                }}
                              />
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewModalUrl(sigPreview);
                                    setPreviewModalTitle("Signature Image Preview");
                                  }}
                                  className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1 shadow-sm"
                                >
                                  <Eye className="h-3.5 w-3.5 text-indigo-600" /> View Full
                                </button>
                                <label className="px-2.5 py-1 text-xs bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer">
                                  Change Image
                                  <input
                                    type="file"
                                    accept="image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleImageSelect(e, "sig")}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center min-h-[150px] cursor-pointer hover:bg-indigo-50/40 rounded-lg transition-colors p-4 text-center border border-dashed border-indigo-100">
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-2">
                                <UploadCloud className="h-6 w-6" />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">Click to upload Signature image</span>
                              <span className="text-[11px] text-amber-600 font-medium mt-1">Sirf Transparent PNG background wali image upload karein</span>
                              <span className="text-[10px] text-gray-400 mt-0.5">(Non-transparent background submit nahi hoga)</span>
                              <input
                                type="file"
                                accept="image/png,image/webp"
                                className="hidden"
                                onChange={(e) => handleImageSelect(e, "sig")}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting || !sealCompanyName.trim() || (!sealPreview && !sigPreview)}
                          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <UploadCloud className="h-4 w-4" />
                          )}
                          <span>Upload & Save Seal & Signature</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleCreateRecord} className="space-y-3">
                      <div className={`grid grid-cols-1 ${activeCategory.inputs.length === 3 ? "md:grid-cols-3" : activeCategory.inputs.length >= 2 ? "md:grid-cols-2" : ""} gap-3`}>
                        {activeCategory.inputs.map((input) => {
                          const isFullWidth = input.fullWidth || (activeCategory.inputs.length === 1);

                          return (
                            <div
                              key={input.key}
                              className={isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"}
                            >
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                {input.label} {input.required && <span className="text-red-500">*</span>}
                              </label>

                              {input.type === "textarea" ? (
                                <textarea
                                  rows={2}
                                  placeholder={input.placeholder}
                                  value={newEntryData[input.key] || ""}
                                  onChange={(e) =>
                                    handleNewInputChange(input.key, e.target.value, input.type)
                                  }
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                                />
                              ) : input.type === "select" ? (
                                <div className="flex gap-2">
                                  <select
                                    value={newEntryData[input.key] || ""}
                                    onChange={(e) =>
                                      handleNewInputChange(input.key, e.target.value, input.type)
                                    }
                                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                                  >
                                    <option value="">-- Select {input.label} --</option>
                                    {input.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Or custom status"
                                    value={newEntryData[input.key] || ""}
                                    onChange={(e) =>
                                      handleNewInputChange(input.key, e.target.value, "text")
                                    }
                                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                                  />
                                </div>
                              ) : (
                                <input
                                  type={input.type || "text"}
                                  maxLength={input.maxLength}
                                  placeholder={input.placeholder}
                                  value={newEntryData[input.key] || ""}
                                  onChange={(e) =>
                                    handleNewInputChange(input.key, e.target.value, input.type)
                                  }
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          <span>Add {activeCategory.label}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ================= EXISTING ENTRIES LIST (FULL CRUD) ================= */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Existing {activeCategory.label} Entries ({activeItems.length})
                  </h3>
                  {itemSearch && (
                    <span className="text-xs text-purple-600 font-medium">
                      Filtered by "{itemSearch}"
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading master records...</p>
                  </div>
                ) : activeItems.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                    <ActiveIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      No records found for {activeCategory.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {itemSearch
                        ? "No results matched your search keyword. Try clearing the search."
                        : `Use the form above to add your first entry for ${activeCategory.label}.`}
                    </p>
                    {itemSearch && (
                      <button
                        onClick={() => setItemSearch("")}
                        className="mt-3 text-xs text-purple-600 font-semibold hover:underline"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeItems.map((item, index) => {
                      const isEditing = editId === item.id;

                      // Display rendering based on category
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border transition-all duration-200 ${
                            isEditing
                              ? "bg-purple-50/40 border-purple-300 ring-2 ring-purple-400/20 shadow-md p-4"
                              : "bg-white hover:bg-gray-50/80 border-gray-200 shadow-sm p-3.5 sm:p-4 hover:border-purple-200"
                          }`}
                        >
                          {isEditing ? (
                            /* ================= INLINE EDIT MODE ================= */
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                                <span className="text-xs font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Editing Entry #{index + 1}
                                </span>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              <div className={`grid grid-cols-1 ${activeCategory.id === "all_records" ? "md:grid-cols-2" : activeCategory.inputs.length === 3 ? "md:grid-cols-3" : activeCategory.inputs.length >= 2 ? "md:grid-cols-2" : ""} gap-3`}>
                                {activeCategory.id === "seal_and_signature" ? (
                                  <div className="col-span-1 md:col-span-2 space-y-3">
                                    {/* Edit Company Name */}
                                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-purple-600" />
                                        <span>Company Name (कंपनी का नाम) <span className="text-red-500">*</span></span>
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Enter company name"
                                        value={editSealCompanyName}
                                        onChange={(e) => setEditSealCompanyName(e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Edit Seal Image */}
                                      <div className="bg-white p-3 rounded-xl border border-rose-200">
                                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2">
                                          <Stamp className="h-4 w-4 text-rose-600" />
                                          Seal Image (मुहर / सील)
                                        </label>
                                        {editSealPreview ? (
                                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <img src={editSealPreview} alt="Seal Edit" className="max-h-24 object-contain mb-2" />
                                            <div className="flex gap-2">
                                              <label className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-md cursor-pointer hover:bg-rose-100 flex items-center gap-1">
                                                Replace Seal
                                                <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e, "editSeal")} />
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() => { setEditSealFile(null); setEditSealPreview(""); }}
                                                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="flex flex-col items-center justify-center p-4 border border-dashed border-rose-200 rounded-lg cursor-pointer hover:bg-rose-50/30">
                                            <UploadCloud className="h-5 w-5 text-rose-500 mb-1" />
                                            <span className="text-xs text-gray-600 font-medium">Select Transparent Seal Image</span>
                                            <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e, "editSeal")} />
                                          </label>
                                        )}
                                      </div>

                                      {/* Edit Signature Image */}
                                      <div className="bg-white p-3 rounded-xl border border-indigo-200">
                                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2">
                                          <FileSignature className="h-4 w-4 text-indigo-600" />
                                          Signature Image (हस्ताक्षर / सिग्नेचर)
                                        </label>
                                        {editSigPreview ? (
                                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <img src={editSigPreview} alt="Signature Edit" className="max-h-24 object-contain mb-2" />
                                            <div className="flex gap-2">
                                              <label className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md cursor-pointer hover:bg-indigo-100 flex items-center gap-1">
                                                Replace Signature
                                                <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e, "editSig")} />
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() => { setEditSigFile(null); setEditSigPreview(""); }}
                                                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="flex flex-col items-center justify-center p-4 border border-dashed border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50/30">
                                            <UploadCloud className="h-5 w-5 text-indigo-500 mb-1" />
                                            <span className="text-xs text-gray-600 font-medium">Select Transparent Signature Image</span>
                                            <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e, "editSig")} />
                                          </label>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : activeCategory.id === "all_records" ? (
                                  // In "All Records", allow editing any populated field
                                  Object.keys(editData).map((k) => {
                                    if (["id", "created_at"].includes(k)) return null;
                                    return (
                                      <div key={k} className="col-span-1">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">
                                          {k.replace(/_/g, " ")}
                                        </label>
                                        <input
                                          type="text"
                                          value={editData[k] || ""}
                                          onChange={(e) =>
                                            handleEditInputChange(k, e.target.value, "text")
                                          }
                                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                      </div>
                                    );
                                  })
                                ) : (
                                  activeCategory.inputs.map((input) => {
                                    const isFullWidth =
                                      input.fullWidth || activeCategory.inputs.length === 1;

                                    return (
                                      <div
                                        key={input.key}
                                        className={
                                          isFullWidth
                                            ? "col-span-1 md:col-span-2"
                                            : "col-span-1"
                                        }
                                      >
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          {input.label}
                                        </label>

                                        {input.type === "textarea" ? (
                                          <textarea
                                            rows={2}
                                            value={editData[input.key] || ""}
                                            onChange={(e) =>
                                              handleEditInputChange(
                                                input.key,
                                                e.target.value,
                                                input.type
                                              )
                                            }
                                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                          />
                                        ) : input.type === "select" ? (
                                          <input
                                            type="text"
                                            value={editData[input.key] || ""}
                                            onChange={(e) =>
                                              handleEditInputChange(
                                                input.key,
                                                e.target.value,
                                                "text"
                                              )
                                            }
                                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                          />
                                        ) : (
                                          <input
                                            type={input.type || "text"}
                                            maxLength={input.maxLength}
                                            value={editData[input.key] || ""}
                                            onChange={(e) =>
                                              handleEditInputChange(
                                                input.key,
                                                e.target.value,
                                                input.type
                                              )
                                            }
                                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                          />
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRecord(item.id)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95 disabled:opacity-60"
                                >
                                  {isUpdating ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5" />
                                  )}
                                  <span>Save Changes</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ================= DISPLAY MODE ================= */
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                  {/* Custom Display Per Category */}
                                  {activeCategory.id === "seal_and_signature" ? (
                                    <div className="w-full">
                                      {/* Company Name Header */}
                                      <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
                                          <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</p>
                                          <h4 className="text-sm font-bold text-gray-900 truncate">
                                            {item.company_name || "Company Name Not Specified"}
                                          </h4>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-1">
                                        {/* Seal Box */}
                                        <div className="bg-gradient-to-br from-rose-50/40 to-slate-50 p-3 rounded-xl border border-rose-100 flex flex-col justify-between">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                              <Stamp className="h-3.5 w-3.5 text-rose-600" />
                                              Seal (मुहर / सील)
                                            </span>
                                            {(item.seal || item.seal_url) ? (
                                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                Available
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-400">
                                                None
                                              </span>
                                            )}
                                          </div>
                                          {(item.seal || item.seal_url) ? (
                                            <div
                                              onClick={() => {
                                                setPreviewModalUrl(item.seal || item.seal_url);
                                                setPreviewModalTitle("Seal Image Preview");
                                              }}
                                              className="group cursor-pointer relative bg-white rounded-lg p-2 border border-gray-200 flex items-center justify-center min-h-[90px] hover:border-rose-300 transition shadow-sm"
                                            >
                                              <img
                                                src={item.seal || item.seal_url}
                                                alt="Seal"
                                                className="max-h-20 max-w-full object-contain"
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white transition-opacity gap-1 text-xs font-medium backdrop-blur-[1px]">
                                                <Eye className="h-4 w-4" /> View Full
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-400 italic py-5 text-center bg-white/60 rounded-lg border border-dashed border-gray-200">
                                              No seal uploaded
                                            </div>
                                          )}
                                        </div>

                                        {/* Signature Box */}
                                        <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50 p-3 rounded-xl border border-indigo-100 flex flex-col justify-between">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                              <FileSignature className="h-3.5 w-3.5 text-indigo-600" />
                                              Signature (हस्ताक्षर / सिग्नेचर)
                                            </span>
                                            {(item.signature || item.signature_url) ? (
                                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                Available
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-400">
                                                None
                                              </span>
                                            )}
                                          </div>
                                          {(item.signature || item.signature_url) ? (
                                            <div
                                              onClick={() => {
                                                setPreviewModalUrl(item.signature || item.signature_url);
                                                setPreviewModalTitle("Signature Image Preview");
                                              }}
                                              className="group cursor-pointer relative bg-white rounded-lg p-2 border border-gray-200 flex items-center justify-center min-h-[90px] hover:border-indigo-300 transition shadow-sm"
                                            >
                                              <img
                                                src={item.signature || item.signature_url}
                                                alt="Signature"
                                                className="max-h-20 max-w-full object-contain"
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white transition-opacity gap-1 text-xs font-medium backdrop-blur-[1px]">
                                                <Eye className="h-4 w-4" /> View Full
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-400 italic py-5 text-center bg-white/60 rounded-lg border border-dashed border-gray-200">
                                              No signature uploaded
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ) : activeCategory.id === "technician" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.technician_name || "Unnamed Technician"}
                                      </p>
                                      {item.technician_contact && (
                                        <div className="flex items-center gap-1 text-xs text-purple-700 mt-0.5">
                                          <Phone className="h-3 w-3" />
                                          <span>{item.technician_contact}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : activeCategory.id === "company_name1" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.company_name1 || "Unnamed Beneficiary"}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                        {item.phone_no && (
                                          <span className="flex items-center gap-1 text-purple-700">
                                            <Phone className="h-3 w-3" />
                                            {item.phone_no}
                                          </span>
                                        )}
                                        {item.email_id && (
                                          <span className="flex items-center gap-1 text-blue-700">
                                            <Mail className="h-3 w-3" />
                                            {item.email_id}
                                          </span>
                                        )}
                                        {item.address && (
                                          <span className="flex items-center gap-1 text-gray-600 line-clamp-1">
                                            <MapPin className="h-3 w-3 text-gray-400" />
                                            {item.address}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : activeCategory.id === "vendor_name" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.vendor_name || "Unnamed Vendor"}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                        {item.phone_no && (
                                          <span className="flex items-center gap-1 text-teal-700 font-medium">
                                            <Phone className="h-3 w-3" />
                                            {item.phone_no}
                                          </span>
                                        )}
                                        {item.email_id && (
                                          <span className="flex items-center gap-1 text-blue-700 font-medium">
                                            <Mail className="h-3 w-3" />
                                            {item.email_id}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : activeCategory.id === "tracker_status" ? (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          item.tracker_status === "Active"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : item.tracker_status === "Inactive"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {item.tracker_status || "None"}
                                      </span>
                                    </div>
                                  ) : activeCategory.id === "checked" ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                        {typeof item.checked === "boolean"
                                          ? item.checked
                                            ? "True (Checked)"
                                            : "False (Unchecked)"
                                          : String(item.checked)}
                                      </span>
                                    </div>
                                  ) : activeCategory.id === "all_records" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.company_name ||
                                          item.project_name ||
                                          item.technician_name ||
                                          item.district ||
                                          `Record #${item.id}`}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {Object.entries(item).map(([k, val]) => {
                                          if (
                                            ["id", "created_at"].includes(k) ||
                                            !val ||
                                            val.toString().trim() === ""
                                          )
                                            return null;
                                          return (
                                            <span
                                              key={k}
                                              className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 text-gray-700 border border-gray-200"
                                            >
                                              <strong className="text-gray-500 font-medium">
                                                {k}:
                                              </strong>{" "}
                                              {String(val)}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : activeCategory.id === "company_name" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.company_name || "-"}
                                      </p>
                                      {(item.mode_of_call || item.project_name) && (
                                        <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                                          {item.mode_of_call && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                              <PhoneCall className="h-3 w-3" />
                                              <strong className="text-purple-500 font-medium">Mode:</strong> {item.mode_of_call}
                                            </span>
                                          )}
                                          {item.project_name && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              <Folder className="h-3 w-3" />
                                              <strong className="text-emerald-500 font-medium">Project:</strong> {item.project_name}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item[activeCategory.dbField] || "-"}
                                      </p>
                                    </div>
                                  )}

                                  {/* Created timestamp */}
                                  {item.created_at && (
                                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-gray-300" />
                                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons: Edit & Delete */}
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition border border-purple-200 active:scale-95"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteRecord(
                                      item.id,
                                      activeCategory.id === "all_records"
                                        ? "record"
                                        : activeCategory.label
                                    )
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition border border-red-200 active:scale-95"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= IMAGE PREVIEW MODAL ================= */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl relative border border-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-rose-600" />
                {previewModalTitle || "Image Preview"}
              </h3>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-center min-h-[240px] max-h-[65vh] overflow-auto border border-gray-100">
              <img
                src={previewModalUrl}
                alt="Preview"
                className="max-h-[55vh] max-w-full object-contain rounded-lg drop-shadow-md"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <a
                href={previewModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-1.5"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Open in New Tab
              </a>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}