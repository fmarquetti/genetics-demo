import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Eye, CheckCircle, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsQR from "jsqr";
import Modal from "../components/Modal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const initialDocumentos = [
  {
    id: 1,
    fecha: "31/05/2025",
    tipo: "Factura",
    descripcion: "Factura OSDE mayo 2025",
    asociadoA: "OSDE",
    sede: "Sede Centro",
    archivo: "factura_osde_mayo_2025.pdf",
    estado: "Validado",
  },
  {
    id: 2,
    fecha: "30/05/2025",
    tipo: "Comprobante",
    descripcion: "Pago proveedor reactivos",
    asociadoA: "Laboratorios BACON",
    sede: "Sede Norte",
    archivo: "comprobante_bacon_30052025.pdf",
    estado: "Pendiente revisión",
  },
  {
    id: 3,
    fecha: "29/05/2025",
    tipo: "Extracto bancario",
    descripcion: "Extracto Banco Galicia",
    asociadoA: "Banco Galicia",
    sede: "Todas",
    archivo: "extracto_galicia_mayo.csv",
    estado: "Conciliado",
  },
];

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

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

function formatImporte(value) {
  if (value === undefined || value === null) return "-";

  return Number(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export default function Documentos({ selectedSede }) {
  const facturaInputRef = useRef(null);

  const [documentos, setDocumentos] = useState(initialDocumentos);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [importandoFactura, setImportandoFactura] = useState(false);

  const [form, setForm] = useState({
    fecha: "",
    tipo: "Factura",
    descripcion: "",
    asociadoA: "",
    sede: "Sede Centro",
    archivo: "",
    estado: "Pendiente revisión",
  });

  const documentosPorSede = filterBySede(documentos, selectedSede);

  const documentosFiltrados = useMemo(() => {
    return documentosPorSede.filter((item) => {
      const matchSearch =
        item.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        item.asociadoA.toLowerCase().includes(search.toLowerCase()) ||
        item.archivo.toLowerCase().includes(search.toLowerCase());

      const matchTipo = tipoFiltro === "Todos" || item.tipo === tipoFiltro;

      return matchSearch && matchTipo;
    });
  }, [documentosPorSede, search, tipoFiltro]);

  const total = documentosPorSede.length;
  const pendientes = documentosPorSede.filter((d) => d.estado === "Pendiente revisión").length;
  const validados = documentosPorSede.filter((d) => d.estado === "Validado").length;
  const conciliados = documentosPorSede.filter((d) => d.estado === "Conciliado").length;

  function handleCreate(e) {
    e.preventDefault();

    setDocumentos((prev) => [
      {
        id: Date.now(),
        ...form,
        archivo: form.archivo || "archivo_simulado.pdf",
      },
      ...prev,
    ]);

    setModal(null);
  }

  function handleDelete(id) {
    setDocumentos((prev) => prev.filter((item) => item.id !== id));
  }

  function validarDocumento(id) {
    setDocumentos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: "Validado" } : item))
    );
  }

  function abrirDetalle(documento) {
    setSelectedDocumento(documento);
    setModal("detalle");
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

      if (qr?.data) {
        return qr.data;
      }
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

      const nuevoDocumento = {
        id: Date.now(),
        fecha: formatFecha(datos.fecha),
        tipo: "Factura",
        descripcion: `${tipoComprobante} ${puntoVenta}-${numeroComprobante} - ${formatImporte(datos.importe)}`,
        asociadoA: `CUIT ${datos.cuit}`,
        sede: selectedSede && selectedSede !== "Todas las sedes" ? selectedSede : "Todas",
        archivo: file.name,
        estado: "Pendiente revisión",
        datosFiscales: {
          ...datos,
          qrUrl: qrText,
          tipoComprobante,
          puntoVenta,
          numeroComprobante,
        },
      };

      setDocumentos((prev) => [nuevoDocumento, ...prev]);
    } catch (error) {
      alert(error.message || "No se pudo importar la factura.");
    } finally {
      setImportandoFactura(false);
      e.target.value = "";
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Documentos</h2>
          <p>Facturas, comprobantes, extractos, resultados y archivos asociados.</p>
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
            <Plus size={16} /> Subir documento
          </button>
        </div>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>Documentos</span>
            <strong>{total}</strong>
            <small>Total cargado</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Pendientes</span>
            <strong>{pendientes}</strong>
            <small>Requieren revisión</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Validados</span>
            <strong>{validados}</strong>
            <small>Listos para auditoría</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Conciliados</span>
            <strong>{conciliados}</strong>
            <small>Asociados a movimientos</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por descripción, entidad o archivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Factura</option>
          <option>Comprobante</option>
          <option>Extracto bancario</option>
          <option>Resultado clínico</option>
          <option>Contrato</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Asociado a</th>
              <th>Sede</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {documentosFiltrados.map((item) => (
              <tr key={item.id}>
                <td>{item.fecha}</td>
                <td>{item.tipo}</td>
                <td>{item.descripcion}</td>
                <td>{item.asociadoA}</td>
                <td>{item.sede}</td>
                <td>{item.archivo}</td>
                <td>
                  <span className={`status-badge ${item.estado.toLowerCase().replaceAll(" ", "-")}`}>
                    {item.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => abrirDetalle(item)}>
                      <Eye size={16} />
                    </button>

                    {item.estado === "Pendiente revisión" && (
                      <button onClick={() => validarDocumento(item.id)}>
                        <CheckCircle size={16} />
                      </button>
                    )}

                    <button onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {documentosFiltrados.length === 0 && (
              <tr>
                <td colSpan="8">No se encontraron documentos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "nuevo" && (
        <Modal title="Subir documento" onClose={() => setModal(null)}>
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
              Tipo
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option>Factura</option>
                <option>Comprobante</option>
                <option>Extracto bancario</option>
                <option>Resultado clínico</option>
                <option>Contrato</option>
              </select>
            </label>

            <label>
              Asociado a
              <input
                required
                value={form.asociadoA}
                onChange={(e) => setForm({ ...form, asociadoA: e.target.value })}
              />
            </label>

            <label>
              Sede
              <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })}>
                <option>Todas</option>
                <option>Sede Centro</option>
                <option>Sede Norte</option>
                <option>Sede Sur</option>
                <option>Sede Oeste</option>
                <option>Sede Pilar</option>
              </select>
            </label>

            <label className="full">
              Descripción
              <input
                required
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </label>

            <label className="full">
              Archivo simulado
              <input
                value={form.archivo}
                onChange={(e) => setForm({ ...form, archivo: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                Guardar documento
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "detalle" && selectedDocumento && (
        <Modal title="Detalle del documento" onClose={() => setModal(null)}>
          <div className="detail-grid">
            <div>
              <span>Tipo</span>
              <strong>{selectedDocumento.tipo}</strong>
            </div>

            <div>
              <span>Fecha</span>
              <strong>{selectedDocumento.fecha}</strong>
            </div>

            <div>
              <span>Asociado a</span>
              <strong>{selectedDocumento.asociadoA}</strong>
            </div>

            <div>
              <span>Sede</span>
              <strong>{selectedDocumento.sede}</strong>
            </div>

            <div className="full">
              <span>Archivo</span>
              <strong>{selectedDocumento.archivo}</strong>
            </div>

            <div className="full">
              <span>Descripción</span>
              <strong>{selectedDocumento.descripcion}</strong>
            </div>

            {selectedDocumento.datosFiscales && (
              <>
                <div>
                  <span>CUIT emisor</span>
                  <strong>{selectedDocumento.datosFiscales.cuit}</strong>
                </div>

                <div>
                  <span>Tipo comprobante</span>
                  <strong>{selectedDocumento.datosFiscales.tipoComprobante}</strong>
                </div>

                <div>
                  <span>Punto de venta</span>
                  <strong>{selectedDocumento.datosFiscales.puntoVenta}</strong>
                </div>

                <div>
                  <span>N° comprobante</span>
                  <strong>{selectedDocumento.datosFiscales.numeroComprobante}</strong>
                </div>

                <div>
                  <span>Importe</span>
                  <strong>{formatImporte(selectedDocumento.datosFiscales.importe)}</strong>
                </div>

                <div>
                  <span>Moneda</span>
                  <strong>{selectedDocumento.datosFiscales.moneda || "-"}</strong>
                </div>

                <div>
                  <span>Cotización</span>
                  <strong>{selectedDocumento.datosFiscales.ctz || "-"}</strong>
                </div>

                <div>
                  <span>CAE / CAEA</span>
                  <strong>{selectedDocumento.datosFiscales.codAut || "-"}</strong>
                </div>

                <div>
                  <span>Documento receptor</span>
                  <strong>{selectedDocumento.datosFiscales.nroDocRec || "-"}</strong>
                </div>

                <div className="full">
                  <span>QR fiscal</span>
                  <strong>{selectedDocumento.datosFiscales.qrUrl}</strong>
                </div>
              </>
            )}

            <div className="full document-preview">Vista previa simulada del documento</div>
          </div>
        </Modal>
      )}
    </section>
  );
}