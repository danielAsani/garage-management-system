import { useEffect, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl, getPageData } from "../services/api";

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState({
    vehicleCount: 0,
    parkedCount: 0,
    paidCount: 0,
    pendingCount: 0,
    recentLocations: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationPhotos, setSelectedLocationPhotos] = useState([]);
  const [loadingLocationPhotos, setLoadingLocationPhotos] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const [vehicles, parkedLocations, paidPayments, pendingPayments, recentLocations] = await Promise.allSettled([
        getPageData("/vehicles/vehicles/"),
        getPageData("/locations/locations/?statut=PARKED"),
        getPageData("/payments/payments/?status=PAID"),
        getPageData("/payments/payments/?status=PENDING"),
        getPageData("/locations/locations/?limit=5"),
      ]);

      setData({
        vehicleCount: vehicles.status === "fulfilled" ? vehicles.value.count : 0,
        parkedCount: parkedLocations.status === "fulfilled" ? parkedLocations.value.count : 0,
        paidCount: paidPayments.status === "fulfilled" ? paidPayments.value.count : 0,
        pendingCount: pendingPayments.status === "fulfilled" ? pendingPayments.value.count : 0,
        recentLocations: recentLocations.status === "fulfilled" ? recentLocations.value.results : [],
      });
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const openLocationDetail = async (location) => {
    setSelectedLocation(location);
    setSelectedLocationPhotos([]);
    setLoadingLocationPhotos(true);

    try {
      const photosData = await getPageData(`/vehicles/photos/?vehicle=${location.vehicle}&limit=20`);
      setSelectedLocationPhotos(photosData.results);
    } catch {
      setSelectedLocationPhotos([]);
    } finally {
      setLoadingLocationPhotos(false);
    }
  };

  const handleLocationCardKeyDown = (event, location) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLocationDetail(location);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Bonjour ${user?.username || ""}`}
        subtitle={isAdmin ? "Vue globale de la gestion du garage" : "Vos operations principales du jour"}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <span>Vehicules</span>
              <strong>{data.vehicleCount}</strong>
              <i className="fa-solid fa-car" />
            </div>
            <div className="stat-card">
              <span>En stationnement</span>
              <strong>{data.parkedCount}</strong>
              <i className="fa-solid fa-square-parking" />
            </div>
            <div className="stat-card">
              <span>Paiements payes</span>
              <strong>{data.paidCount}</strong>
              <i className="fa-solid fa-circle-check" />
            </div>
            <div className="stat-card">
              <span>En attente</span>
              <strong>{data.pendingCount}</strong>
              <i className="fa-solid fa-clock" />
            </div>
          </section>

          <section className="content-section">
            <div className="section-title">
              <h2>Dernieres entrees</h2>
            </div>

            {data.recentLocations.length === 0 ? (
              <EmptyState title="Aucune entree" text="Les locations creees apparaitront ici." />
            ) : (
              <div className="item-list">
                {data.recentLocations.map((location) => (
                  <article
                    className="data-card location-click-card"
                    key={location.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLocationDetail(location)}
                    onKeyDown={(event) => handleLocationCardKeyDown(event, location)}
                  >
                    <div>
                      <strong>{location.vehicle_plaque}</strong>
                      <span>{location.nom_deposeur}</span>
                    </div>
                    <span className={`status-pill status-${location.statut.toLowerCase()}`}>
                      {location.statut}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          {selectedLocation && (
            <>
              <div
                className="modal fade show"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboardLocationDetailTitle"
                style={{ display: "block" }}
                tabIndex="-1"
              >
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                  <div className="modal-content location-detail-modal">
                    <div className="modal-header">
                      <div>
                        <h2 className="modal-title fs-5" id="dashboardLocationDetailTitle">
                          Detail de la location
                        </h2>
                        <span className="muted-text">{selectedLocation.code}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Fermer"
                        onClick={() => setSelectedLocation(null)}
                      />
                    </div>

                    <div className="modal-body">
                      <div className="location-detail-head">
                        <div>
                          <strong>{selectedLocation.vehicle_plaque}</strong>
                          <span>
                            {selectedLocation.vehicle_type_name || "Type inconnu"} - {selectedLocation.vehicle_marque || "-"}
                          </span>
                        </div>
                        <span className={`status-pill status-${selectedLocation.statut.toLowerCase()}`}>
                          {selectedLocation.statut === "PARKED" ? "GARE" : selectedLocation.statut}
                        </span>
                      </div>

                      <dl className="meta-grid location-detail-grid">
                        <div>
                          <dt>Parking</dt>
                          <dd>{selectedLocation.parking_name || "-"}</dd>
                        </div>
                        <div>
                          <dt>Emplacement</dt>
                          <dd>{selectedLocation.parking_zone_name || "-"}</dd>
                        </div>
                        <div>
                          <dt>Deposeur</dt>
                          <dd>{selectedLocation.nom_deposeur || "-"}</dd>
                        </div>
                        <div>
                          <dt>Telephone</dt>
                          <dd>{selectedLocation.telephone || "-"}</dd>
                        </div>
                        <div>
                          <dt>Marque</dt>
                          <dd>{selectedLocation.vehicle_marque || "-"}</dd>
                        </div>
                        <div>
                          <dt>Couleur</dt>
                          <dd>{selectedLocation.vehicle_couleur || "-"}</dd>
                        </div>
                        <div>
                          <dt>Entree</dt>
                          <dd>{formatDateTime(selectedLocation.heure_entree)}</dd>
                        </div>
                        <div>
                          <dt>Sortie</dt>
                          <dd>{formatDateTime(selectedLocation.heure_sortie)}</dd>
                        </div>
                      </dl>

                      <section className="location-photo-detail">
                        <div className="section-title">
                          <h2>Photos</h2>
                        </div>
                        {loadingLocationPhotos ? (
                          <p className="muted-text">Chargement des photos...</p>
                        ) : selectedLocationPhotos.length > 0 ? (
                          <div className="location-photo-grid">
                            {selectedLocationPhotos.map((photo) => (
                              <a
                                href={getMediaUrl(photo.image)}
                                key={photo.id}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <img src={getMediaUrl(photo.image)} alt={`Vehicule ${selectedLocation.vehicle_plaque}`} />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="muted-text">Aucune photo disponible pour ce vehicule.</p>
                        )}
                      </section>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSelectedLocation(null)}
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" onClick={() => setSelectedLocation(null)} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
