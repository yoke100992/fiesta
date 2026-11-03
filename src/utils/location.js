// ==========================================
// FUNGSI GPS & REVERSE GEOCODE
// ==========================================

// Ambil koordinat GPS
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Browser tidak mendukung GPS'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                let message = 'Gagal mendapatkan lokasi';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Izin GPS ditolak. Aktifkan GPS di pengaturan browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Informasi lokasi tidak tersedia';
                        break;
                    case error.TIMEOUT:
                        message = 'Waktu permintaan lokasi habis';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
};

// Reverse geocode: koordinat ? alamat (pakai Nominatim/OpenStreetMap - GRATIS)
export const reverseGeocode = async (lat, lng) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'id' // Bahasa Indonesia
                }
            }
        );

        if (!response.ok) throw new Error('Reverse geocode gagal');

        const data = await response.json();

        // Format alamat
        const address = data.address || {};
        const road = address.road || address.jalan || '';
        const suburb = address.suburb || address.kelurahan || '';
        const city = address.city || address.town || address.kabupaten || address.kota || '';
        const state = address.state || address.provinsi || '';
        const postcode = address.postcode || '';

        // Gabungkan alamat
        const fullAddress = [road, suburb, city, state, postcode]
            .filter(Boolean)
            .join(', ');

        // Plus code (optional)
        const plusCode = data.plus_code?.compound_code || '';

        return {
            alamat: fullAddress,
            kota: city ? `${city}${state ? ', ' + state : ''}` : '',
            plusCode: plusCode,
            displayName: data.display_name || fullAddress
        };
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return {
            alamat: 'Alamat tidak tersedia',
            kota: '',
            plusCode: '',
            displayName: ''
        };
    }
};

// Format tanggal & jam
export const formatDateTime = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
};