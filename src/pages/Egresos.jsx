import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

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

  return items.filter((item) => {
    return item.sede === selectedSede || item.sede === "Todas";
  });
}

const formatMoney = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

export default function Egresos({ selectedSede }) {
    const [egresos, setEgresos] = useState(initialEgresos);
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");
    const [modal, setModal] = useState(null);
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
            prev.map((item) =>
                item.id === id ? { ...item, estado: "Pagado" } : item
            )
        );
    }

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h2>Egresos</h2>
                    <p>Control de proveedores, gastos operativos, reactivos e insumos.</p>
                </div>

                <button className="primary-button" onClick={() => setModal("nuevo")}>
                    <Plus size={16} /> Nuevo egreso
                </button>
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
                            <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })}>
                                <option>Sede Centro</option>
                                <option>Sede Norte</option>
                                <option>Sede Sur</option>
                                <option>Sede Oeste</option>
                                <option>Sede Pilar</option>
                            </select>
                        </label>

                        <label>
                            Categoría
                            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
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
        </section>
    );
}