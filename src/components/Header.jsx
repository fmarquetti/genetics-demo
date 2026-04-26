import { Bell, Search, LogOut } from "lucide-react";

const sedes = [
    "Todas las sedes",
    "Sede Centro",
    "Sede Norte",
    "Sede Sur",
    "Sede Oeste",
    "Sede Pilar",
    "Sede Nueva 1",
    "Sede Nueva 2",
    "Sede nacho",
];

export default function Header({ selectedSede, setSelectedSede, currentUser, onLogout }) {
    return (
        <header className="topbar">
            <div>
                <h1>Panel de gestión</h1>
                <p>Demo operativo con datos simulados</p>
            </div>

            <div className="topbar-actions">
                <div className="search-box">
                    <Search size={16} />
                    <input placeholder="Buscar..." />
                </div>

                {currentUser.access === "Todas las sedes" ? (
                    <select value={selectedSede} onChange={(e) => setSelectedSede(e.target.value)}>
                        {sedes.map((sede) => (
                            <option key={sede}>{sede}</option>
                        ))}
                    </select>
                ) : (
                    <span className="sede-indicator">Vista: {currentUser.sede}</span>
                )}

                <button className="icon-button">
                    <Bell size={18} />
                </button>

                <button className="secondary-button" onClick={onLogout} title="Cerrar sesión">
                    <LogOut size={16} />
                    <span>Salir</span>
                </button>
            </div>
        </header>
    );
}