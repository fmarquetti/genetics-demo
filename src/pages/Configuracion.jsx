import { useMemo, useState } from "react";
import { Eye, Save, RotateCcw, ShieldCheck } from "lucide-react";
import Modal from "../components/Modal";

const initialConfig = [
  {
    id: 1,
    grupo: "Sistema",
    parametro: "Nombre del sistema",
    descripcion: "Nombre comercial visible en la plataforma.",
    valor: "Genetics",
    tipo: "Texto",
    estado: "Activo",
  },
  {
    id: 2,
    grupo: "Usuarios y permisos",
    parametro: "Acceso multisede",
    descripcion: "Permite usuarios con acceso global o limitado a una sede.",
    valor: "Activo",
    tipo: "Booleano",
    estado: "Activo",
  },
  {
    id: 3,
    grupo: "Documentos",
    parametro: "Repositorio documental",
    descripcion: "Storage previsto para facturas, comprobantes y resultados.",
    valor: "Supabase Storage",
    tipo: "Integración",
    estado: "Pendiente integración",
  },
  {
    id: 4,
    grupo: "Autenticación",
    parametro: "Proveedor de Auth",
    descripcion: "Servicio previsto para login, sesiones y permisos.",
    valor: "Supabase Auth",
    tipo: "Integración",
    estado: "Pendiente integración",
  },
  {
    id: 5,
    grupo: "Numeración",
    parametro: "Numeración de documentos",
    descripcion: "Secuencia automática para facturas, recibos y comprobantes.",
    valor: "Automática",
    tipo: "Sistema",
    estado: "Activo",
  },
  {
    id: 6,
    grupo: "Auditoría",
    parametro: "Registro de actividad",
    descripcion: "Guarda acciones de usuarios sobre módulos críticos.",
    valor: "Activo",
    tipo: "Seguridad",
    estado: "Activo",
  },
];

export default function Configuracion() {
  const [config, setConfig] = useState(initialConfig);
  const [search, setSearch] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const configFiltrada = useMemo(() => {
    return config.filter((item) => {
      const matchSearch =
        item.parametro.toLowerCase().includes(search.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        item.valor.toLowerCase().includes(search.toLowerCase());

      const matchGrupo = grupoFiltro === "Todos" || item.grupo === grupoFiltro;

      return matchSearch && matchGrupo;
    });
  }, [config, search, grupoFiltro]);

  const activos = config.filter((c) => c.estado === "Activo").length;
  const pendientes = config.filter((c) => c.estado === "Pendiente integración").length;
  const seguridad = config.filter((c) => c.grupo === "Auditoría" || c.grupo === "Autenticación").length;
  const integraciones = config.filter((c) => c.tipo === "Integración").length;

  function abrirDetalle(item) {
    setSelectedConfig(item);
    setModal("detalle");
  }

  function toggleEstado(id) {
    setConfig((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              estado: item.estado === "Activo" ? "Pendiente integración" : "Activo",
            }
          : item
      )
    );
  }

  function actualizarValor(id, nuevoValor) {
    setConfig((prev) =>
      prev.map((item) => (item.id === id ? { ...item, valor: nuevoValor } : item))
    );
  }

  function restaurarDemo() {
    setConfig(initialConfig);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Configuración</h2>
          <p>Parámetros generales, seguridad, numeración e integración futura con Supabase.</p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={restaurarDemo}>
            <RotateCcw size={16} /> Restaurar demo
          </button>

          <button className="primary-button">
            <Save size={16} /> Guardar cambios
          </button>
        </div>
      </div>

      <div className="stats-grid small">
        <div className="stat-card"><div><span>Parámetros activos</span><strong>{activos}</strong><small>Configuraciones habilitadas</small></div></div>
        <div className="stat-card"><div><span>Pendientes</span><strong>{pendientes}</strong><small>Integraciones futuras</small></div></div>
        <div className="stat-card"><div><span>Seguridad</span><strong>{seguridad}</strong><small>Auth, roles y auditoría</small></div></div>
        <div className="stat-card"><div><span>Integraciones</span><strong>{integraciones}</strong><small>Servicios externos previstos</small></div></div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar parámetro, descripción o valor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={grupoFiltro} onChange={(e) => setGrupoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Sistema</option>
          <option>Usuarios y permisos</option>
          <option>Documentos</option>
          <option>Autenticación</option>
          <option>Numeración</option>
          <option>Auditoría</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Parámetro</th>
              <th>Descripción</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {configFiltrada.map((item) => (
              <tr key={item.id}>
                <td>{item.grupo}</td>
                <td>{item.parametro}</td>
                <td>{item.descripcion}</td>
                <td>
                  <input
                    className="inline-input"
                    value={item.valor}
                    onChange={(e) => actualizarValor(item.id, e.target.value)}
                  />
                </td>
                <td>{item.tipo}</td>
                <td>
                  <span className={`status-badge ${item.estado.toLowerCase().replaceAll(" ", "-")}`}>
                    {item.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => abrirDetalle(item)}><Eye size={16} /></button>
                    <button onClick={() => toggleEstado(item.id)}><ShieldCheck size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}

            {configFiltrada.length === 0 && (
              <tr><td colSpan="7">No se encontraron parámetros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "detalle" && selectedConfig && (
        <Modal title={`Configuración: ${selectedConfig.parametro}`} onClose={() => setModal(null)}>
          <div className="detail-grid">
            <div><span>Grupo</span><strong>{selectedConfig.grupo}</strong></div>
            <div><span>Tipo</span><strong>{selectedConfig.tipo}</strong></div>
            <div><span>Valor actual</span><strong>{selectedConfig.valor}</strong></div>
            <div><span>Estado</span><strong>{selectedConfig.estado}</strong></div>
            <div className="full"><span>Descripción</span><strong>{selectedConfig.descripcion}</strong></div>
            <div className="full document-preview">
              En producción, este parámetro se guardará en Supabase y podrá quedar auditado por usuario, fecha y módulo.
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}