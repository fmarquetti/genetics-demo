import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsQR from "jsqr";
import Modal from "../components/Modal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const initialEgresos = [
  {
    id: 1,
    fecha: "31/05/2025",
    proveedor: "Droguería del Sur",
    sociedad: "Central Salud S.A.",
    sede: "Sede Centro",
    concepto: "Insumos médicos",
    importe: 320000,
    categoria: "Insumos",
    estado: "Pagado",
  },
  {
    id: 2,
    fecha: "30/05/2025",
    proveedor: "Edenor",
    sociedad: "Centro Médico S.A.",
    sede: "Sede Norte",
    concepto: "Servicio eléctrico",
    importe: 160000,
    categoria: "Servicios",
    estado: "Pendiente",
  },
  {
    id: 3,
    fecha: "29/05/2025",
    proveedor: "Laboratorios BACON",
    sociedad: "Sede Norte",
    sede: "Sede Norte",
    concepto: "Reactivos",
    importe: 250000,
    categoria: "Reactivos",
    estado: "Pendiente",
  },
];

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

const formatMoney = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
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

function formatFecha(fecha) {
  if (!fecha) return "";

  if (fecha.includes("-")) {
    const [yyyy, mm, dd] = fecha.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  return fecha;
}

export default function Egresos({ selectedSede }) {
  const facturaInputRef = useRef(null);

  const [egresos, setEgresos] = useState(initialEgresos);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [importandoFactura, setImportandoFactura] = useState(false);
  const [egresoPendiente, setEgresoPendiente] = useState(null);

  const egresosPorSede = filterBySede(egresos, selectedSede);

  const [form, setForm] = useState({
    fecha: "",
    proveedor: "",
    sociedad: "",
    sede: "Sede Centro",
    concepto: "",
    importe: "",
    categoria: "Insumos",
    estado: "Pendiente",
  });

  const egresosFiltrados = useMemo(() => {
    return egresosPorSede.filter((item) => {
      const matchSearch =
        item.proveedor.toLowerCase().includes(search.toLowerCase()) ||
        item.concepto.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria.toLowerCase().includes(search.toLowerCase());

      const matchEstado = estadoFiltro === "Todos" || item.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [egresosPorSede, search, estadoFiltro]);

  const totalPagado = egresosPorSede
    .filter((e) => e.estado === "Pagado")
    .reduce((acc, e) => acc + Number(e.importe), 0);

  const totalPendiente = egresosPorSede
    .filter((e) => e.estado === "Pendiente")
    .reduce((acc, e) => acc + Number(e.importe), 0);

  function handleCreate(e) {
    e.preventDefault();

    setEgresos((prev) => [
      {
        id: Date.now(),
        ...form,
        importe: Number(form.importe),
      },
      ...prev,
    ]);

    setForm({
      fecha: "",
      proveedor: "",
      sociedad: "",
      sede: "Sede Centro",
      concepto: "",
      importe: "",
      categoria: "Insumos",
      estado: "Pendiente",
    });

    setModal(null);
  }

  function handleDelete(id) {
    setEgresos((prev) => prev.filter((item) => item.id !== id));
  }

  function marcarPagado(id) {
    setEgresos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: "Pagado" } : item))
    );
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

      setEgresoPendiente({
        id: Date.now(),
        fecha: formatFecha(datos.fecha),
        proveedor: `CUIT ${datos.cuit}`,
        sociedad: "",
        sede: selectedSede && selectedSede !== "Todas las sedes" ? selectedSede : "Todas",
        concepto: "",
        importe: Number(datos.importe || 0),
        categoria: "Insumos",
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

  function confirmarEgresoImportado(e) {
    e.preventDefault();

    if (!egresoPendiente.concepto.trim()) {
      alert("Debés cargar el concepto antes de guardar el egreso.");
      return;
    }

    if (!egresoPendiente.proveedor.trim()) {
      alert("Debés cargar el proveedor antes de guardar el egreso.");
      return;
    }

    setEgresos((prev) => [egresoPendiente, ...prev]);
    setEgresoPendiente(null);
    setModal(null);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Egresos</h2>
          <p>Control de proveedores, gastos operativos, reactivos e insumos.</p>
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
            <Plus size={16} /> Nuevo egreso
          </button>
        </div>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>Total pagado</span>
            <strong>{formatMoney(totalPagado)}</strong>
            <small>Egresos confirmados</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Pendiente de pago</span>
            <strong>{formatMoney(totalPendiente)}</strong>
            <small>Proveedores y servicios</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por proveedor, concepto o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Pagado</option>
          <option>Pendiente</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Sociedad</th>
              <th>Sede</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Importe</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {egresosFiltrados.map((item) => (
              <tr key={item.id}>
                <td>{item.fecha}</td>
                <td>{item.proveedor}</td>
                <td>{item.sociedad}</td>
                <td>{item.sede}</td>
                <td>{item.concepto}</td>
                <td>{item.categoria}</td>
                <td>{formatMoney(item.importe)}</td>
                <td>
                  <span className={`status-badge ${item.estado.toLowerCase()}`}>
                    {item.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    {item.estado === "Pendiente" && (
                      <button onClick={() => marcarPagado(item.id)}>✓</button>
                    )}

                    <button onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {egresosFiltrados.length === 0 && (
              <tr>
                <td colSpan="9">No se encontraron egresos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "nuevo" && (
        <Modal title="Nuevo egreso" onClose={() => setModal(null)}>
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
              Proveedor
              <input
                required
                value={form.proveedor}
                onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
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
                value={form.sede}
                onChange={(e) => setForm({ ...form, sede: e.target.value })}
              >
                <option>Sede Centro</option>
                <option>Sede Norte</option>
                <option>Sede Sur</option>
                <option>Sede Oeste</option>
                <option>Sede Pilar</option>
              </select>
            </label>

            <label>
              Categoría
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                <option>Insumos</option>
                <option>Reactivos</option>
                <option>Servicios</option>
                <option>Sueldos</option>
                <option>Alquileres</option>
                <option>Mantenimiento</option>
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
              <button type="submit" className="primary-button">
                Guardar egreso
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "revisarFactura" && egresoPendiente && (
        <Modal title="Revisar factura importada" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={confirmarEgresoImportado}>
            <div className="full">
              <p style={{ margin: 0, opacity: 0.75 }}>
                El sistema leyó los datos fiscales del QR. Completá manualmente el proveedor,
                sociedad, categoría y concepto real antes de guardar el egreso.
              </p>
            </div>

            <label>
              Fecha
              <input
                required
                value={egresoPendiente.fecha}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, fecha: e.target.value })
                }
              />
            </label>

            <label>
              Comprobante
              <input value={egresoPendiente.comprobante} disabled />
            </label>

            <label>
              Proveedor / CUIT
              <input
                required
                value={egresoPendiente.proveedor}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, proveedor: e.target.value })
                }
              />
            </label>

            <label>
              Sociedad
              <input
                required
                placeholder="Ej: Central Salud S.A."
                value={egresoPendiente.sociedad}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, sociedad: e.target.value })
                }
              />
            </label>

            <label>
              Sede
              <select
                value={egresoPendiente.sede}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, sede: e.target.value })
                }
              >
                <option>Todas</option>
                <option>Sede Centro</option>
                <option>Sede Norte</option>
                <option>Sede Sur</option>
                <option>Sede Oeste</option>
                <option>Sede Pilar</option>
              </select>
            </label>

            <label>
              Categoría
              <select
                value={egresoPendiente.categoria}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, categoria: e.target.value })
                }
              >
                <option>Insumos</option>
                <option>Reactivos</option>
                <option>Servicios</option>
                <option>Sueldos</option>
                <option>Alquileres</option>
                <option>Mantenimiento</option>
              </select>
            </label>

            <label>
              Importe
              <input
                type="number"
                required
                value={egresoPendiente.importe}
                onChange={(e) =>
                  setEgresoPendiente({
                    ...egresoPendiente,
                    importe: Number(e.target.value),
                  })
                }
              />
            </label>

            <label>
              Estado
              <select
                value={egresoPendiente.estado}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, estado: e.target.value })
                }
              >
                <option>Pendiente</option>
                <option>Pagado</option>
              </select>
            </label>

            <label className="full">
              Concepto real del egreso
              <input
                required
                placeholder="Ej: Reactivos de laboratorio, mantenimiento de equipos, insumos médicos..."
                value={egresoPendiente.concepto}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, concepto: e.target.value })
                }
              />
            </label>

            <div className="full detail-grid">
              <div>
                <span>Archivo</span>
                <strong>{egresoPendiente.archivo}</strong>
              </div>

              <div>
                <span>CAE / CAEA</span>
                <strong>{egresoPendiente.datosFiscales.codAut || "-"}</strong>
              </div>

              <div>
                <span>Moneda</span>
                <strong>{egresoPendiente.datosFiscales.moneda || "-"}</strong>
              </div>

              <div>
                <span>Cotización</span>
                <strong>{egresoPendiente.datosFiscales.ctz || "-"}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Cancelar
              </button>

              <button type="submit" className="primary-button">
                Confirmar y guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}