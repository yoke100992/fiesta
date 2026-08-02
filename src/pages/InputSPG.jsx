import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Table,
  Row,
  Col,
  Badge
} from "react-bootstrap";
import Select from "react-select";
import Swal from "sweetalert2";

import {
  getSPG,
  getProduct,
  submitSellOut,
  uploadImage
} from "../api/api";

export default function InputSPG() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [spgList, setSpgList] = useState([]);
  const [productList, setProductList] = useState([]);

  const [form, setForm] = useState({
    tanggal: "",
    nama: null,
    outlet: ""
  });

  const [item, setItem] = useState({
    sku: null,
    harga: "",
    qty: ""
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);

  const [list, setList] = useState([]);

  // ================= FORMAT =================
  const formatNumber = (val) =>
    new Intl.NumberFormat("id-ID").format(val || 0);

  const parseNumber = (val) =>
    Number(val.replace(/\D/g, "")) || 0;

  // ================= LOAD =================
  useEffect(() => {
    const load = async () => {
      const spg = await getSPG();
      const product = await getProduct();

      setSpgList(
        (spg || []).map((s) => ({
          value: s.nama || s,
          label: s.nama || s
        }))
      );

      setProductList(
        (product || []).map((p) => ({
          value: p.sku,
          label: `${p.sku}`,
          harga: p.hargaDefault || p.harga || 0
        }))
      );
    };

    load();
  }, []);

  // ================= IMAGE =================
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);

    const url = URL.createObjectURL(file);

    setPhoto(file);
    setPreview(url);
  };

  // ================= ADD ITEM =================
  const addItem = () => {
    if (!item.sku || item.qty <= 0) {
      Swal.fire("Warning", "Lengkapi item dulu!", "warning");
      return;
    }

    const newItem = {
      sku: item.sku.value,
      qty: item.qty,
      harga: item.harga,
      total: item.qty * item.harga
    };

    setList([...list, newItem]);

    setItem({
      sku: null,
      harga: "",
      qty: ""
    });
  };

  // ================= SUBMIT =================
  const submit = async () => {
    if (loading) return;

    if (!form.tanggal || !form.nama || !form.outlet) {
      Swal.fire("Warning", "Lengkapi data dulu!", "warning");
      return;
    }

    if (list.length === 0) {
      Swal.fire("Warning", "Item masih kosong!", "warning");
      return;
    }

    if (!photo) {
      Swal.fire("Warning", "Foto wajib diupload!", "warning");
      return;
    }

    setLoading(true);

    try {
      // 🔥 upload foto
      const imageUrl = await uploadImage(photo);

      if (!imageUrl) {
        Swal.fire("Error", "Upload foto gagal!", "error");
        setLoading(false);
        return;
      }

      // 🔥 submit data
      const res = await submitSellOut({
        tanggal: form.tanggal,
        nama: form.nama.value,
        outlet: form.outlet,
        photo: imageUrl,
        items: list
      });

      if (!res || res.status !== "success") {
        Swal.fire("Error", "Gagal simpan data!", "error");
        setLoading(false);
        return;
      }

      Swal.fire("Success", "Data berhasil disimpan!", "success");

      // 🔥 RESET
      setList([]);
      setPhoto(null);
      setPreview(null);
      setStep(1);

      setForm({
        tanggal: "",
        nama: null,
        outlet: ""
      });

      document.querySelector('input[type="file"]').value = "";

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan", "error");
    }

    setLoading(false);
  };

  const total = item.qty * item.harga;
  const grandTotal = list.reduce((sum, i) => sum + i.total, 0);

  return (
    <Container className="mt-4" style={{ maxWidth: "800px" }}>
      <Card className="border-0 shadow-lg rounded-4">
        <Card.Body>

          {/* STEP */}
          <div className="mb-4 text-center">
            <Badge bg={step === 1 ? "primary" : "secondary"}>Step 1</Badge> ➜
            <Badge bg={step === 2 ? "success" : "secondary"}> Step 2</Badge>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h5 className="fw-bold text-primary text-center mb-4">
                Perhatikan Tanggal 
              </h5>

              <Form>
                <Row>
                  <Col md={6}>
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
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SPG</Form.Label>
                      <Select
                        options={spgList}
                        value={form.nama}
                        onChange={(e) =>
                          setForm({ ...form, nama: e })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Outlet</Form.Label>
                  <Form.Control
                    value={form.outlet}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        outlet: e.target.value.toUpperCase()
                      })
                    }
                  />
                </Form.Group>

                <Button
                  className="w-100 rounded-pill"
                  onClick={() => setStep(2)}
                >
                  Lanjut ➜
                </Button>
              </Form>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h5 className="fw-bold text-success text-center mb-3">
                Input Transaksi + Foto Aktivitas Grid
              </h5>

              {/* FOTO */}
              <Form.Group className="mb-3">
                <Form.Label>Foto Activity Grid (WAJIB)</Form.Label>
                <Form.Control type="file" onChange={handleImage} />
              </Form.Group>

              {preview && (
                <img
                  src={preview}
                  className="rounded shadow mb-3"
                  width={150}
                />
              )}

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pilih SKU</Form.Label>
                      <Select
                        options={productList}
                        value={item.sku}
                        onChange={(e) =>
                          setItem({
                            ...item,
                            sku: e,
                            harga: e.harga
                          })
                        }
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Harga</Form.Label>
                      <Form.Control
                        value={formatNumber(item.harga)}
                        onChange={(e) =>
                          setItem({
                            ...item,
                            harga: parseNumber(e.target.value)
                          })
                        }
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          setItem({
                            ...item,
                            qty: +e.target.value
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6>Total: Rp {formatNumber(total)}</h6>

                <Button
                  onClick={addItem}
                  className="w-100 mt-2"
                  variant="success"
                >
                  + Tambah Item
                </Button>
              </Form>

              <Table className="mt-3" striped>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((l, i) => (
                    <tr key={i}>
                      <td>{l.sku}</td>
                      <td>{l.qty}</td>
                      <td>{formatNumber(l.total)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setList(list.filter((_, x) => x !== i))
                          }
                        >
                          ❌
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h5 className="text-end">
                Grand Total: Rp {formatNumber(grandTotal)}
              </h5>

              <Button
                onClick={submit}
                disabled={loading}
                className="w-100 mt-3 rounded-pill"
              >
                {loading ? "Menyimpan..." : "Submit"}
              </Button>

              <Button
                variant="link"
                onClick={() => setStep(1)}
                className="w-100"
              >
                ← Kembali
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}