// ==========================================
// FUNGSI WATERMARK - Scale Lebih Elegan & Proporsional
// ==========================================
const applyWatermark = async (file, watermarkData) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize jika terlalu besar (max 1200px)
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 1200;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // ===== UKURAN BOX WATERMARK - SCALE DIKECILKAN =====
                const padding = width * 0.03; // Padding 3%
                const boxWidth = width * 0.90; // ? Lebar 90% (lebih ada napas di kiri-kanan)
                const lineHeight = height * 0.038; // Line height lebih rapat
                const boxHeight = lineHeight * 7.5;
                const boxX = padding;
                const boxY = height - boxHeight - padding;
                const cornerRadius = width * 0.02;

                // Background gelap semi-transparan
                ctx.fillStyle = 'rgba(0, 0, 0, 0.80)'; // Opacity sedikit dikurangi agar foto tetap terlihat samar
                ctx.beginPath();
                ctx.moveTo(boxX + cornerRadius, boxY);
                ctx.lineTo(boxX + boxWidth - cornerRadius, boxY);
                ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + cornerRadius);
                ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerRadius);
                ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - cornerRadius, boxY + boxHeight);
                ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
                ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - cornerRadius);
                ctx.lineTo(boxX, boxY + cornerRadius);
                ctx.quadraticCurveTo(boxX, boxY, boxX + cornerRadius, boxY);
                ctx.closePath();
                ctx.fill();

                // ===== ICON PIN HIJAU (Scale disesuaikan) =====
                const pinCenterX = boxX + width * 0.055;
                const pinTopY = boxY + boxHeight * 0.12;
                const pinBottomY = boxY + boxHeight * 0.88;
                const pinWidth = width * 0.035; // ? Pin sedikit lebih kecil
                const pinMiddleY = pinTopY + (pinBottomY - pinTopY) * 0.35;

                // Gambar pin teardrop
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(pinCenterX, pinMiddleY, pinWidth * 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(pinCenterX - pinWidth * 1.6, pinMiddleY + pinWidth * 0.9);
                ctx.lineTo(pinCenterX + pinWidth * 1.6, pinMiddleY + pinWidth * 0.9);
                ctx.lineTo(pinCenterX, pinBottomY);
                ctx.closePath();
                ctx.fill();

                // Lubang putih
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(pinCenterX, pinMiddleY, pinWidth * 0.8, 0, Math.PI * 2);
                ctx.fill();

                // ===== TEKS WATERMARK (Font Scale Dikecilkan) =====
                const textX = pinCenterX + pinWidth * 3.2;
                const textStartY = boxY + boxHeight * 0.08;
                const textMaxWidth = boxWidth - (textX - boxX) - padding * 2;

                // Baris 1: Nama SPG (BESAR & BOLD) - ? Dikecilkan dari 0.065 ke 0.050
                ctx.fillStyle = 'white';
                ctx.font = `bold ${height * 0.050}px Arial, sans-serif`;
                ctx.textBaseline = 'top';
                ctx.fillText(watermarkData.nama || 'SPG', textX, textStartY, textMaxWidth);

                // Baris 2: Nama Toko (BOLD, uppercase) - ? Dikecilkan dari 0.045 ke 0.035
                ctx.font = `bold ${height * 0.035}px Arial, sans-serif`;
                const tokoText = (watermarkData.toko || '').toUpperCase();
                ctx.fillText(tokoText, textX, textStartY + lineHeight * 1.15, textMaxWidth);

                // Baris 3: Alamat - ? Dikecilkan dari 0.035 ke 0.026
                ctx.font = `${height * 0.026}px Arial, sans-serif`;
                const alamatText = watermarkData.alamat || '';
                let displayAlamat = alamatText;
                while (ctx.measureText(displayAlamat).width > textMaxWidth && displayAlamat.length > 10) {
                    displayAlamat = displayAlamat.slice(0, -4) + '...';
                }
                ctx.fillText(displayAlamat, textX, textStartY + lineHeight * 2.3, textMaxWidth);

                // Baris 4: Kota - ? Dikecilkan dari 0.035 ke 0.026
                ctx.fillText(watermarkData.kota || '', textX, textStartY + lineHeight * 3.35, textMaxWidth);

                // Baris 5: Tanggal & Jam - ? Dikecilkan dari 0.032 ke 0.024
                ctx.fillStyle = '#e5e7eb';
                ctx.font = `${height * 0.024}px Arial, sans-serif`;
                ctx.fillText(watermarkData.tanggal || '', textX, textStartY + lineHeight * 4.5, textMaxWidth);

                // Baris 6: Koordinat - ? Dikecilkan dari 0.028 ke 0.020
                ctx.fillStyle = '#9ca3af';
                ctx.font = `${height * 0.020}px Arial, sans-serif`;
                ctx.fillText(
                    `Lat: ${watermarkData.lat || '-'}, Long: ${watermarkData.lng || '-'}`,
                    textX,
                    textStartY + lineHeight * 5.55,
                    textMaxWidth
                );

                // Convert ke blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Watermark gagal'));
                            return;
                        }
                        const watermarkedFile = new File(
                            [blob],
                            `watermarked_${Date.now()}.jpg`,
                            { type: 'image/jpeg', lastModified: Date.now() }
                        );
                        resolve(watermarkedFile);
                    },
                    'image/jpeg',
                    0.9
                );
            };
            img.onerror = () => reject(new Error('Gagal memuat gambar'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
    });
};
// ==========================================
// FUNGSI KOMPRESI FOTO
// ==========================================
const compressImage = (file, maxWidth = 1200, quality = 0.85) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error('Kompresi gagal')); return; }
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Gagal memuat gambar'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
    });
};

// ==========================================
// FUNGSI UPLOAD DENGAN PROGRESS
// ==========================================
export const uploadImage = async (file, onProgress) => {
    try {
        if (!file) return "";

        if (onProgress) onProgress(10);

        let fileToUpload = file;
        const originalSizeMB = file.size / (1024 * 1024);

        if (originalSizeMB > 0.5) {
            try {
                fileToUpload = await compressImage(file, 1200, 0.85);
                const compressedSizeMB = fileToUpload.size / (1024 * 1024);
                console.log(`? Kompresi: ${originalSizeMB.toFixed(2)}MB ? ${compressedSizeMB.toFixed(2)}MB`);
            } catch (err) {
                console.warn('? Kompresi gagal:', err);
                fileToUpload = file;
            }
        }

        if (onProgress) onProgress(30);

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("upload_preset", "fiesta");

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = (e.loaded / e.total) * 70;
                    onProgress(30 + percent);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.secure_url) {
                            if (onProgress) onProgress(100);
                            resolve(data.secure_url);
                        } else {
                            reject(new Error('Upload gagal: ' + JSON.stringify(data)));
                        }
                    } catch (err) {
                        reject(new Error('Parse response gagal'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));

            xhr.timeout = 60000;
            xhr.open('POST', 'https://api.cloudinary.com/v1_1/dmookmsr/image/upload');
            xhr.send(formData);
        });
    } catch (err) {
        console.error("Upload error:", err);
        return "";
    }
};

// ==========================================
// EXPORT FUNGSI WATERMARK
// ==========================================
export { applyWatermark };