import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, CheckCircle } from "lucide-react";
import Modal from "../components/Modal";

const initialMovimientos = [
    {
        id: 1,
        fecha: "31/05/2025",
        entidad: "OSDE",
        tipoEntidad: "Obra social",
        sede: "Sede Centro",
        concepto: "Facturación mayo 2025",
        tipo: "Debe",
        importe: 1250000,
        vencimiento: "10/06/2025",
        estado: "Pendiente",
    },
    {
        id: 2,
        fecha: "30/05/2025",
        entidad: "Swiss Medical",
        tipoEntidad: "Prepaga",
        sede: "Sede Norte",
        concepto: "Facturación mayo 2025",
        tipo: "Debe",
        importe: 960000,
        vencimiento: "09/06/2025",
        estado: "Pendiente",
    },
    {
        id: 3,
        fecha: "29/05/2025",
        entidad: "Droguería del Sur",
        tipoEntidad: "Proveedor",
        sede: "Sede Centro",
        concepto: "Compra de insumos",
        tipo: "Haber",
        importe: 320000,
        vencimiento: "05/06/2025",
        estado: "Pendiente",
    },
    {
        id: 4,
        fecha: "28/05/2025",
        entidad: "OSDE",
        tipoEntidad: "Obra social",
        sede: "Sede Centro",
        concepto: "Pago parcial factura abril",
        tipo: "Haber",
        importe: 450000,
        vencimiento: "-",
        estado: "Aplicado",
    },
];

function filterBySede(items, selectedSede) {
    if (!selectedSede || selectedSede === "Todas las sedes") return items;

    return items.filter((item) => {
        return item.sede === selectedSede || item.sede === "Todas";
    });
}

const formatMoney = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

export default function CuentasCorrientes({ selectedSede }) {
    const [movimientos, setMovimientos] = useState(initialMovimientos);
    const [search, setSearch] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("Todos");
    const [modal, setModal] = useState(null);
    const [selectedEntidad, setSelectedEntidad] = useState(null);
    const movimientosPorSede = filterBySede(movimientos, selectedSede);

    const [form, setForm] = useState({
        fecha: "",
        entidad: "",
        tipoEntidad: "Obra social",
        sede: "Sede Centro",
        concepto: "",
        tipo: "Debe",
        importe: "",
        vencimiento: "",
        estado: "Pendiente",
    });

    const movimientosFiltrados = useMemo(() => {
        return movimientosPorSede.filter((item) => {
            const matchSearch =
                item.entidad.toLowerCase().includes(search.toLowerCase()) ||
                item.concepto.toLowerCase().includes(search.toLowerCase()) ||
                item.sede.toLowerCase().includes(search.toLowerCase());

            const matchTipo =
                tipoFiltro === "Todos" || item.tipoEntidad === tipoFiltro;

            return matchSearch && matchTipo;
        });
    }, [movimientosPorSede, search, tipoFiltro]);

    const resumenPorEntidad = useMemo(() => {
        const resumen = {};

        movimientosPorSede.forEach((mov) => {
            if (!resumen[mov.entidad]) {
                resumen[mov.entidad] = {
                    entidad: mov.entidad,
                    tipoEntidad: mov.tipoEntidad,
                    sede: mov.sede,
                    debe: 0,
                    haber: 0,
                    pendientes: 0,
                };
            }

            if (mov.tipo === "Debe") resumen[mov.entidad].debe += mov.importe;
            if (mov.tipo === "Haber") resumen[mov.entidad].haber += mov.importe;
            if (mov.estado === "Pendiente") resumen[mov.entidad].pendientes += 1;
        });

        return Object.values(resumen).map((item) => ({
            ...item,
            saldo: item.debe - item.haber,
        }));
    }, [movimientosPorSede]);

    const totalDebe = movimientosPorSede
        .filter((m) => m.tipo === "Debe")
        .reduce((acc, m) => acc + m.importe, 0);

    const totalHaber = movimientosPorSede
        .filter((m) => m.tipo === "Haber")
        .reduce((acc, m) => acc + m.importe, 0);

    const totalPendiente = movimientosPorSede.filter(
        (m) => m.estado === "Pendiente"
    ).length;

    function handleCreate(e) {
        e.preventDefault();

        setMovimientos((prev) => [
            {
                id: Date.now(),
                ...form,
                importe: Number(form.importe),
                vencimiento: form.vencimiento || "-",
            },
            ...prev,
        ]);

        setForm({
            fecha: "",
            entidad: "",
            tipoEntidad: "Obra social",
            sede: "Sede Centro",
            concepto: "",
            tipo: "Debe",
            importe: "",
            vencimiento: "",
            estado: "Pendiente",
        });

        setModal(null);
    }

    function handleDelete(id) {
        setMovimientos((prev) => prev.filter((item) => item.id !== id));
    }

    function marcarAplicado(id) {
        setMovimientos((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, estado: "Aplicado" } : item
            )
        );
    }

    function abrirDetalle(entidad) {
        setSelectedEntidad(entidad);
        setModal("detalle");
    }

    const detalleEntidad = movimientos.filter(
        (item) => item.entidad === selectedEntidad
    );

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h2>Cuentas corrientes</h2>
                    <p>Control de saldos por obra social, prepaga, proveedor o entidad.</p>
                </div>

                <button className="primary-button" onClick={() => setModal("nuevo")}>
                    <Plus size={16} /> Nuevo movimiento
                </button>
            </div>

            <div className="stats-grid small">
                <div className="stat-card">
                    <div>
                        <span>Total facturado / debe</span>
                        <strong>{formatMoney(totalDebe)}</strong>
                        <small>Importes a cobrar o registrar</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <span>Total aplicado / haber</span>
                        <strong>{formatMoney(totalHaber)}</strong>
                        <small>Cobros, pagos o compensaciones</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <span>Saldo neto</span>
                        <strong>{formatMoney(totalDebe - totalHaber)}</strong>
                        <small>Resultado simulado</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <span>Movimientos pendientes</span>
                        <strong>{totalPendiente}</strong>
                        <small>Requieren seguimiento</small>
                    </div>
                </div>
            </div>

            <div className="filters-bar">
                <input
                    placeholder="Buscar por entidad, concepto o sede..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                    <option>Todos</option>
                    <option>Obra social</option>
                    <option>Prepaga</option>
                    <option>Proveedor</option>
                    <option>Particular</option>
                </select>
            </div>

            <div className="panel">
                <h3>Resumen por entidad</h3>

                <div className="table-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Entidad</th>
                                <th>Tipo</th>
                                <th>Sede</th>
                                <th>Debe</th>
                                <th>Haber</th>
                                <th>Saldo</th>
                                <th>Pendientes</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {resumenPorEntidad.map((item) => (
                                <tr key={item.entidad}>
                                    <td>{item.entidad}</td>
                                    <td>{item.tipoEntidad}</td>
                                    <td>{item.sede}</td>
                                    <td>{formatMoney(item.debe)}</td>
                                    <td>{formatMoney(item.haber)}</td>
                                    <td>
                                        <strong>{formatMoney(item.saldo)}</strong>
                                    </td>
                                    <td>{item.pendientes}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button onClick={() => abrirDetalle(item.entidad)}>
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="panel" style={{ marginTop: 18 }}>
                <h3>Movimientos</h3>

                <div className="table-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Entidad</th>
                                <th>Tipo entidad</th>
                                <th>Sede</th>
                                <th>Concepto</th>
                                <th>Movimiento</th>
                                <th>Importe</th>
                                <th>Vencimiento</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {movimientosFiltrados.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.fecha}</td>
                                    <td>{item.entidad}</td>
                                    <td>{item.tipoEntidad}</td>
                                    <td>{item.sede}</td>
                                    <td>{item.concepto}</td>
                                    <td>{item.tipo}</td>
                                    <td>{formatMoney(item.importe)}</td>
                                    <td>{item.vencimiento}</td>
                                    <td>
                                        <span className={`status-badge ${item.estado.toLowerCase()}`}>
                                            {item.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {item.estado === "Pendiente" && (
                                                <button onClick={() => marcarAplicado(item.id)}>
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

                            {movimientosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="10">No se encontraron movimientos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal === "nuevo" && (
                <Modal title="Nuevo movimiento de cuenta corriente" onClose={() => setModal(null)}>
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
                            Entidad
                            <input
                                required
                                placeholder="Ej: OSDE, proveedor, paciente..."
                                value={form.entidad}
                                onChange={(e) => setForm({ ...form, entidad: e.target.value })}
                            />
                        </label>

                        <label>
                            Tipo de entidad
                            <select
                                value={form.tipoEntidad}
                                onChange={(e) => setForm({ ...form, tipoEntidad: e.target.value })}
                            >
                                <option>Obra social</option>
                                <option>Prepaga</option>
                                <option>Proveedor</option>
                                <option>Particular</option>
                            </select>
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
                            Movimiento
                            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                                <option>Debe</option>
                                <option>Haber</option>
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
                            Vencimiento
                            <input
                                type="date"
                                value={form.vencimiento}
                                onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
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
                                Guardar movimiento
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === "detalle" && (
                <Modal title={`Detalle de ${selectedEntidad}`} onClose={() => setModal(null)}>
                    <div className="table-card">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Concepto</th>
                                    <th>Tipo</th>
                                    <th>Importe</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {detalleEntidad.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.fecha}</td>
                                        <td>{item.concepto}</td>
                                        <td>{item.tipo}</td>
                                        <td>{formatMoney(item.importe)}</td>
                                        <td>{item.estado}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}
        </section>
    );
}