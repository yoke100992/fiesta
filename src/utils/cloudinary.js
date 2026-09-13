export const uploadImage = async (file) => {
    try {
        if (!file) return "";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "fiesta"); // ?? WAJIB sesuai Cloudinary

        const res = await fetch("https://api.cloudinary.com/v1_1/dmookmsr/image/upload", {
            method: "POST",
            body: formData
        });

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