import {
    LayoutDashboard,
    ArrowDownCircle,
    ArrowUpCircle,
    Wallet,
    Landmark,
    FileBarChart,
    FileText,
    Users,
    CalendarClock,
    Building2,
    UserCog,
    Settings,
} from "lucide-react";

import logo from "../assets/logo-genetics.png";

const menu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ingresos", label: "Ingresos", icon: ArrowDownCircle },
    { id: "egresos", label: "Egresos", icon: ArrowUpCircle },
    { id: "cuentas", label: "Cuentas corrientes", icon: Wallet },
    { id: "bancos", label: "Bancos", icon: Landmark },
    { id: "reportes", label: "Reportes", icon: FileBarChart },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "pacientes", label: "Pacientes y estudios", icon: Users },
    { id: "turnos", label: "Turnos", icon: CalendarClock },
    { id: "sedes", label: "Sociedades / Sedes", icon: Building2 },
    { id: "usuarios", label: "Usuarios", icon: UserCog },
    { id: "configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar({ activePage, setActivePage, currentUser }) {

    const visibleMenu = menu.filter((item) => {
        if (!currentUser) return false;
        if (currentUser.permissions.includes("all")) return true;
        return currentUser.permissions.includes(item.id);
    });

    return (
        <aside className="sidebar">
            <div className="brand">
                <img src={logo} alt="Genetics" />
                <div>
                    <strong>Genetics</strong>
                    <span>Laboratorio clínico</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {visibleMenu.map((item) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${activePage === item.id ? "active" : ""}`}
                            onClick={() => setActivePage(item.id)}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-user">
                <div className="avatar">
                    {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                </div>

                <div>
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.role}</span>
                </div>
            </div>
        </aside>
    );
}