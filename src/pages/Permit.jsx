import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Table } from "react-bootstrap";
import Select from "react-select";
import Swal from "sweetalert2";

// ✅ API
import { getSPG, submitPermit, getPermit } from "../api/api";

export default function Permit() {
  const [form, setForm] = useState({
    tanggal: "",
    nama: null,
    status: "SAKIT",
  });

  const [namaOptions, setNamaOptions] = useState([]);
  const [permitData, setPermitData] = useState([]);
  const [loading, setLoading] = useState(false);

  const statusOptions = ["SAKIT", "IZIN", "CUTI", "OFF", "MEETING", " TIDAK ADA PENJUALAN"];

  // 🔥 LOAD AWAL
  useEffect(() => {
    loadSPG();
    loadPermit();
  }, []);

  // 🔥 LOAD SPG
  const loadSPG = async () => {
    try {
      const data = await getSPG();

      const options = data.map((item) => ({
        value: item.nama || item,
        label: item.nama || item,
      }));

      setNamaOptions(options);
    } catch (err) {
      Swal.fire("Error", "Gagal ambil data SPG", "error");
    }
  };

  // 🔥 LOAD PERMIT
  const loadPermit = async () => {
  try {
    const res = await getPermit();

    const data = res.slice(1);

    // 🔥 SORT TERBARU DI ATAS (pakai Timestamp index 0)
    data.sort((a, b) => new Date(b[0]) - new Date(a[0]));

    setPermitData(data);
  } catch (err) {
    Swal.fire("Error", "Gagal ambil data Permit", "error");
  }
};

  // 🔥 FORMAT TANGGAL
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    const d = new Date(dateStr);

    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // 🔥 SUBMIT
  const handleSubmit = async () => {
    if (!form.tanggal || !form.nama) {
      Swal.fire("Warning", "Lengkapi data dulu!", "warning");
      return;
    }

    setLoading(true);

    const payload = {
      tanggal: form.tanggal,
      nama: form.nama.value,
      status: form.status,
    };

    try {
      const res = await submitPermit(payload);

      if (res?.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Permit berhasil disimpan",
          timer: 1500,
          showConfirmButton: false,
        });

        setForm({
          tanggal: "",
          nama: null,
          status: "SAKIT",
        });

        // 🔥 reload table
        loadPermit();
      } else {
        Swal.fire("Error", "Gagal simpan data", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Terjadi kesalahan", "error");
    }

    setLoading(false);
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "700px" }}>
      
      {/* ================= FORM ================= */}
      <Card className="shadow-lg border-0 mb-4">
        <Card.Body>
          <h3 className="mb-4 fw-bold text-danger text-center">
            Permit SPG
          </h3>

          <Form>
            {/* TANGGAL */}
            <Form.Group className="mb-3">
              <Form.Label>Tanggal</Form.Label>
              <Form.Control
                type="date"
                value={form.tanggal}
                onChange={(e) =>
                  setForm({ ...form, tanggal: e.target.value })
                }
              />
            </Form.Group>

            {/* NAMA */}
            <Form.Group className="mb-3">
              <Form.Label>Nama SPG</Form.Label>
              <Select
                options={namaOptions}
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e })}
                placeholder="Pilih SPG..."
                isClearable
              />
            </Form.Group>

            {/* STATUS */}
            <Form.Group className="mb-4">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* BUTTON */}
            <Button
              variant="danger"
              className="w-100 fw-bold"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Permit"}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* ================= TABLE ================= */}
      <Card className="shadow-sm border-0">
  <Card.Body>
    <h5 className="fw-bold mb-3">Data Permit</h5>

    {/* 🔥 SCROLL AREA */}
    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
      <Table striped bordered hover size="sm">
        <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
          <tr>
            <th>Tanggal</th>
            <th>Nama</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {permitData.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center text-muted">
                Tidak ada data
              </td>
            </tr>
          ) : (
            permitData.map((p, i) => (
              <tr key={i}>
                <td>{formatDate(p[1])}</td>
                <td>{p[2]}</td>
                <td>{p[3]}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  </Card.Body>
</Card>
    </Container>
  );
}