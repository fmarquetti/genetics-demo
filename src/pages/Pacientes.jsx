import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, CheckCircle } from "lucide-react";
import Modal from "../components/Modal";

const initialPacientes = [
    {
        id: 1,
        fecha: "31/05/2025",
        paciente: "Laura Fernández",
        dni: "32.456.789",
        obraSocial: "OSDE",
        sede: "Sede Centro",
        estudio: "Hemograma completo",
        prioridad: "Normal",
        estado: "Resultado emitido",
        observaciones: "Resultado enviado al paciente por email.",
    },
    {
        id: 2,
        fecha: "31/05/2025",
        paciente: "Carlos Medina",
        dni: "28.951.224",
        obraSocial: "Swiss Medical",
        sede: "Sede Norte",
        estudio: "Perfil tiroideo",
        prioridad: "Normal",
        estado: "En proceso",
        observaciones: "Muestra derivada al área de endocrinología.",
    },
    {
        id: 3,
        fecha: "30/05/2025",
        paciente: "Sofía Rivas",
        dni: "39.842.117",
        obraSocial: "Particular",
        sede: "Sede Sur",
        estudio: "Glucemia / Insulinemia",
        prioridad: "Urgente",
        estado: "Muestra recibida",
        observaciones: "Paciente en ayunas. Pendiente procesamiento.",
    },
];

function filterBySede(items, selectedSede) {
    if (!selectedSede || selectedSede === "Todas las sedes") return items;
    return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

export default function Pacientes({ selectedSede }) {
    const [pacientes, setPacientes] = useState(initialPacientes);
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");
    const [sortField, setSortField] = useState("fecha");
    const [sortDirection, setSortDirection] = useState("desc");
    const [modal, setModal] = useState(null);
    const [selectedPaciente, setSelectedPaciente] = useState(null);

    const [form, setForm] = useState({
        fecha: "",
        paciente: "",
        dni: "",
        obraSocial: "",
        sede: "Sede Centro",
        estudio: "",
        prioridad: "Normal",
        estado: "Muestra pendiente",
        observaciones: "",
    });

    const pacientesPorSede = filterBySede(pacientes, selectedSede);

    const pacientesFiltrados = useMemo(() => {
        const prioridadOrden = {
            Urgente: 1,
            Normal: 2,
        };

        const estadoOrden = {
            "Muestra pendiente": 1,
            "Muestra recibida": 2,
            "En proceso": 3,
            "Resultado emitido": 4,
        };

        const filtered = pacientesPorSede.filter((item) => {
            const matchSearch =
                item.paciente.toLowerCase().includes(search.toLowerCase()) ||
                item.dni.toLowerCase().includes(search.toLowerCase()) ||
                item.estudio.toLowerCase().includes(search.toLowerCase()) ||
                item.obraSocial.toLowerCase().includes(search.toLowerCase());

            const matchEstado =
                estadoFiltro === "Todos" || item.estado === estadoFiltro;

            return matchSearch && matchEstado;
        });

        return [...filtered].sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (sortField === "prioridad") {
                valueA = prioridadOrden[a.prioridad] || 99;
                valueB = prioridadOrden[b.prioridad] || 99;
            }

            if (sortField === "estado") {
                valueA = estadoOrden[a.estado] || 99;
                valueB = estadoOrden[b.estado] || 99;
            }

            if (sortField === "fecha") {
                valueA = new Date(a.fecha.split("/").reverse().join("-"));
                valueB = new Date(b.fecha.split("/").reverse().join("-"));
            }

            if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
            if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [pacientesPorSede, search, estadoFiltro, sortField, sortDirection]);

    const totalOrdenes = pacientesPorSede.length;
    const enProceso = pacientesPorSede.filter((p) => p.estado === "En proceso").length;
    const emitidos = pacientesPorSede.filter((p) => p.estado === "Resultado emitido").length;
    const urgentes = pacientesPorSede.filter((p) => p.prioridad === "Urgente").length;

    function handleCreate(e) {
        e.preventDefault();

        setPacientes((prev) => [{ id: Date.now(), ...form }, ...prev]);
        setModal(null);
    }

    function handleDelete(id) {
        setPacientes((prev) => prev.filter((item) => item.id !== id));
    }

    function avanzarEstado(id) {
        const flujo = {
            "Muestra pendiente": "Muestra recibida",
            "Muestra recibida": "En proceso",
            "En proceso": "Resultado emitido",
            "Resultado emitido": "Resultado emitido",
        };

        setPacientes((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, estado: flujo[item.estado] } : item
            )
        );
    }

    function abrirDetalle(paciente) {
        setSelectedPaciente(paciente);
        setModal("detalle");
    }

    function handleSort(field) {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    }

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h2>Pacientes y estudios</h2>
                    <p>Gestión de órdenes, muestras, estudios y emisión de resultados.</p>
                </div>

                <button className="primary-button" onClick={() => setModal("nuevo")}>
                    <Plus size={16} /> Nueva orden
                </button>
            </div>

            <div className="stats-grid small">
                <div className="stat-card"><div><span>Órdenes del período</span><strong>{totalOrdenes}</strong><small>Estudios registrados</small></div></div>
                <div className="stat-card"><div><span>En proceso</span><strong>{enProceso}</strong><small>Actualmente en laboratorio</small></div></div>
                <div className="stat-card"><div><span>Resultados emitidos</span><strong>{emitidos}</strong><small>Disponibles para entrega</small></div></div>
                <div className="stat-card"><div><span>Urgentes</span><strong>{urgentes}</strong><small>Prioridad alta</small></div></div>
            </div>

            <div className="filters-bar">
                <input
                    placeholder="Buscar por paciente, DNI, estudio u obra social..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                    <option>Todos</option>
                    <option>Muestra pendiente</option>
                    <option>Muestra recibida</option>
                    <option>En proceso</option>
                    <option>Resultado emitido</option>
                </select>
            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>
                                <button className="th-sort" onClick={() => handleSort("fecha")}>
                                    Fecha {sortField === "fecha" && (sortDirection === "asc" ? "↑" : "↓")}
                                </button>
                            </th>

                            <th>Paciente</th>
                            <th>DNI</th>
                            <th>Obra social</th>

                            <th>
                                <button className="th-sort" onClick={() => handleSort("sede")}>
                                    Sede {sortField === "sede" && (sortDirection === "asc" ? "↑" : "↓")}
                                </button>
                            </th>

                            <th>Estudio</th>

                            <th>
                                <button className="th-sort" onClick={() => handleSort("prioridad")}>
                                    Prioridad {sortField === "prioridad" && (sortDirection === "asc" ? "↑" : "↓")}
                                </button>
                            </th>

                            <th>
                                <button className="th-sort" onClick={() => handleSort("estado")}>
                                    Estado {sortField === "estado" && (sortDirection === "asc" ? "↑" : "↓")}
                                </button>
                            </th>

                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {pacientesFiltrados.map((item) => (
                            <tr key={item.id}>
                                <td>{item.fecha}</td>
                                <td>{item.paciente}</td>
                                <td>{item.dni}</td>
                                <td>{item.obraSocial}</td>
                                <td>{item.sede}</td>
                                <td>{item.estudio}</td>
                                <td>
                                    <span className={`status-badge ${item.prioridad.toLowerCase()}`}>
                                        {item.prioridad}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${item.estado.toLowerCase().replaceAll(" ", "-")}`}>
                                        {item.estado}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button onClick={() => abrirDetalle(item)}><Eye size={16} /></button>
                                        {item.estado !== "Resultado emitido" && (
                                            <button onClick={() => avanzarEstado(item.id)}><CheckCircle size={16} /></button>
                                        )}
                                        <button onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {pacientesFiltrados.length === 0 && (
                            <tr><td colSpan="9">No se encontraron órdenes.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modal === "nuevo" && (
                <Modal title="Nueva orden de estudio" onClose={() => setModal(null)}>
                    <form className="form-grid" onSubmit={handleCreate}>
                        <label>Fecha<input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></label>
                        <label>Paciente<input required value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} /></label>
                        <label>DNI<input required value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} /></label>
                        <label>Obra social / Prepaga<input required value={form.obraSocial} onChange={(e) => setForm({ ...form, obraSocial: e.target.value })} /></label>

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
                            Prioridad
                            <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                                <option>Normal</option>
                                <option>Urgente</option>
                            </select>
                        </label>

                        <label className="full">Estudio solicitado<input required value={form.estudio} onChange={(e) => setForm({ ...form, estudio: e.target.value })} /></label>
                        <label className="full">Observaciones<input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></label>

                        <div className="modal-actions">
                            <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancelar</button>
                            <button type="submit" className="primary-button">Guardar orden</button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === "detalle" && selectedPaciente && (
                <Modal title={`Detalle de ${selectedPaciente.paciente}`} onClose={() => setModal(null)}>
                    <div className="detail-grid">
                        <div><span>DNI</span><strong>{selectedPaciente.dni}</strong></div>
                        <div><span>Obra social</span><strong>{selectedPaciente.obraSocial}</strong></div>
                        <div><span>Sede</span><strong>{selectedPaciente.sede}</strong></div>
                        <div><span>Estudio</span><strong>{selectedPaciente.estudio}</strong></div>
                        <div><span>Prioridad</span><strong>{selectedPaciente.prioridad}</strong></div>
                        <div><span>Estado</span><strong>{selectedPaciente.estado}</strong></div>
                        <div className="full"><span>Observaciones</span><strong>{selectedPaciente.observaciones || "Sin observaciones"}</strong></div>
                    </div>
                </Modal>
            )}
        </section>
    );
}