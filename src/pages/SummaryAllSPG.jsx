import { useEffect, useState } from "react";
import Select from "react-select";
import { getSellOut, getPermit } from "../api/api";

export default function SummaryAllSPG() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const monthOptions = [
    { value: 0, label: "Januari" },
    { value: 1, label: "Februari" },
    { value: 2, label: "Maret" },
    { value: 3, label: "April" },
    { value: 4, label: "Mei" },
    { value: 5, label: "Juni" },
    { value: 6, label: "Juli" },
    { value: 7, label: "Agustus" },
    { value: 8, label: "September" },
    { value: 9, label: "Oktober" },
    { value: 10, label: "November" },
    { value: 11, label: "Desember" }
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = today.getFullYear() - 2 + i;
    return { value: y, label: y.toString() };
  });

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [sellRes, permitRes] = await Promise.all([
        getSellOut(),
        getPermit()
      ]);

      const sellRaw =
        Array.isArray(sellRes) ? sellRes :
        sellRes.data ? sellRes.data :
        sellRes.result ? sellRes.result :
        [];

      const permitRaw =
        Array.isArray(permitRes) ? permitRes :
        permitRes.data ? permitRes.data :
        permitRes.result ? permitRes.result :
        [];

      processData(sellRaw, permitRaw);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processData = (sellRaw, permitRaw) => {

    const grouped = {};
    const permitMap = {};

    const normalizeNama = (text) => {
      return (text || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
    };

    const safeDate = (val) => {
      if (!val) return null;

      if (typeof val === "string" && val.includes("/")) {
        const [d, m, y] = val.split("/");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }

      const d = new Date(val);
      if (isNaN(d)) return null;

      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    // ===== PERMIT =====
    permitRaw.slice(1).forEach(p => {
      const tgl = safeDate(p[1]);
      const nama = normalizeNama(p[2]);
      const status = (p[3] || "").toUpperCase();

      if (!nama || !tgl) return;

      const date = new Date(tgl);

      if (date.getMonth() !== month || date.getFullYear() !== year) return;

      permitMap[`${nama}_${tgl}`] = status;
    });

    // inject permit ke grouped
    Object.entries(permitMap).forEach(([key, status]) => {
      const [nama, tgl] = key.split("_");
      const day = new Date(tgl).getDate();

      if (!grouped[nama]) {
        grouped[nama] = Array(31).fill(null).map(() => ({
          total: 0,
          status: null
        }));
      }

      grouped[nama][day - 1].status = status;
    });

    // ===== SELL =====
    sellRaw.forEach(r => {
      const nama = normalizeNama(r["Nama SPG"]);
      const tgl = safeDate(r["Tanggal"]);

      const total =
        Number(r["Total"]) ||
        (Number(r["Qty"]) * Number(r["Harga"])) ||
        0;

      if (!nama || !tgl) return;

      const date = new Date(tgl);

      if (date.getMonth() !== month || date.getFullYear() !== year) return;

      const day = date.getDate();

      if (!grouped[nama]) {
        grouped[nama] = Array(31).fill(null).map(() => ({
          total: 0,
          status: null
        }));
      }

      grouped[nama][day - 1].total += total;

      const key = `${nama}_${tgl}`;
      if (permitMap[key]) {
        grouped[nama][day - 1].status = permitMap[key];
      }
    });

    const result = Object.keys(grouped).map(nama => ({
      nama,
      values: grouped[nama]
    }));

    setData(result);
  };

  const formatRupiah = (val) => {
    if (!val) return "-";
    return val.toLocaleString("id-ID");
  };

  const getClass = (val, status) => {
    if (val) return "active";
    if (!status) return "";

    if (status === "OFF") return "off";
    if (status === "IZIN") return "izin";
    if (status === "MEETING") return "meeting";

    return "off";
  };

const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

const dates = Array.from(
  { length: new Date(selectedYear, selectedMonth + 1, 0).getDate() },
  (_, i) => new Date(selectedYear, selectedMonth, i + 1)
);

  return (
    <div className="page">

      <div className="header">
        <h2> Summary All SPG</h2>
   

        <div className="filters">
          <Select
            options={monthOptions}
            value={monthOptions.find(m => m.value === month)}
            onChange={(e) => setMonth(e.value)}
            className="select"
          />

          <Select
            options={yearOptions}
            value={yearOptions.find(y => y.value === year)}
            onChange={(e) => setYear(e.value)}
            className="select"
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
  <tr>
    <th className="sticky-col">Nama</th>

    {dates.map((d, i) => {
      const dateObj = new Date(d);
      const isSunday = dateObj.getDay() === 0;

      return (
        <th key={i} className={isSunday ? "sunday" : ""}>
          {dateObj.getDate()}
        </th>
      );
    })}

  </tr>
</thead>

              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td className="sticky-col name">{row.nama}</td>

                    {row.values.map((item, idx) => {
                      const val = item?.total || 0;
                      const status = item?.status;

                      return (
                        <td key={idx} className={getClass(val, status)}>
                          {val
                            ? formatRupiah(val)
                            : status
                            ? status
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`

.page {
  padding:30px;
  background:#f1f5f9;
  font-family:'Segoe UI', sans-serif;
}

/* HEADER */
.header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-wrap:wrap;
}

.filters {
  display:flex;
  gap:10px;
}

.select {
  width:150px;
}

/* CARD */
.card {
  margin-top:20px;
  background:white;
  border-radius:20px;
  padding:20px;
  box-shadow:0 10px 25px rgba(0,0,0,.08);
}

/* TABLE */
.table-wrapper {
  overflow:auto;
  border-radius:12px;
}

table {
  border-collapse:separate;
  border-spacing:0;
  min-width:1200px;
}

/* HEADER NAVY */
th {
  position:sticky;
  top:0;
  background:#0f172a;
  color:#f1f5f9;
  font-size:12px;
  font-weight:600;
  padding:12px 10px;
  text-align:center;
  z-index:3;
  border-bottom:1px solid #334155;
  box-shadow:0 2px 6px rgba(0,0,0,0.15);
}

/* Hover header */
th:hover {
  background:#1e293b;
}

/* STICKY COLUMN (NAMA) */
.sticky-col {
  position:sticky;
  left:0;
  background:white;
  z-index:2;
  font-weight:600;
}

/* POJOK KIRI (HEADER + STICKY) */
thead .sticky-col {
  background:#0f172a;
  color:white;
  z-index:4;
}

/* BODY */
td {
  padding:10px 8px;
  text-align:center;
  font-size:12px;
  border-bottom:1px solid #eee;
  color:#1e293b;
}

/* Zebra row */
tbody tr:nth-child(even) {
  background:#f8fafc;
}

/* Hover row */
tbody tr:hover {
  background:#e2e8f0;
  transition:.2s;
}

/* STATUS WARNA */
.active { background:#dcfce7; }
.off { background:#fee2e2; }
.izin { background:#fef3c7; }
.meeting { background:#dbeafe; }

/* LOADING */
.loading {
  text-align:center;
  padding:40px;
  font-weight:500;
  color:#64748b;
}

/* HEADER HARI MINGGU */
th.sunday {
  background: #7f1d1d !important; /* 🔥 merah gelap elegan */
  color: #fee2e2;
}

/* Hover tetap beda */
th.sunday:hover {
  background: #991b1b !important;
}


      `}</style>
    </div>
  );
}