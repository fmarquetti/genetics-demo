export default function Footer() {
  const year = new Date().getFullYear();
  const version = "v0.5.1";

  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span>© {year} Genetics</span>
        <span className="footer-separator">•</span>
        <span>{version}</span>
        <span>Ambiente: Demo</span>
      </div>

      <div className="footer-right">
        <span>
          Creado por <strong>TECNEW</strong>
        </span>
      </div>
    </footer>
  );
}