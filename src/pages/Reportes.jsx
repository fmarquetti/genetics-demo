import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, FileDown, RefreshCw } from "lucide-react";
import Modal from "../components/Modal";

const initialReportes = [
  {
    id: 1,
    nombre: "Resultado mensual por sede",
    modulo: "Finanzas",
    sede: "Todas",
    periodo: "Mayo 2025",
    generadoPor: "Juan Pérez",
    fecha: "31/05/2025",
    formato: "PDF",
    estado: "Disponible",
  },
  {
    id: 2,
    nombre: "Estudios realizados por obra social",
    modulo: "Pacientes y estudios",
    sede: "Sede Centro",
    periodo: "Mayo 2025",
    generadoPor: "María Gómez",
    fecha: "31/05/2025",
    formato: "Excel",
    estado: "Disponible",
  },
  {
    id: 3,
    nombre: "Deuda vencida por entidad",
    modulo: "Cuentas corrientes",
    sede: "Sede Norte",
    periodo: "Mayo 2025",
    generadoPor: "Sistema",
    fecha: "30/05/2025",
    formato: "PDF",
    estado: "Pendiente",
  },
];

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

export default function Reportes({ selectedSede }) {
  const [reportes, setReportes] = useState(initialReportes);
  const [search, setSearch] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [selectedReporte, setSelectedReporte] = useState(null);

  const [form, setForm] = useState({
    nombre: "Resultado mensual por sede",
    modulo: "Finanzas",
    sede: "Todas",
    periodo: "Junio 2025",
    generadoPor: "Juan Pérez",
    fecha: "2025-06-01",
    formato: "PDF",
    estado: "Disponible",
  });

  const reportesPorSede = filterBySede(reportes, selectedSede);

  const reportesFiltrados = useMemo(() => {
    return reportesPorSede.filter((item) => {
      const matchSearch =
        item.nombre.toLowerCase().includes(search.toLowerCase()) ||
        item.sede.toLowerCase().includes(search.toLowerCase()) ||
        item.periodo.toLowerCase().includes(search.toLowerCase());

      const matchModulo = moduloFiltro === "Todos" || item.modulo === moduloFiltro;

      return matchSearch && matchModulo;
    });
  }, [reportesPorSede, search, moduloFiltro]);

  const disponibles = reportesPorSede.filter((r) => r.estado === "Disponible").length;
  const pendientes = reportesPorSede.filter((r) => r.estado === "Pendiente").length;
  const financieros = reportesPorSede.filter((r) => r.modulo === "Finanzas").length;
  const clinicos = reportesPorSede.filter((r) => r.modulo === "Pacientes y estudios").length;

  function handleCreate(e) {
    e.preventDefault();
    setReportes((prev) => [{ id: Date.now(), ...form }, ...prev]);
    setModal(null);
  }

  function handleDelete(id) {
    setReportes((prev) => prev.filter((item) => item.id !== id));
  }

  function regenerarReporte(id) {
    setReportes((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, estado: "Disponible", fecha: "01/06/2025", generadoPor: "Sistema" }
          : item
      )
    );
  }

  function abrirDetalle(reporte) {
    setSelectedReporte(reporte);
    setModal("detalle");
  }

  function descargarReporte(reporte) {
    setSelectedReporte(reporte);
    setModal("descarga");
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Reportes</h2>
          <p>Generación de informes financieros, operativos, clínicos y administrativos.</p>
        </div>

        <button className="primary-button" onClick={() => setModal("nuevo")}>
          <Plus size={16} /> Generar reporte
        </button>
      </div>

      <div className="stats-grid small">
        <div className="stat-card"><div><span>Reportes disponibles</span><strong>{disponibles}</strong><small>Listos para descargar</small></div></div>
        <div className="stat-card"><div><span>Pendientes</span><strong>{pendientes}</strong><small>Requieren generación</small></div></div>
        <div className="stat-card"><div><span>Financieros</span><strong>{financieros}</strong><small>Ingresos, egresos y resultados</small></div></div>
        <div className="stat-card"><div><span>Clínicos / operativos</span><strong>{clinicos}</strong><small>Estudios y producción</small></div></div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por reporte, sede o período..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={moduloFiltro} onChange={(e) => setModuloFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Finanzas</option>
          <option>Pacientes y estudios</option>
          <option>Cuentas corrientes</option>
          <option>Bancos</option>
          <option>Documentos</option>
          <option>Usuarios</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Reporte</th>
              <th>Módulo</th>
              <th>Sede</th>
              <th>Período</th>
              <th>Generado por</th>
              <th>Fecha</th>
              <th>Formato</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {reportesFiltrados.map((item) => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                <td>{item.modulo}</td>
                <td>{item.sede}</td>
                <td>{item.periodo}</td>
                <td>{item.generadoPor}</td>
                <td>{item.fecha}</td>
                <td>{item.formato}</td>
                <td>
                  <span className={`status-badge ${item.estado.toLowerCase()}`}>
                    {item.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => abrirDetalle(item)}><Eye size={16} /></button>
                    <button onClick={() => descargarReporte(item)}><FileDown size={16} /></button>
                    {item.estado === "Pendiente" && (
                      <button onClick={() => regenerarReporte(item.id)}><RefreshCw size={16} /></button>
                    )}
                    <button onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}

            {reportesFiltrados.length === 0 && (
              <tr><td colSpan="9">No se encontraron reportes.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "nuevo" && (
        <Modal title="Generar nuevo reporte" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Tipo de reporte
              <select value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}>
                <option>Resultado mensual por sede</option>
                <option>Ingresos y egresos por sociedad</option>
                <option>Deuda vencida por entidad</option>
                <option>Estudios realizados por obra social</option>
                <option>Producción por sede</option>
                <option>Usuarios y permisos</option>
              </select>
            </label>

            <label>
              Módulo
              <select value={form.modulo} onChange={(e) => setForm({ ...form, modulo: e.target.value })}>
                <option>Finanzas</option>
                <option>Pacientes y estudios</option>
                <option>Cuentas corrientes</option>
                <option>Bancos</option>
                <option>Documentos</option>
                <option>Usuarios</option>
              </select>
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

            <label>Período<input required value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} /></label>

            <label>
              Formato
              <select value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value })}>
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </label>

            <label>Fecha<input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="primary-button">Generar reporte</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "detalle" && selectedReporte && (
        <Modal title="Detalle del reporte" onClose={() => setModal(null)}>
          <div className="detail-grid">
            <div><span>Reporte</span><strong>{selectedReporte.nombre}</strong></div>
            <div><span>Módulo</span><strong>{selectedReporte.modulo}</strong></div>
            <div><span>Sede</span><strong>{selectedReporte.sede}</strong></div>
            <div><span>Período</span><strong>{selectedReporte.periodo}</strong></div>
            <div><span>Formato</span><strong>{selectedReporte.formato}</strong></div>
            <div><span>Estado</span><strong>{selectedReporte.estado}</strong></div>
            <div className="full document-preview">Vista previa simulada del reporte</div>
          </div>
        </Modal>
      )}

      {modal === "descarga" && selectedReporte && (
        <Modal title="Descarga simulada" onClose={() => setModal(null)}>
          <div className="detail-grid">
            <div className="full">
              <span>Archivo generado</span>
              <strong>
                {selectedReporte.nombre.toLowerCase().replaceAll(" ", "_").replaceAll("/", "-")}.
                {selectedReporte.formato.toLowerCase()}
              </strong>
            </div>
            <div className="full document-preview">
              La descarga real se conectará luego con Supabase Storage o generación dinámica desde backend.
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}