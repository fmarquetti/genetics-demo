import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

const initialIngresos = [
    {
        id: 1,
        fecha: "31/05/2025",
        concepto: "Pago OSDE",
        sociedad: "Central Salud S.A.",
        sede: "Sede Centro",
        origen: "Obra Social",
        importe: 1250000,
        cobro: "Transferencia",
        estado: "Cobrado",
    },
    {
        id: 2,
        fecha: "30/05/2025",
        concepto: "Pago Swiss Medical",
        sociedad: "Centro Médico S.A.",
        sede: "Sede Norte",
        origen: "Prepaga",
        importe: 960000,
        cobro: "Transferencia",
        estado: "Cobrado",
    },
    {
        id: 3,
        fecha: "30/05/2025",
        concepto: "Pacientes particulares",
        sociedad: "Central Salud S.A.",
        sede: "Sede Centro",
        origen: "Particular",
        importe: 220000,
        cobro: "Efectivo",
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

export default function Ingresos({ selectedSede }) {
    const [ingresos, setIngresos] = useState(initialIngresos);
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");
    const [modal, setModal] = useState(null);
    const ingresosPorSede = filterBySede(ingresos, selectedSede);

    const [form, setForm] = useState({
        fecha: "",
        concepto: "",
        sociedad: "",
        sede: "Sede Centro",
        origen: "Obra Social",
        importe: "",
        cobro: "Transferencia",
        estado: "Pendiente",
    });

    const ingresosFiltrados = useMemo(() => {
        return ingresosPorSede.filter((item) => {
            const matchSearch =
                item.concepto.toLowerCase().includes(search.toLowerCase()) ||
                item.sociedad.toLowerCase().includes(search.toLowerCase()) ||
                item.origen.toLowerCase().includes(search.toLowerCase());

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

    function handleCreate(e) {
        e.preventDefault();

        setIngresos((prev) => [
            {
                id: Date.now(),
                ...form,
                importe: Number(form.importe),
            },
            ...prev,
        ]);

        setForm({
            fecha: "",
            concepto: "",
            sociedad: "",
            sede: "Sede Centro",
            origen: "Obra Social",
            importe: "",
            cobro: "Transferencia",
            estado: "Pendiente",
        });

        setModal(null);
    }

    function handleDelete(id) {
        setIngresos((prev) => prev.filter((item) => item.id !== id));
    }

    function marcarCobrado(id) {
        setIngresos((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, estado: "Cobrado" } : item
            )
        );
    }

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h2>Ingresos</h2>
                    <p>Registro de cobros, obras sociales, prepagas y pagos particulares.</p>
                </div>

                <button className="primary-button" onClick={() => setModal("nuevo")}>
                    <Plus size={16} /> Nuevo ingreso
                </button>
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
                    placeholder="Buscar por concepto, sociedad u origen..."
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
                        {ingresosFiltrados.map((item) => (
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
                                        {item.estado === "Pendiente" && (
                                            <button onClick={() => marcarCobrado(item.id)}>✓</button>
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
                            <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })}>
                                <option>Sede Centro</option>
                                <option>Sede Norte</option>
                                <option>Sede Sur</option>
                                <option>Sede Oeste</option>
                                <option>Sede Pilar</option>
                            </select>
                        </label>

                        <label>
                            Origen
                            <select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>
                                <option>Obra Social</option>
                                <option>Prepaga</option>
                                <option>Particular</option>
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
                            <select value={form.cobro} onChange={(e) => setForm({ ...form, cobro: e.target.value })}>
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
                            <button type="submit" className="primary-button">
                                Guardar ingreso
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </section>
    );
}