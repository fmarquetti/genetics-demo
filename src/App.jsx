import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Ingresos from "./pages/Ingresos";
import Egresos from "./pages/Egresos";
import CuentasCorrientes from "./pages/CuentasCorrientes";
import Bancos from "./pages/Bancos";
import Reportes from "./pages/Reportes";
import Documentos from "./pages/Documentos";
import Pacientes from "./pages/Pacientes";
import Sedes from "./pages/Sedes";
import Usuarios from "./pages/Usuarios";
import Configuracion from "./pages/Configuracion";

import Footer from "./components/Footer";

const getPage = (activePage, selectedSede) => {
  const props = { selectedSede };

  const pages = {
    dashboard: <Dashboard {...props} />,
    ingresos: <Ingresos {...props} />,
    egresos: <Egresos {...props} />,
    cuentas: <CuentasCorrientes {...props} />,
    bancos: <Bancos {...props} />,
    reportes: <Reportes {...props} />,
    documentos: <Documentos {...props} />,
    pacientes: <Pacientes {...props} />,
    sedes: <Sedes {...props} />,
    usuarios: <Usuarios {...props} />,
    configuracion: <Configuracion {...props} />,
  };

  return pages[activePage];
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedSede, setSelectedSede] = useState("Todas las sedes");
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const effectiveSelectedSede =
    currentUser.access === "Una sede" ? currentUser.sede : selectedSede;

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
      />

      <main className="main-content">
        <Header
          selectedSede={effectiveSelectedSede}
          setSelectedSede={setSelectedSede}
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
        />

        <div className="page-content">
          {getPage(activePage, effectiveSelectedSede)}
        </div>

        <Footer />
      </main>
    </div>
  );
}