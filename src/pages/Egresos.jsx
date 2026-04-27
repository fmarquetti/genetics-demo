import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsQR from "jsqr";
import Modal from "../components/Modal";
import {
  createEgreso,
  deleteEgreso,
  getEgresos,
  marcarEgresoPagado,
} from "../services/egresoService";
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
  proveedor: "",
  sociedad: "",
  sedeId: "",
  concepto: "",
  importe: "",
  categoria: "Insumos",
  estado: "Pendiente",
};

export default function Egresos({ selectedSede }) {
  const facturaInputRef = useRef(null);

  const [egresos, setEgresos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [importandoFactura, setImportandoFactura] = useState(false);
  const [egresoPendiente, setEgresoPendiente] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [egresosData, sedesData] = await Promise.all([
        getEgresos(),
        getSedes(),
      ]);

      setEgresos(egresosData);
      setSedes(sedesData);

      setForm((prev) => ({
        ...prev,
        sedeId: prev.sedeId || sedesData[0]?.id || "",
      }));
    } catch (error) {
      console.error("Error cargando egresos:", error);
      alert(error.message || "No se pudieron cargar los egresos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const egresosPorSede = filterBySede(egresos, selectedSede);

  const egresosFiltrados = useMemo(() => {
    return egresosPorSede.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchSearch =
        item.proveedor.toLowerCase().includes(searchValue) ||
        item.sociedad.toLowerCase().includes(searchValue) ||
        item.sede.toLowerCase().includes(searchValue) ||
        item.concepto.toLowerCase().includes(searchValue) ||
        item.categoria.toLowerCase().includes(searchValue);

      const matchEstado =
        estadoFiltro === "Todos" || item.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [egresosPorSede, search, estadoFiltro]);

  const totalPagado = egresosPorSede
    .filter((e) => e.estado === "Pagado")
    .reduce((acc, e) => acc + Number(e.importe), 0);

  const totalPendiente = egresosPorSede
    .filter((e) => e.estado === "Pendiente")
    .reduce((acc, e) => acc + Number(e.importe), 0);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await createEgreso(form);
      await loadData();

      setForm({
        ...emptyForm,
        sedeId: sedes[0]?.id || "",
      });

      setModal(null);
    } catch (error) {
      console.error("Error creando egreso:", error);
      alert(error.message || "No se pudo crear el egreso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("¿Eliminar este egreso?");
    if (!confirmDelete) return;

    try {
      await deleteEgreso(id);
      await loadData();
    } catch (error) {
      console.error("Error eliminando egreso:", error);
      alert(error.message || "No se pudo eliminar el egreso.");
    }
  }

  async function marcarPagado(id) {
    try {
      await marcarEgresoPagado(id);
      await loadData();
    } catch (error) {
      console.error("Error marcando egreso:", error);
      alert(error.message || "No se pudo marcar como pagado.");
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

      setEgresoPendiente({
        fecha: formatFechaInput(datos.fecha),
        proveedor: `CUIT ${datos.cuit}`,
        sociedad: "",
        sedeId: sedeDefault?.id || "",
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

  async function confirmarEgresoImportado(e) {
    e.preventDefault();

    if (!egresoPendiente.concepto.trim()) {
      alert("Debés cargar el concepto antes de guardar el egreso.");
      return;
    }

    if (!egresoPendiente.proveedor.trim()) {
      alert("Debés cargar el proveedor antes de guardar el egreso.");
      return;
    }

    setSaving(true);

    try {
      await createEgreso(egresoPendiente);
      await loadData();
      setEgresoPendiente(null);
      setModal(null);
    } catch (error) {
      console.error("Error guardando factura importada:", error);
      alert(error.message || "No se pudo guardar el egreso importado.");
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
          placeholder="Buscar por proveedor, sociedad, sede, concepto o categoría..."
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
            {loading && (
              <tr>
                <td colSpan="9">Cargando egresos...</td>
              </tr>
            )}

            {!loading &&
              egresosFiltrados.map((item) => (
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
                      {item.datosFiscales?.qrUrl && (
                        <button
                          title="Ver comprobante en AFIP"
                          onClick={() => verAfip(item.datosFiscales.qrUrl)}
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}

                      {item.estado === "Pendiente" && (
                        <button title="Marcar como pagado" onClick={() => marcarPagado(item.id)}>
                          ✓
                        </button>
                      )}

                      <button title="Eliminar egreso" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && egresosFiltrados.length === 0 && (
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

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Guardando..." : "Guardar egreso"}
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
                type="date"
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
                value={egresoPendiente.sedeId}
                onChange={(e) =>
                  setEgresoPendiente({ ...egresoPendiente, sedeId: e.target.value })
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
                    importe: e.target.value,
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