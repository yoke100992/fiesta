import { useEffect, useState } from "react";
import Select from "react-select";
import { getSellOut, getPermit } from "../api/api";
import Swal from "sweetalert2";

export default function SummaryCalendar() {

  const [rawData, setRawData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
 
  const [namaSPG, setNamaSPG] = useState(null);
  const currentMonth = new Date().getMonth() + 1;

const [bulan, setBulan] = useState({
  value: currentMonth,
  label: [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ][currentMonth - 1]
});

  const [tahun, setTahun] = useState({ value: 2026, label: "2026" });
  
  const [showCalendar, setShowCalendar] = useState(false);
 const [permitData, setPermitData] = useState([]);
  
  // ✅ INI TEMPATNYA DI SINI
  

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    setLoading(true);

    const res = await getSellOut();
    const permitRes = await getPermit();

    // ✅ PARSE SELL OUT
    const raw =
      Array.isArray(res) ? res :
      res.data ? res.data :
      res.result ? res.result :
      res.items ? res.items :
      res?.data?.items ? res.data.items :
      [];

    // ✅ PARSE PERMIT
    const permit =
      Array.isArray(permitRes) ? permitRes :
      permitRes.data ? permitRes.data :
      permitRes.result ? permitRes.result :
      [];

    // ✅ SET STATE
    setRawData(raw);
    setPermitData(permit);

  } catch (err) {
    console.error("ERROR:", err);
    Swal.fire("Error", "Gagal ambil data", "error");
  } finally {
    setLoading(false);
  }
};

  // 🔥 FILTER
 const applyFilter = () => {

  if (!namaSPG || !bulan || !tahun) {
    Swal.fire("Warning", "Lengkapi filter dulu!", "warning");
    return;
  }

  // 🔥 LOADING POPUP
  Swal.fire({
    title: "Mohon tunggu...",
    text: "Sedang membaca data",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  setTimeout(() => {

    const grouped = {};

    rawData.forEach(r => {

      const tglRaw = r["Tanggal"];
      if (!tglRaw) return;

      const date = new Date(tglRaw);
      if (isNaN(date)) return;

      const bln = date.getMonth() + 1;
      const thn = date.getFullYear();

      const nama =
        (r["Nama SPG"] || "")
          .toLowerCase()
          .trim();

      const filterNama =
        namaSPG.value.toLowerCase().trim();

      if (
        nama !== filterNama ||
        bln !== bulan.value ||
        thn !== tahun.value
      ) return;

      const tgl = date.toISOString().slice(0, 10);

      const total =
        Number(r["Total"]) ||
        (Number(r["Qty"]) * Number(r["Harga"])) ||
        0;

      if (!grouped[tgl]) grouped[tgl] = 0;
      grouped[tgl] += total;

    });

    const result = Object.entries(grouped).map(([tgl, total]) => ({
      tanggal: tgl,
      total
    }));

    setFiltered(result);
    setShowCalendar(true);

    Swal.close();

  }, 700); // delay biar smooth
};
  // 📅 CALENDAR
  const generateCalendar = () => {
    if (!bulan || !tahun) return [];

    const firstDay = new Date(tahun.value, bulan.value - 1, 1);
    const lastDate = new Date(tahun.value, bulan.value, 0).getDate();
    const startDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) days.push(d);

    return days;
  };

  const calendarDays = generateCalendar();

  // MAP DATA
  const dataMap = {};
  filtered.forEach(d => {
    const day = new Date(d.tanggal).getDate();
    dataMap[day] = d.total;
  }); 
  
const permitMap = {};

if (Array.isArray(permitData)) {

permitData.slice(1).forEach(p => {

  const tgl = new Date(p[1]);
  if (isNaN(tgl)) return;

  const bln = tgl.getMonth() + 1;
  const thn = tgl.getFullYear();

  const nama = (p[2] || "").toLowerCase().trim();
  const status = p[3];

  const filterNama =
    (namaSPG?.value || "").toLowerCase().trim();

  if (
    nama !== filterNama ||
    bln !== bulan.value ||
    thn !== tahun.value
  ) return;

  const day = tgl.getDate();

  permitMap[day] = status;

});

}
  // OPTIONS
  const spgOptions = [
    ...new Set(rawData.map(r => r["Nama SPG"]).filter(Boolean))
  ].map(n => ({ value: n, label: n }));

  const bulanOptions = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ];

  const tahunOptions = [2024, 2025, 2026, 2027].map(t => ({
    value: t,
    label: t.toString()
  }));

  const maxValue = Math.max(...Object.values(dataMap), 0);

 const getColor = (value, permit) => {

  // 🔴 kalau permit (tanpa sales)
  if (!value && permit) {
    return "#fee2e2"; // merah soft
  }

  // ⚪ kosong
  if (!value) {
    return "#f0fdf4"; // hijau super muda
  }

  const ratio = value / maxValue;

  return `rgba(34, 197, 94, ${0.2 + ratio * 0.6})`;
};

  return (
    <div className="page">

      <div className="container">

        <div className="header">
          <h1>Sales Calendar</h1>
          <p>Monitoring penjualan SPG</p>
        </div>

        {/* FILTER */}
        <div className="card filter-card">

          <Select
  options={spgOptions}
  value={namaSPG}
  onChange={setNamaSPG}
  placeholder={loading ? "Loading data SPG..." : "Pilih Nama SPG"}

  isDisabled={loading || spgOptions.length === 0}

  onMenuOpen={() => {
    if ((loading || spgOptions.length === 0) && !Swal.isVisible()) {
      Swal.fire({
        title: "Mohon Tunggu",
        text: "Data SPG sedang dimuat...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();

        }
      });
    }
  }}
/>
         <Select
  options={bulanOptions}
  value={bulan}
  onChange={setBulan}
/>

          <Select
            options={tahunOptions}
            value={tahun}
            onChange={setTahun}
          />

          <button onClick={applyFilter}>
            Tampilkan
          </button>

        </div>

        {/* LOADING */}
       
        {/* CALENDAR */}
        {
  showCalendar && calendarDays.length > 0 &&
  <div className="card">

    <div className="calendar-header">
      {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(h => (
        <div key={h}>{h}</div>
      ))}
    </div>

    <div className="calendar-grid">
      {
        calendarDays.map((d, i) => {
          const value = dataMap[d];
          const permit = permitMap[d];

          return (
            <div
              key={i}
              className="day"
              style={{ background: getColor(value, permit) }}
            >
              {d && (
                <>
                  <div className="date">{d}</div>

                  {/* ✅ PRIORITAS: SALES */}
                  {value ? (
                    <div className="amount">
                      Rp {value.toLocaleString("id-ID")}
                    </div>
                  ) : permit ? (
                    /* ✅ JIKA TIDAK ADA SALES, TAPI ADA PERMIT */
                    <div className="permit">
                      {permit}
                    </div>
                  ) : null}

                </>
              )}
            </div>
          );
        })
      }
    </div>

  </div>
}

      </div>

      {/* STYLE */}
      
<style>{`

.page {
  min-height: 100vh;
  background: #f6f8fb;
  padding: 30px;
  font-family: 'Inter', sans-serif;
}

.container {
  max-width: 1100px;
  margin: auto;
}

/* HEADER */
.header h1 {
  margin: 0;
  font-size: 28px;
}

.header p {
  color: #666;
}

/* CARD */
.card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  margin-top: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
}

/* FILTER */
.filter-card {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-card > div {
  flex: 1;
  min-width: 180px;
}

button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
}

/* HEADER HARI */
.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
  color: #888;
  font-size: 13px;
}

/* GRID */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

/* CELL */
.day {
  background: #f1f3f5;
  border-radius: 12px;
  height: 90px;
  padding: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* TANGGAL */
.date {
  font-weight: 700;
  font-size: 14px;
}

/* SALES */
.amount {
  font-size: 11px;
  margin-top: 5px;
  line-height: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* PERMIT */
.permit {
  font-size: 11px;
  margin-top: 5px;
  color: #b91c1c;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =====================
      MOBILE
===================== */
@media (max-width: 600px) {

  .page {
    padding: 10px;
  }

  .header h1 {
    font-size: 22px;
  }

  .header p {
    font-size: 13px;
  }

  .card {
    padding: 10px;
    border-radius: 12px;
  }

  .filter-card {
    display: block;
  }

  .filter-card > * {
    width: 100%;
    margin-bottom: 8px;
  }

  .calendar-header {
    font-size: 10px;
    margin-bottom: 5px;
  }

  .calendar-grid {
    gap: 4px;
  }

  .day {
    height: 55px;
    min-height: 55px;
    padding: 4px;
    border-radius: 7px;
  }

  .date {
    font-size: 11px;
  }

  .amount,
  .permit {
    font-size: 8px;
    line-height: 10px;
    margin-top: 3px;
  }
}

/* HP SANGAT KECIL */
@media (max-width: 380px) {

  .day {
    height: 48px;
    min-height: 48px;
  }

  .amount,
  .permit {
    font-size: 7px;
  }

  .date {
    font-size: 10px;
  }
}

`}</style>
         </div>
  );
}