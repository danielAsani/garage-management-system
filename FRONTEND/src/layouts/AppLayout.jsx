import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Accueil", icon: "fa-house", group: "Core" },
  { to: "/vehicles", label: "Vehicules", icon: "fa-car", group: "Operations" },
  { to: "/operations", label: "Operations", icon: "fa-right-left", group: "Operations" },
  { to: "/parkings", label: "Parkings", icon: "fa-warehouse", group: "Configuration" },
  { to: "/finance", label: "Finance", icon: "fa-chart-line", group: "Configuration", adminOnly: true },
  { to: "/users", label: "Utilisateurs", icon: "fa-users", group: "Configuration", adminOnly: true },
];

function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => {
    document.body.classList.toggle("sb-sidenav-toggled");
  };

  const renderLinks = (group) =>
    links
      .filter((link) => link.group === group && (!link.adminOnly || isAdmin))
      .map((link) => (
        <NavLink className="nav-link" key={link.to} to={link.to} end={link.to === "/"}>
          <div className="sb-nav-link-icon">
            <i className={`fa-solid ${link.icon}`} />
          </div>
          {link.label}
        </NavLink>
      ));

  return (
    <div className="sb-nav-fixed app-shell">
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <NavLink className="navbar-brand ps-3" to="/">
          Garage Manager
        </NavLink>

        <button
          className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
          id="sidebarToggle"
          type="button"
          onClick={toggleSidebar}
          aria-label="Basculer le menu"
        >
          <i className="fas fa-bars" />
        </button>

        <div className="ms-auto me-3 topbar-user">
          <span>{user?.username}</span>
          <small>{isAdmin ? "Administrateur" : "Agent"}</small>
        </div>

        <button className="btn btn-outline-light me-3" type="button" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket me-1" />
          <span className="d-none d-sm-inline">Sortir</span>
        </button>
      </nav>

      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
            <div className="sb-sidenav-menu">
              <div className="nav">
                <div className="sb-sidenav-menu-heading">Core</div>
                {renderLinks("Core")}

                <div className="sb-sidenav-menu-heading">Operations</div>
                {renderLinks("Operations")}

                <div className="sb-sidenav-menu-heading">Configuration</div>
                {renderLinks("Configuration")}
              </div>
            </div>
            <div className="sb-sidenav-footer">
              <div className="small">Connecte en tant que:</div>
              {user?.username || "Utilisateur"}
            </div>
          </nav>
        </div>

        <div id="layoutSidenav_content">
          <main className="app-main">
            <div className="container-fluid px-4">
              <Outlet />
            </div>
          </main>
          <footer className="py-4 bg-light mt-auto app-footer">
            <div className="container-fluid px-4">
              <div className="d-flex align-items-center justify-content-between small">
                <div className="text-muted">Garage Manager</div>
                <div>{isAdmin ? "Espace administrateur" : "Espace agent"}</div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <nav className="mobile-nav">
        {links.filter((link) => !link.adminOnly || isAdmin).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"}>
            <i className={`fa-solid ${link.icon}`} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppLayout;
