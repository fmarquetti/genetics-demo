import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, Power } from "lucide-react";
import Modal from "../components/Modal";

const initialSedes = [
  {
    id: 1,
    sede: "Sede Centro",
    sociedad: "Central Salud S.A.",
    cuit: "30-71234567-8",
    responsable: "Dr. Martín López",
    direccion: "Av. San Martín 1250",
    usuarios: 12,
    estudiosMes: 1840,
    estado: "Activa",
  },
  {
    id: 2,
    sede: "Sede Norte",
    sociedad: "Centro Médico S.A.",
    cuit: "30-70987654-2",
    responsable: "Dra. Paula Ruiz",
    direccion: "Belgrano 840",
    usuarios: 8,
    estudiosMes: 960,
    estado: "Activa",
  },
  {
    id: 3,
    sede: "Sede Pilar",
    sociedad: "Genetics Pilar S.R.L.",
    cuit: "30-71888999-1",
    responsable: "Lic. Ana Torres",
    direccion: "Ruta 8 Km 52",
    usuarios: 5,
    estudiosMes: 420,
    estado: "Activa",
  },
];

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;

  return items.filter((item) => item.sede === selectedSede);
}

export default function Sedes({ selectedSede }) {
  const [sedes, setSedes] = useState(initialSedes);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [selectedSedeDetalle, setSelectedSedeDetalle] = useState(null);

  const sedesPorFiltro = filterBySede(sedes, selectedSede);

  const sedesFiltradas = useMemo(() => {
    return sedesPorFiltro.filter((item) => {
      const matchSearch =
        item.sede.toLowerCase().includes(search.toLowerCase()) ||
        item.sociedad.toLowerCase().includes(search.toLowerCase()) ||
        item.responsable.toLowerCase().includes(search.toLowerCase());

      const matchEstado =
        estadoFiltro === "Todos" || item.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [sedesPorFiltro, search, estadoFiltro]);

  const activas = sedesPorFiltro.filter((s) => s.estado === "Activa").length;
  const inactivas = sedesPorFiltro.filter((s) => s.estado === "Inactiva").length;
  const totalUsuarios = sedesPorFiltro.reduce((acc, s) => acc + Number(s.usuarios), 0);
  const totalEstudios = sedesPorFiltro.reduce((acc, s) => acc + Number(s.estudiosMes), 0);

  function toggleEstado(id) {
    setSedes((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, estado: item.estado === "Activa" ? "Inactiva" : "Activa" }
          : item
      )
    );
  }

  function handleDelete(id) {
    setSedes((prev) => prev.filter((item) => item.id !== id));
  }

  function abrirDetalle(sede) {
    setSelectedSedeDetalle(sede);
    setModal("detalle");
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Sociedades / Sedes</h2>
          <p>Administración de sociedades, sucursales, responsables y operación multisede.</p>
        </div>

        <button className="primary-button">
          <Plus size={16} /> Nueva sede
        </button>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>Sedes activas</span>
            <strong>{activas}</strong>
            <small>Operativas actualmente</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Sedes inactivas</span>
            <strong>{inactivas}</strong>
            <small>Sin operación activa</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Usuarios asignados</span>
            <strong>{totalUsuarios}</strong>
            <small>Total operativo</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Estudios del mes</span>
            <strong>{totalEstudios.toLocaleString("es-AR")}</strong>
            <small>Producción acumulada</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por sede, sociedad o responsable..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Activa</option>
          <option>Inactiva</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Sede</th>
              <th>Sociedad</th>
              <th>CUIT</th>
              <th>Responsable</th>
              <th>Usuarios</th>
              <th>Estudios mes</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {sedesFiltradas.map((item) => (
              <tr key={item.id}>
                <td>{item.sede}</td>
                <td>{item.sociedad}</td>
                <td>{item.cuit}</td>
                <td>{item.responsable}</td>
                <td>{item.usuarios}</td>
                <td>{item.estudiosMes.toLocaleString("es-AR")}</td>
                <td>
                  <span className={`status-badge ${item.estado.toLowerCase()}`}>
                    {item.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => abrirDetalle(item)}>
                      <Eye size={16} />
                    </button>

                    <button onClick={() => toggleEstado(item.id)}>
                      <Power size={16} />
                    </button>

                    <button onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {sedesFiltradas.length === 0 && (
              <tr>
                <td colSpan="8">No se encontraron sedes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "detalle" && selectedSedeDetalle && (
        <Modal title={`Detalle de ${selectedSedeDetalle.sede}`} onClose={() => setModal(null)}>
          <div className="detail-grid">
            <div>
              <span>Sociedad</span>
              <strong>{selectedSedeDetalle.sociedad}</strong>
            </div>

            <div>
              <span>CUIT</span>
              <strong>{selectedSedeDetalle.cuit}</strong>
            </div>

            <div>
              <span>Responsable</span>
              <strong>{selectedSedeDetalle.responsable}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>{selectedSedeDetalle.estado}</strong>
            </div>

            <div className="full">
              <span>Dirección</span>
              <strong>{selectedSedeDetalle.direccion}</strong>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}