import { useState } from "react";
import logo from "../assets/logo-genetics.png";

const demoUsers = [
  {
    id: 1,
    name: "Juan Pérez",
    email: "admin@genetics.com",
    password: "123456",
    role: "Administrador",
    access: "Todas las sedes",
    sede: "Todas las sedes",
    permissions: ["all"],
  },
  {
    id: 2,
    name: "María Gómez",
    email: "contador@genetics.com",
    password: "123456",
    role: "Contador",
    access: "Todas las sedes",
    sede: "Todas las sedes",
    permissions: ["dashboard", "ingresos", "egresos", "cuentas", "bancos", "reportes", "documentos"],
  },
  {
    id: 3,
    name: "Ana López",
    email: "recepcion@genetics.com",
    password: "123456",
    role: "Recepción",
    access: "Una sede",
    sede: "Sede Norte",
    permissions: ["dashboard", "pacientes", "documentos"],
  },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@genetics.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const user = demoUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    onLogin(user);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img src={logo} alt="Genetics" className="login-logo" />
          <h1>GENETICS</h1>
          <p>Plataforma de gestión para laboratorio clínico</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="primary-button" type="submit">
            Ingresar
          </button>
        </form>

        <div className="demo-users">
          <strong>Usuarios demo</strong>

          <button onClick={() => setEmail("admin@genetics.com")}>
            Administrador — todas las sedes
          </button>

          <button onClick={() => setEmail("contador@genetics.com")}>
            Contador — módulo financiero
          </button>

          <button onClick={() => setEmail("recepcion@genetics.com")}>
            Recepción — solo Sede Norte
          </button>

          <small>Contraseña para todos: 123456</small>
        </div>

        <div className="login-footer">
          Versión <strong>DEMOSTRACIÓN</strong>
        </div>
      </section>
    </main>
  );
}