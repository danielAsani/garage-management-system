import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const FC_PER_DOLLAR = 2300;

function toMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} FC`;
}

function toDollar(value) {
  return `≈ ${(Number(value || 0) / FC_PER_DOLLAR).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} $`;
}

function Finance() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
    exitedCount: 0,
    byMethod: {},
    recentPayments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const response = await api.get("/payments/payments/summary/");
      const data = response.data;

      setStats({
        totalPaid: Number(data.total_paid || 0),
        totalPending: Number(data.total_pending || 0),
        paidCount: data.paid_count || 0,
        pendingCount: data.pending_count || 0,
        exitedCount: data.exited_count || 0,
        byMethod: data.by_method || {},
        recentPayments: data.recent_payments || [],
      });
      setLoading(false);
    };

    loadData().catch(() => {
      setError("Impossible de charger les finances.");
      setLoading(false);
    });
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Suivre les encaissements et le rendement du parking"
      />

      <Alert message={error} />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <span>Total encaisse</span>
              <strong>{toMoney(stats.totalPaid)}</strong>
              <small className="muted-text">{toDollar(stats.totalPaid)}</small>
              <i className="fa-solid fa-sack-dollar" />
            </div>
            <div className="stat-card">
              <span>En attente</span>
              <strong>{toMoney(stats.totalPending)}</strong>
              <small className="muted-text">{toDollar(stats.totalPending)}</small>
              <i className="fa-solid fa-clock" />
            </div>
            <div className="stat-card">
              <span>Paiements payes</span>
              <strong>{stats.paidCount}</strong>
              <i className="fa-solid fa-circle-check" />
            </div>
            <div className="stat-card">
              <span>Vehicules sortis</span>
              <strong>{stats.exitedCount}</strong>
              <i className="fa-solid fa-right-from-bracket" />
            </div>
          </section>

          <section className="content-section">
            <div className="section-title">
              <h2>Rendu par methode</h2>
            </div>
            {Object.keys(stats.byMethod).length === 0 ? (
              <EmptyState title="Aucun paiement paye" text="Les revenus apparaitront apres les sorties payees." />
            ) : (
              <div className="finance-method-grid">
                {Object.entries(stats.byMethod).map(([method, amount]) => (
                  <article className="data-card" key={method}>
                    <span>{method}</span>
                    <strong>{toMoney(amount)}</strong>
                    <small className="muted-text">{toDollar(amount)}</small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="content-section">
            <div className="section-title">
              <h2>Historique financier</h2>
            </div>
            {stats.recentPayments.length === 0 ? (
              <EmptyState title="Aucun paiement" text="Les paiements finalises aux sorties apparaitront ici." />
            ) : (
              <div className="item-list">
                {stats.recentPayments.map((payment) => (
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
                        <dd>
                          <strong>{toMoney(payment.amount)}</strong>
                          <small className="muted-text d-block">{toDollar(payment.amount)}</small>
                        </dd>
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
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Finance;
