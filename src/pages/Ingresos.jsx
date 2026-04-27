import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsQR from "jsqr";
import Modal from "../components/Modal";
import {
  createIngreso,
  deleteIngreso,
  getIngresos,
  marcarIngresoCobrado,
} from "../services/ingresoService";
import { getSedes } from "../services/sedeService";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

const formatMoney = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const jsonString = decodeURIComponent(escape(atob(padded)));
  return JSON.parse(jsonString);
}

function extraerDatosQRFiscal(qrText) {
  const url = new URL(qrText);
  const p = url.searchParams.get("p");

  if (!p) {
    throw new Error("El QR no contiene datos fiscales válidos.");
  }

  return decodeBase64Url(p);
}

function tipoComprobanteLabel(codigo) {
  const tipos = {
    1: "Factura A",
    2: "Nota de Débito A",
    3: "Nota de Crédito A",
    6: "Factura B",
    7: "Nota de Débito B",
    8: "Nota de Crédito B",
    11: "Factura C",
    12: "Nota de Débito C",
    13: "Nota de Crédito C",
    51: "Factura M",
  };

  return tipos[codigo] || `Comprobante ${codigo}`;
}

function formatFechaInput(fecha) {
  if (!fecha) return "";
  if (fecha.includes("-")) return fecha;

  const [dd, mm, yyyy] = fecha.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

const emptyForm = {
  fecha: "",
  concepto: "",
  sociedad: "",
  sedeId: "",
  origen: "Obra Social",
  importe: "",
  cobro: "Transferencia",
  estado: "Pendiente",
};

export default function Ingresos({ selectedSede }) {
  const facturaInputRef = useRef(null);

  const [ingresos, setIngresos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [importandoFactura, setImportandoFactura] = useState(false);
  const [ingresoPendiente, setIngresoPendiente] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [ingresosData, sedesData] = await Promise.all([
        getIngresos(),
        getSedes(),
      ]);

      setIngresos(ingresosData);
      setSedes(sedesData);

      setForm((prev) => ({
        ...prev,
        sedeId: prev.sedeId || sedesData[0]?.id || "",
      }));
    } catch (error) {
      console.error("Error cargando ingresos:", error);
      alert(error.message || "No se pudieron cargar los ingresos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const ingresosPorSede = filterBySede(ingresos, selectedSede);

  const ingresosFiltrados = useMemo(() => {
    return ingresosPorSede.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchSearch =
        item.concepto.toLowerCase().includes(searchValue) ||
        item.sociedad.toLowerCase().includes(searchValue) ||
        item.origen.toLowerCase().includes(searchValue) ||
        item.sede.toLowerCase().includes(searchValue);

      const matchEstado =
        estadoFiltro === "Todos" || item.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [ingresosPorSede, search, estadoFiltro]);

  const totalCobrado = ingresosPorSede
    .filter((i) => i.estado === "Cobrado")
    .reduce((acc, i) => acc + Number(i.importe), 0);

  const totalPendiente = ingresosPorSede
    .filter((i) => i.estado === "Pendiente")
    .reduce((acc, i) => acc + Number(i.importe), 0);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await createIngreso(form);
      await loadData();

      setForm({
        ...emptyForm,
        sedeId: sedes[0]?.id || "",
      });

      setModal(null);
    } catch (error) {
      console.error("Error creando ingreso:", error);
      alert(error.message || "No se pudo crear el ingreso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("¿Eliminar este ingreso?");
    if (!confirmDelete) return;

    try {
      await deleteIngreso(id);
      await loadData();
    } catch (error) {
      console.error("Error eliminando ingreso:", error);
      alert(error.message || "No se pudo eliminar el ingreso.");
    }
  }

  async function marcarCobrado(id) {
    try {
      await marcarIngresoCobrado(id);
      await loadData();
    } catch (error) {
      console.error("Error marcando ingreso:", error);
      alert(error.message || "No se pudo marcar como cobrado.");
    }
  }

  async function leerQRDesdePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.5 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, canvas.width, canvas.height);

      if (qr?.data) return qr.data;
    }

    throw new Error("No se encontró ningún código QR en el PDF.");
  }

  async function importarFacturaFiscal(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportandoFactura(true);

      const qrText = await leerQRDesdePDF(file);
      const datos = extraerDatosQRFiscal(qrText);

      const tipoComprobante = tipoComprobanteLabel(datos.tipoCmp);
      const puntoVenta = String(datos.ptoVta || "").padStart(4, "0");
      const numeroComprobante = String(datos.nroCmp || "").padStart(8, "0");

      const sedeDefault =
        selectedSede && selectedSede !== "Todas las sedes"
          ? sedes.find((s) => s.nombre === selectedSede)
          : sedes[0];

      setIngresoPendiente({
        fecha: formatFechaInput(datos.fecha),
        concepto: "",
        sociedad: `CUIT ${datos.cuit}`,
        sedeId: sedeDefault?.id || "",
        origen: "Factura fiscal",
        importe: Number(datos.importe || 0),
        cobro: "Transferencia",
        estado: "Pendiente",
        archivo: file.name,
        comprobante: `${tipoComprobante} ${puntoVenta}-${numeroComprobante}`,
        datosFiscales: {
          ...datos,
          qrUrl: qrText,
          tipoComprobante,
          puntoVenta,
          numeroComprobante,
        },
      });

      setModal("revisarFactura");
    } catch (error) {
      alert(error.message || "No se pudo importar la factura.");
    } finally {
      setImportandoFactura(false);
      e.target.value = "";
    }
  }

  async function confirmarIngresoImportado(e) {
    e.preventDefault();

    if (!ingresoPendiente.concepto.trim()) {
      alert("Debés cargar el concepto antes de guardar el ingreso.");
      return;
    }

    setSaving(true);

    try {
      await createIngreso(ingresoPendiente);
      await loadData();
      setIngresoPendiente(null);
      setModal(null);
    } catch (error) {
      console.error("Error guardando factura importada:", error);
      alert(error.message || "No se pudo guardar el ingreso importado.");
    } finally {
      setSaving(false);
    }
  }

  function verAfip(qrUrl) {
    if (!qrUrl) {
      alert("Este comprobante no tiene URL fiscal disponible.");
      return;
    }

    window.open(qrUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Ingresos</h2>
          <p>Registro de cobros, obras sociales, prepagas y pagos particulares.</p>
        </div>

        <div className="header-actions">
          <input
            ref={facturaInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={importarFacturaFiscal}
          />

          <button
            className="secondary-button"
            onClick={() => facturaInputRef.current?.click()}
            disabled={importandoFactura}
          >
            <Upload size={16} />
            {importandoFactura ? "Leyendo factura..." : "Importar factura PDF"}
          </button>

          <button className="primary-button" onClick={() => setModal("nuevo")}>
            <Plus size={16} /> Nuevo ingreso
          </button>
        </div>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>Total cobrado</span>
            <strong>{formatMoney(totalCobrado)}</strong>
            <small>Ingresos confirmados</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Pendiente de cobro</span>
            <strong>{formatMoney(totalPendiente)}</strong>
            <small>Ingresos aún no acreditados</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por concepto, sociedad, sede u origen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Cobrado</option>
          <option>Pendiente</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Sociedad</th>
              <th>Sede</th>
              <th>Origen</th>
              <th>Importe</th>
              <th>Cobro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="9">Cargando ingresos...</td>
              </tr>
            )}

            {!loading &&
              ingresosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.fecha}</td>
                  <td>{item.concepto}</td>
                  <td>{item.sociedad}</td>
                  <td>{item.sede}</td>
                  <td>{item.origen}</td>
                  <td>{formatMoney(item.importe)}</td>
                  <td>{item.cobro}</td>
                  <td>
                    <span className={`status-badge ${item.estado.toLowerCase()}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {item.datosFiscales?.qrUrl && (
                        <button
                          title="Ver comprobante en AFIP"
                          onClick={() => verAfip(item.datosFiscales.qrUrl)}
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}

                      {item.estado === "Pendiente" && (
                        <button title="Marcar como cobrado" onClick={() => marcarCobrado(item.id)}>
                          ✓
                        </button>
                      )}

                      <button title="Eliminar ingreso" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && ingresosFiltrados.length === 0 && (
              <tr>
                <td colSpan="9">No se encontraron ingresos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "nuevo" && (
        <Modal title="Nuevo ingreso" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Fecha
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </label>

            <label>
              Sociedad
              <input
                required
                value={form.sociedad}
                onChange={(e) => setForm({ ...form, sociedad: e.target.value })}
              />
            </label>

            <label>
              Sede
              <select
                value={form.sedeId}
                onChange={(e) => setForm({ ...form, sedeId: e.target.value })}
                required
              >
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Origen
              <select
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
              >
                <option>Obra Social</option>
                <option>Prepaga</option>
                <option>Particular</option>
                <option>Factura fiscal</option>
              </select>
            </label>

            <label>
              Importe
              <input
                type="number"
                required
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: e.target.value })}
              />
            </label>

            <label>
              Forma de cobro
              <select
                value={form.cobro}
                onChange={(e) => setForm({ ...form, cobro: e.target.value })}
              >
                <option>Transferencia</option>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Cheque</option>
              </select>
            </label>

            <label className="full">
              Concepto
              <input
                required
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Cancelar
              </button>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Guardando..." : "Guardar ingreso"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "revisarFactura" && ingresoPendiente && (
        <Modal title="Revisar factura importada" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={confirmarIngresoImportado}>
            <div className="full">
              <p style={{ margin: 0, opacity: 0.75 }}>
                El sistema leyó los datos fiscales del QR. Completá manualmente el concepto real antes de guardar.
              </p>
            </div>

            <label>
              Fecha
              <input
                type="date"
                required
                value={ingresoPendiente.fecha}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, fecha: e.target.value })
                }
              />
            </label>

            <label>
              Comprobante
              <input value={ingresoPendiente.comprobante} disabled />
            </label>

            <label>
              Sociedad / CUIT
              <input
                required
                value={ingresoPendiente.sociedad}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, sociedad: e.target.value })
                }
              />
            </label>

            <label>
              Sede
              <select
                value={ingresoPendiente.sedeId}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, sedeId: e.target.value })
                }
                required
              >
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Importe
              <input
                type="number"
                required
                value={ingresoPendiente.importe}
                onChange={(e) =>
                  setIngresoPendiente({
                    ...ingresoPendiente,
                    importe: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Forma de cobro
              <select
                value={ingresoPendiente.cobro}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, cobro: e.target.value })
                }
              >
                <option>Transferencia</option>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Cheque</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={ingresoPendiente.estado}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, estado: e.target.value })
                }
              >
                <option>Pendiente</option>
                <option>Cobrado</option>
              </select>
            </label>

            <label>
              Origen
              <select
                value={ingresoPendiente.origen}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, origen: e.target.value })
                }
              >
                <option>Factura fiscal</option>
                <option>Obra Social</option>
                <option>Prepaga</option>
                <option>Particular</option>
              </select>
            </label>

            <label className="full">
              Concepto real del ingreso
              <input
                required
                placeholder="Ej: Pago de práctica médica, acreditación de obra social..."
                value={ingresoPendiente.concepto}
                onChange={(e) =>
                  setIngresoPendiente({ ...ingresoPendiente, concepto: e.target.value })
                }
              />
            </label>

            <div className="full detail-grid">
              <div>
                <span>Archivo</span>
                <strong>{ingresoPendiente.archivo}</strong>
              </div>

              <div>
                <span>CAE / CAEA</span>
                <strong>{ingresoPendiente.datosFiscales.codAut || "-"}</strong>
              </div>

              <div>
                <span>Moneda</span>
                <strong>{ingresoPendiente.datosFiscales.moneda || "-"}</strong>
              </div>

              <div>
                <span>Cotización</span>
                <strong>{ingresoPendiente.datosFiscales.ctz || "-"}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Cancelar
              </button>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Guardando..." : "Confirmar y guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}