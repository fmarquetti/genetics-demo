import { useEffect, useState } from "react";
import { Bell, Search, LogOut } from "lucide-react";
import { getSedes } from "../services/sedeService";

export default function Header({
  selectedSede,
  setSelectedSede,
  setSedeId,
  currentUser,
  onLogout,
}) {
  const [sedes, setSedes] = useState([]);
  const isAdmin = currentUser?.access === "Todas las sedes";

  useEffect(() => {
    async function loadSedes() {
      try {
        const data = await getSedes();
        setSedes(data.filter((sede) => sede.estado === "Activa"));
      } catch (error) {
        console.error("Error cargando sedes en Header:", error);
      }
    }

    if (isAdmin) {
      loadSedes();
    }
  }, [isAdmin]);

  return (
    <header className="topbar">
      <div>
        <h1>Panel de gestión</h1>
        <p>Gestión operativa integrada</p>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Buscar..." />
        </div>

        {isAdmin ? (
          <select
            value={selectedSede}
            onChange={(e) => {
              const nombre = e.target.value;
              setSelectedSede(nombre);
              const sede = sedes.find((s) => s.nombre === nombre);
              setSedeId?.(sede?.id ?? "todas");
            }}
          >
            <option value="Todas las sedes">Todas las sedes</option>

            {sedes.map((sede) => (
              <option key={sede.id} value={sede.nombre}>
                {sede.nombre}
              </option>
            ))}
          </select>
        ) : (
          <span className="sede-indicator">Vista: {currentUser.sede}</span>
        )}

        <button className="icon-button">
          <Bell size={18} />
        </button>

        <button
          className="secondary-button"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}