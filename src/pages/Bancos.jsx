import { useMemo, useState } from "react";
import { Upload, GitCompare, Plus, Trash2, CheckCircle } from "lucide-react";
import Modal from "../components/Modal";

const initialMovimientos = [
  {
    id: 1,
    fecha: "31/05/2025",
    sede: "Sede Centro",
    cuenta: "Banco Galicia - CC $",
    tipo: "Ingreso",
    descripcion: "Transferencia OSDE",
    importe: 1250000,
    origen: "Extracto importado",
    estado: "Conciliado",
  },
  {
    id: 2,
    fecha: "30/05/2025",
    sede: "Sede Norte",
    cuenta: "Banco Nación - CA $",
    tipo: "Egreso",
    descripcion: "Pago Droguería del Sur",
    importe: 320000,
    origen: "Carga manual",
    estado: "Pendiente",
  },
  {
    id: 3,
    fecha: "30/05/2025",
    sede: "Todas",
    cuenta: "Mercado Pago",
    tipo: "Ingreso",
    descripcion: "Pagos particulares",
    importe: 220000,
    origen: "Importación CSV",
    estado: "Movimiento sin identificar",
  },
];

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

const formatMoney = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

export default function Bancos({ selectedSede }) {
  const [movimientos, setMovimientos] = useState(initialMovimientos);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    fecha: "",
    sede: "Sede Centro",
    cuenta: "",
    tipo: "Ingreso",
    descripcion: "",
    importe: "",
    origen: "Carga manual",
    estado: "Pendiente",
  });

  const movimientosPorSede = filterBySede(movimientos, selectedSede);

  const movimientosFiltrados = useMemo(() => {
    return movimientosPorSede.filter((mov) => {
      const matchSearch =
        mov.cuenta.toLowerCase().includes(search.toLowerCase()) ||
        mov.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        mov.origen.toLowerCase().includes(search.toLowerCase());

      const matchEstado = estadoFiltro === "Todos" || mov.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [movimientosPorSede, search, estadoFiltro]);

  const totalIngresos = movimientosPorSede
    .filter((m) => m.tipo === "Ingreso")
    .reduce((acc, m) => acc + Number(m.importe), 0);

  const totalEgresos = movimientosPorSede
    .filter((m) => m.tipo === "Egreso")
    .reduce((acc, m) => acc + Number(m.importe), 0);

  const pendientes = movimientosPorSede.filter((m) => m.estado !== "Conciliado").length;

  function handleCreate(e) {
    e.preventDefault();

    setMovimientos((prev) => [
      {
        id: Date.now(),
        ...form,
        importe: Number(form.importe),
      },
      ...prev,
    ]);

    setForm({
      fecha: "",
      sede: "Sede Centro",
      cuenta: "",
      tipo: "Ingreso",
      descripcion: "",
      importe: "",
      origen: "Carga manual",
      estado: "Pendiente",
    });

    setModal(null);
  }

  function handleImportarExtracto() {
    const movimientosImportados = [
      {
        id: Date.now() + 1,
        fecha: "01/06/2025",
        sede: "Sede Centro",
        cuenta: "Banco Galicia - CC $",
        tipo: "Ingreso",
        descripcion: "Transferencia Galeno",
        importe: 780000,
        origen: "Extracto importado",
        estado: "Pendiente",
      },
      {
        id: Date.now() + 2,
        fecha: "01/06/2025",
        sede: "Sede Norte",
        cuenta: "Banco Nación - CA $",
        tipo: "Egreso",
        descripcion: "Débito servicio eléctrico",
        importe: 185000,
        origen: "Extracto importado",
        estado: "Movimiento sin identificar",
      },
    ];

    setMovimientos((prev) => [...movimientosImportados, ...prev]);
  }

  function handleConciliar() {
    setMovimientos((prev) =>
      prev.map((mov) =>
        mov.estado === "Pendiente" ? { ...mov, estado: "Conciliado" } : mov
      )
    );
  }

  function handleConciliarUno(id) {
    setMovimientos((prev) =>
      prev.map((mov) =>
        mov.id === id ? { ...mov, estado: "Conciliado" } : mov
      )
    );
  }

  function handleDelete(id) {
    setMovimientos((prev) => prev.filter((mov) => mov.id !== id));
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Bancos y conciliación</h2>
          <p>Registro de cuentas, carga de extractos y conciliación de movimientos.</p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={handleImportarExtracto}>
            <Upload size={16} /> Importar extracto
          </button>

          <button className="secondary-button" onClick={handleConciliar}>
            <GitCompare size={16} /> Conciliar
          </button>

          <button className="primary-button" onClick={() => setModal("nuevo")}>
            <Plus size={16} /> Nuevo movimiento
          </button>
        </div>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>Ingresos bancarios</span>
            <strong>{formatMoney(totalIngresos)}</strong>
            <small>Movimientos registrados</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Egresos bancarios</span>
            <strong>{formatMoney(totalEgresos)}</strong>
            <small>Pagos y débitos</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Saldo operativo</span>
            <strong>{formatMoney(totalIngresos - totalEgresos)}</strong>
            <small>Simulado</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Pendientes</span>
            <strong>{pendientes}</strong>
            <small>Requieren revisión</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por cuenta, descripción u origen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Conciliado</option>
          <option>Pendiente</option>
          <option>Movimiento sin identificar</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Sede</th>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Importe</th>
              <th>Origen</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {movimientosFiltrados.map((mov) => (
              <tr key={mov.id}>
                <td>{mov.fecha}</td>
                <td>{mov.sede}</td>
                <td>{mov.cuenta}</td>
                <td>{mov.tipo}</td>
                <td>{mov.descripcion}</td>
                <td>{formatMoney(mov.importe)}</td>
                <td>{mov.origen}</td>
                <td>
                  <span className={`status-badge ${mov.estado.toLowerCase().replaceAll(" ", "-")}`}>
                    {mov.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    {mov.estado !== "Conciliado" && (
                      <button onClick={() => handleConciliarUno(mov.id)}>
                        <CheckCircle size={16} />
                      </button>
                    )}

                    <button onClick={() => handleDelete(mov.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan="9">No se encontraron movimientos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "nuevo" && (
        <Modal title="Nuevo movimiento bancario" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Fecha
              <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </label>

            <label>
              Sede
              <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })}>
                <option>Sede Centro</option>
                <option>Sede Norte</option>
                <option>Sede Sur</option>
                <option>Sede Oeste</option>
                <option>Sede Pilar</option>
              </select>
            </label>

            <label>
              Cuenta
              <select required value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value })}>
                <option value="">Seleccionar cuenta</option>
                <option>Banco Galicia - CC $</option>
                <option>Banco Nación - CA $</option>
                <option>Mercado Pago</option>
                <option>Caja diaria</option>
              </select>
            </label>

            <label>
              Tipo
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option>Ingreso</option>
                <option>Egreso</option>
              </select>
            </label>

            <label>
              Importe
              <input type="number" required value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} />
            </label>

            <label className="full">
              Descripción
              <input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Cancelar
              </button>

              <button type="submit" className="primary-button">
                Guardar movimiento
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}