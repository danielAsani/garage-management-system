import { useEffect, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api, { getErrorMessage, getPageData } from "../services/api";

const methods = [
  ["CASH", "Cash"],
  ["ORANGE_MONEY", "Orange Money"],
  ["MPESA", "M-Pesa"],
  ["AIRTEL_MONEY", "Airtel Money"],
  ["ILLICOCASH", "Illicocash"],
];

const statuses = [
  ["PENDING", "En attente"],
  ["PAID", "Paye"],
  ["FAILED", "Echoue"],
  ["CANCELLED", "Annule"],
];

const emptyForm = {
  location: "",
  method: "CASH",
  payment_identifier: "",
  status: "PENDING",
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} FC`;
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const [paymentsData, locationsData] = await Promise.all([
      getPageData("/payments/payments/?limit=100"),
      getPageData("/locations/locations/?limit=100"),
    ]);

    setPayments(paymentsData.results);
    setLocations(locationsData.results);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => {
      setError("Impossible de charger les paiements.");
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        location: Number(form.location),
        method: form.method,
        payment_identifier: form.method === "CASH" ? "" : form.payment_identifier,
        status: form.status,
      };

      if (editing) {
        await api.patch(`/payments/payments/${editing.id}/`, payload);
      } else {
        await api.post("/payments/payments/", payload);
      }

      await loadData();
      resetForm();
      setMessage(editing ? "Paiement modifie." : "Paiement enregistre.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer le paiement."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setEditing(payment);
    setForm({
      location: payment.location || "",
      method: payment.method || "CASH",
      payment_identifier: payment.payment_identifier || "",
      status: payment.status || "PENDING",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markPaid = async (payment) => {
    try {
      await api.patch(`/payments/payments/${payment.id}/`, { status: "PAID" });
      await loadData();
      setMessage("Paiement marque comme paye.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de valider le paiement."));
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm("Supprimer ce paiement ?")) {
      return;
    }

    try {
      await api.delete(`/payments/payments/${paymentId}/`);
      await loadData();
      setMessage("Paiement supprime.");
    } catch (err) {
      setError(getErrorMessage(err, "Suppression impossible."));
    }
  };

  return (
    <div>
      <PageHeader title="Paiements" subtitle="Creer et suivre les paiements des stationnements" />

      <Alert type="success" message={message} />
      <Alert message={error} />

      <section className="form-panel">
        <div className="section-title">
          <h2>{editing ? "Modifier le paiement" : "Nouveau paiement"}</h2>
          {editing && (
            <button className="text-button" type="button" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Location</label>
            <select
              className="form-select"
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              required
            >
              <option value="">Choisir une location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.vehicle_plaque}
                </option>
              ))}
            </select>
          </div>

          <p className="muted-text mb-3">
            Le montant est calcule automatiquement selon la duree, avec un minimum de 500 FC.
          </p>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label">Methode</label>
              <select
                className="form-select mb-3"
                value={form.method}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  method: event.target.value,
                  payment_identifier: event.target.value === "CASH" ? "" : current.payment_identifier,
                }))}
              >
                {methods.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Statut</label>
              <select
                className="form-select mb-3"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.method !== "CASH" && (
            <Input
              label="Identifiant de transaction"
              value={form.payment_identifier}
              onChange={(event) => setForm((current) => ({
                ...current,
                payment_identifier: event.target.value,
              }))}
              required
            />
          )}

          <Button type="submit" className="w-100" disabled={saving}>
            {saving ? "Enregistrement..." : editing ? "Modifier" : "Enregistrer"}
          </Button>
        </form>
      </section>

      <section className="content-section">
        <div className="section-title">
          <h2>Liste des paiements</h2>
        </div>

        {loading ? (
          <LoadingState />
        ) : payments.length === 0 ? (
          <EmptyState title="Aucun paiement" text="Les paiements enregistres apparaitront ici." />
        ) : (
          <div className="item-list">
            {payments.map((payment) => (
              <article className="data-card" key={payment.id}>
                <div className="data-card-header">
                  <div>
                    <strong>{payment.vehicle_plaque}</strong>
                    <span>{payment.location_code}</span>
                  </div>
                  <span className={`status-pill status-${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </div>

                <dl className="meta-grid">
                  <div>
                    <dt>Montant</dt>
                    <dd>{formatMoney(payment.amount)}</dd>
                  </div>
                  <div>
                    <dt>Methode</dt>
                    <dd>{payment.method}</dd>
                  </div>
                  <div>
                    <dt>Identifiant</dt>
                    <dd>{payment.payment_identifier || "-"}</dd>
                  </div>
                  <div>
                    <dt>Paye le</dt>
                    <dd>{payment.paid_at ? new Date(payment.paid_at).toLocaleString() : "-"}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  {payment.status !== "PAID" && (
                    <Button variant="success" onClick={() => markPaid(payment)}>
                      Paye
                    </Button>
                  )}
                  <Button variant="outline-primary" onClick={() => handleEdit(payment)}>
                    Modifier
                  </Button>
                  <Button variant="outline-danger" onClick={() => handleDelete(payment.id)}>
                    Supprimer
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

export default Payments;
