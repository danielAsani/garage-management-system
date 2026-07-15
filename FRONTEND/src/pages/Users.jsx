import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import api, { getAllPages, getErrorMessage } from "../services/api";

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "AGENT",
  is_active: true,
  password: "",
};

function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = async () => {
    const usersData = await getAllPages("/accounts/users/");
    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers().catch(() => {
      setError("Impossible de charger les utilisateurs.");
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => {
    const payload = {
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      is_active: form.is_active,
    };

    if (form.password) {
      payload.password = form.password;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (editing) {
        await api.patch(`/accounts/users/${editing.id}/`, buildPayload());
        setMessage("Utilisateur modifie.");
      } else {
        await api.post("/accounts/users/", buildPayload());
        setMessage("Utilisateur cree.");
      }

      await loadUsers();
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer l'utilisateur."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || "AGENT",
      is_active: Boolean(user.is_active),
      password: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (user) => {
    try {
      await api.patch(`/accounts/users/${user.id}/`, {
        is_active: !user.is_active,
      });
      await loadUsers();
      setMessage(user.is_active ? "Utilisateur desactive." : "Utilisateur active.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de modifier le statut."));
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Creer les comptes et modifier les roles des agents"
      />

      <Alert type="success" message={message} />
      <Alert message={error} />

      <section className="form-panel">
        <div className="section-title">
          <h2>{editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
          {editing && (
            <button className="text-button" type="button" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Input
                label="Nom d'utilisateur"
                value={form.username}
                onChange={(event) => handleChange("username", event.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Input
                label="Prenom"
                value={form.first_name}
                onChange={(event) => handleChange("first_name", event.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <Input
                label="Nom"
                value={form.last_name}
                onChange={(event) => handleChange("last_name", event.target.value)}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label">Role</label>
              <select
                className="form-select mb-3"
                value={form.role}
                onChange={(event) => handleChange("role", event.target.value)}
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <Input
                label={editing ? "Nouveau mot de passe" : "Mot de passe"}
                type="password"
                value={form.password}
                onChange={(event) => handleChange("password", event.target.value)}
                placeholder={editing ? "Laisser vide pour ne pas changer" : ""}
                required={!editing}
              />
            </div>
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="userIsActive"
              checked={form.is_active}
              onChange={(event) => handleChange("is_active", event.target.checked)}
            />
            <label className="form-check-label" htmlFor="userIsActive">
              Compte actif
            </label>
          </div>

          <Button type="submit" className="w-100" disabled={saving}>
            {saving ? "Enregistrement..." : editing ? "Modifier" : "Creer"}
          </Button>
        </form>
      </section>

      <section className="content-section">
        <div className="section-title">
          <h2>Comptes</h2>
        </div>

        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState title="Aucun utilisateur" text="Les comptes crees apparaitront ici." />
        ) : (
          <div className="item-list">
            {users.map((user) => (
              <article className="data-card" key={user.id}>
                <div className="data-card-header">
                  <div>
                    <strong>{user.username}</strong>
                    <span>{user.email || "Aucun email"}</span>
                  </div>
                  <span className={`status-pill ${user.is_active ? "status-paid" : "status-cancelled"}`}>
                    {user.is_active ? "ACTIF" : "INACTIF"}
                  </span>
                </div>

                <dl className="meta-grid">
                  <div>
                    <dt>Nom</dt>
                    <dd>{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{user.role || "-"}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <Button variant="outline-primary" onClick={() => handleEdit(user)}>
                    Modifier
                  </Button>
                  <Button
                    variant={user.is_active ? "outline-danger" : "outline-success"}
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? "Desactiver" : "Activer"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Users;
