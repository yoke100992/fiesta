const BASE_URL = "https://script.google.com/macros/s/AKfycbx2k8hN154IIx_RoggOboCp8Boim46cQzO1WyuMVhLpMroZ5EwyDaWTQp9qV5uugJPnWA/exec";

// ===== SAFE FETCH =====
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const text = await res.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      console.error("Response bukan JSON:", text);
      return null;
    }

  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
};

// ===== MASTER =====
export const getSPG = () => safeFetch(`${BASE_URL}?action=getSPG`);

export const getProduct = () =>
  safeFetch(`${BASE_URL}?action=getProduct`);

// ===== SUMMARY =====
export const getSummary = (tanggal) => {
  const url = tanggal
    ? `${BASE_URL}?action=getSummary&tanggal=${tanggal}`
    : `${BASE_URL}?action=getSummary`;

  return safeFetch(url);
};

export const getSellOut = () => getSummary();

// ===== UPLOAD IMAGE (CLOUDINARY) =====
export const uploadImage = async (file) => {
  try {
    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);

    // 🔥 WAJIB sesuai Cloudinary
    formData.append("upload_preset", "fiesta");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dmookmsr/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();

    if (!data.secure_url) {
      console.error("Upload gagal:", data);
      return "";
    }

    return data.secure_url;

  } catch (err) {
    console.error("Upload error:", err);
    return "";
  }
};

// ===== SUBMIT SELL OUT =====
export const submitSellOut = async (data) => {
  try {
    // 🔥 VALIDASI WAJIB FOTO
    if (!data.photo) {
      alert("Minimal 1 foto wajib diupload!");
      return null;
    }

    const payload = encodeURIComponent(JSON.stringify(data));

    const url = `${BASE_URL}?action=submitSellOut&data=${payload}`;

    return await safeFetch(url);

  } catch (err) {
    console.error("Submit error:", err);
    return null;
  }
};

// ===== PERMIT =====
export const submitPermit = async (data) => {
  try {
    const payload = encodeURIComponent(JSON.stringify(data));

    const url = `${BASE_URL}?action=submitPermit&data=${payload}`;

    return await safeFetch(url);

  } catch (err) {
    console.error("Permit error:", err);
    return null;
  }
};

// ===== GET PERMIT =====
export const getPermit = () =>
  safeFetch(`${BASE_URL}?action=getPermit`);