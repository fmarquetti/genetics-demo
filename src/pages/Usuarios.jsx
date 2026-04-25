import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import Modal from "../components/Modal";

const initialUsuarios = [
    {
        id: 1,
        nombre: "Juan Pérez",
        email: "juan@genetics.com",
        rol: "Administrador",
        acceso: "Todas las sedes",
        sede: "Todas",
        estado: "Activo",
    },
    {
        id: 2,
        nombre: "María Gómez",
        email: "maria@genetics.com",
        rol: "Contador",
        acceso: "Todas las sedes",
        sede: "Todas",
        estado: "Activo",
    },
    {
        id: 3,
        nombre: "Ana López",
        email: "ana@genetics.com",
        rol: "Operador",
        acceso: "Una sede",
        sede: "Sede Norte",
        estado: "Activo",
    },
    {
        id: 4,
        nombre: "Lucía Torres",
        email: "lucia@genetics.com",
        rol: "Recepción",
        acceso: "Una sede",
        sede: "Sede Centro",
        estado: "Suspendido",
    },
];

export default function Usuarios({ selectedSede }) {
    const [usuarios, setUsuarios] = useState(initialUsuarios);
    const [search, setSearch] = useState("");
    const [rolFiltro, setRolFiltro] = useState("Todos");
    const [modal, setModal] = useState(null);
    const [selectedUsuario, setSelectedUsuario] = useState(null);

    const [form, setForm] = useState({
        nombre: "",
        email: "",
        rol: "Operador",
        acceso: "Una sede",
        sede: "Sede Centro",
        estado: "Activo",
    });

    function filterUsuariosBySede(items, selectedSede) {
        if (!selectedSede || selectedSede === "Todas las sedes") return items;

        return items.filter((item) => {
            return item.sede === selectedSede || item.sede === "Todas";
        });
    }

    const usuariosPorSede = filterUsuariosBySede(usuarios, selectedSede);

    const usuariosFiltrados = useMemo(() => {
        return usuariosPorSede.filter((item) => {
            const matchSearch =
                item.nombre.toLowerCase().includes(search.toLowerCase()) ||
                item.email.toLowerCase().includes(search.toLowerCase()) ||
                item.sede.toLowerCase().includes(search.toLowerCase());

            const matchRol = rolFiltro === "Todos" || item.rol === rolFiltro;

            return matchSearch && matchRol;
        });
    }, [usuariosPorSede, search, rolFiltro]);

    const activos = usuariosPorSede.filter((u) => u.estado === "Activo").length;
    const suspendidos = usuariosPorSede.filter((u) => u.estado === "Suspendido").length;
    const multisede = usuariosPorSede.filter((u) => u.acceso === "Todas las sedes").length;
    const sedeUnica = usuariosPorSede.filter((u) => u.acceso === "Una sede").length;
    
    function handleCreate(e) {
        e.preventDefault();

        setUsuarios((prev) => [
            {
                id: Date.now(),
                ...form,
                sede: form.acceso === "Todas las sedes" ? "Todas" : form.sede,
            },
            ...prev,
        ]);

        setForm({
            nombre: "",
            email: "",
            rol: "Operador",
            acceso: "Una sede",
            sede: "Sede Centro",
            estado: "Activo",
        });

        setModal(null);
    }

    function toggleEstado(id) {
        setUsuarios((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        estado: item.estado === "Activo" ? "Suspendido" : "Activo",
                    }
                    : item
            )
        );
    }

    function handleDelete(id) {
        setUsuarios((prev) => prev.filter((item) => item.id !== id));
    }

    function abrirDetalle(usuario) {
        setSelectedUsuario(usuario);
        setModal("detalle");
    }

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h2>Usuarios</h2>
                    <p>Gestión de roles, permisos y acceso por sociedad o sede.</p>
                </div>

                <button className="primary-button" onClick={() => setModal("nuevo")}>
                    <Plus size={16} /> Nuevo usuario
                </button>
            </div>

            <div className="stats-grid small">
                <div className="stat-card">
                    <div>
                        <span>Usuarios activos</span>
                        <strong>{activos}</strong>
                        <small>Con acceso habilitado</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <span>Suspendidos</span>
                        <strong>{suspendidos}</strong>
                        <small>Acceso bloqueado</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <span>Acceso global</span>
                        <strong>{multisede}</strong>
                        <small>Todas las sedes</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <span>Acceso limitado</span>
                        <strong>{sedeUnica}</strong>
                        <small>Una sola sede</small>
                    </div>
                </div>
            </div>

            <div className="filters-bar">
                <input
                    placeholder="Buscar por nombre, email o sede..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)}>
                    <option>Todos</option>
                    <option>Administrador</option>
                    <option>Contador</option>
                    <option>Operador</option>
                    <option>Recepción</option>
                    <option>Bioquímico</option>
                </select>
            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acceso</th>
                            <th>Sede</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {usuariosFiltrados.map((item) => (
                            <tr key={item.id}>
                                <td>{item.nombre}</td>
                                <td>{item.email}</td>
                                <td>{item.rol}</td>
                                <td>{item.acceso}</td>
                                <td>{item.sede}</td>
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
                                            {item.estado === "Activo" ? (
                                                <UserX size={16} />
                                            ) : (
                                                <UserCheck size={16} />
                                            )}
                                        </button>

                                        <button onClick={() => handleDelete(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {usuariosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="7">No se encontraron usuarios.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modal === "nuevo" && (
                <Modal title="Nuevo usuario" onClose={() => setModal(null)}>
                    <form className="form-grid" onSubmit={handleCreate}>
                        <label>
                            Nombre
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            />
                        </label>

                        <label>
                            Email
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </label>

                        <label>
                            Rol
                            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                                <option>Administrador</option>
                                <option>Contador</option>
                                <option>Operador</option>
                                <option>Recepción</option>
                                <option>Bioquímico</option>
                            </select>
                        </label>

                        <label>
                            Tipo de acceso
                            <select value={form.acceso} onChange={(e) => setForm({ ...form, acceso: e.target.value })}>
                                <option>Una sede</option>
                                <option>Todas las sedes</option>
                            </select>
                        </label>

                        {form.acceso === "Una sede" && (
                            <label>
                                Sede asignada
                                <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })}>
                                    <option>Sede Centro</option>
                                    <option>Sede Norte</option>
                                    <option>Sede Sur</option>
                                    <option>Sede Oeste</option>
                                    <option>Sede Pilar</option>
                                </select>
                            </label>
                        )}

                        <div className="modal-actions">
                            <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                                Cancelar
                            </button>

                            <button type="submit" className="primary-button">
                                Crear usuario
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === "detalle" && selectedUsuario && (
                <Modal title={`Permisos de ${selectedUsuario.nombre}`} onClose={() => setModal(null)}>
                    <div className="detail-grid">
                        <div>
                            <span>Email</span>
                            <strong>{selectedUsuario.email}</strong>
                        </div>

                        <div>
                            <span>Rol</span>
                            <strong>{selectedUsuario.rol}</strong>
                        </div>

                        <div>
                            <span>Acceso</span>
                            <strong>{selectedUsuario.acceso}</strong>
                        </div>

                        <div>
                            <span>Sede</span>
                            <strong>{selectedUsuario.sede}</strong>
                        </div>

                        <div className="full">
                            <span>Permisos simulados</span>
                            <strong>
                                {selectedUsuario.rol === "Administrador"
                                    ? "Acceso completo a usuarios, sedes, reportes, bancos, configuración y documentos."
                                    : selectedUsuario.rol === "Contador"
                                        ? "Acceso a ingresos, egresos, bancos, cuentas corrientes, reportes y documentos."
                                        : selectedUsuario.rol === "Bioquímico"
                                            ? "Acceso a pacientes, estudios, resultados y documentos clínicos."
                                            : "Acceso operativo limitado según sede asignada."}
                            </strong>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    );
}