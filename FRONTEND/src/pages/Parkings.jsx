import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import api, { getAllPages, getErrorMessage } from "../services/api";

function Parkings() {
  const { isAdmin } = useAuth();
  const [parkings, setParkings] = useState([]);
  const [zones, setZones] = useState([]);
  const [types, setTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [parkingName, setParkingName] = useState("");
  const [zoneForm, setZoneForm] = useState({ parking: "", vehicle_type: "", quantity: 1 });
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visibleZones = useMemo(() => {
    if (selectedTypeFilter === "all") {
      return zones;
    }

    return zones.filter((zone) => String(zone.vehicle_type) === String(selectedTypeFilter));
  }, [zones, selectedTypeFilter]);

  const zonesByParking = useMemo(() => {
    return visibleZones.reduce((acc, zone) => {
      acc[zone.parking] = acc[zone.parking] || [];
      acc[zone.parking].push(zone);
      return acc;
    }, {});
  }, [visibleZones]);

  const occupiedByZone = useMemo(() => {
    return locations
      .filter((location) => location.statut === "PARKED" && location.parking_zone)
      .reduce((acc, location) => {
        acc[location.parking_zone] = location;
        return acc;
      }, {});
  }, [locations]);

  const parkingStatsById = useMemo(() => {
    return parkings.reduce((acc, parking) => {
      const parkingZones = zonesByParking[parking.id] || [];
      const occupied = parkingZones.filter((zone) => occupiedByZone[zone.id]).length;

      acc[parking.id] = {
        total: parkingZones.length,
        occupied,
        available: parkingZones.length - occupied,
      };

      return acc;
    }, {});
  }, [parkings, zonesByParking, occupiedByZone]);

  const typeSummaryByParking = useMemo(() => {
    return visibleZones.reduce((acc, zone) => {
      const parkingGroups = acc[zone.parking] || {};
      const typeName = zone.vehicle_type_name || "Type inconnu";
      parkingGroups[typeName] = (parkingGroups[typeName] || 0) + 1;
      acc[zone.parking] = parkingGroups;
      return acc;
    }, {});
  }, [visibleZones]);

  const visibleParkings = useMemo(() => {
    if (selectedTypeFilter === "all") {
      return parkings;
    }

    return parkings.filter((parking) => (zonesByParking[parking.id] || []).length > 0);
  }, [parkings, zonesByParking, selectedTypeFilter]);

  const loadData = async () => {
    const [parkingsData, zonesData, typesData, locationsData] = await Promise.all([
      getAllPages("/parkings/parkings/"),
      getAllPages("/parkings/zones/"),
      getAllPages("/vehicles/types/"),
      getAllPages("/locations/locations/?statut=PARKED"),
    ]);

    setParkings(parkingsData);
    setZones(zonesData);
    setTypes(typesData);
    setLocations(locationsData);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => {
      setError("Impossible de charger les parkings.");
      setLoading(false);
    });
  }, []);

  const handleParkingSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/parkings/parkings/", { name: parkingName });
      setParkingName("");
      await loadData();
      setMessage("Parking cree.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de creer le parking."));
    }
  };

  const handleZoneSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/parkings/zones/", {
        parking: Number(zoneForm.parking),
        vehicle_type: Number(zoneForm.vehicle_type),
        quantity: Number(zoneForm.quantity),
      });
      setZoneForm({ parking: "", vehicle_type: "", quantity: 1 });
      await loadData();
      setMessage("Zones creees automatiquement.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de creer les zones."));
    }
  };

  const handleDeleteParking = async (parkingId) => {
    if (!window.confirm("Supprimer ce parking ?")) {
      return;
    }

    try {
      await api.delete(`/parkings/parkings/${parkingId}/`);
      await loadData();
      setMessage("Parking supprime.");
    } catch (err) {
      setError(getErrorMessage(err, "Suppression impossible."));
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await api.delete(`/parkings/zones/${zoneId}/`);
      await loadData();
      setMessage("Zone supprimee.");
    } catch (err) {
      setError(getErrorMessage(err, "Suppression impossible."));
    }
  };

  return (
    <div >
      <PageHeader
        title="Parkings"
        subtitle={isAdmin ? "Configurer les parkings et generer les zones" : "Consulter les parkings disponibles"}
      />

      <Alert type="success" message={message} />
      <Alert message={error} />

      {isAdmin && (
        <>
        <div className="row gy-3">
          <section className="form-panel compact-panel col-12 col-md-4">
            <div className="section-title">
              <h2>Nouveau parking</h2>
            </div>
            <form className="inline-form" onSubmit={handleParkingSubmit}>
              <input
                className="form-control"
                value={parkingName}
                onChange={(event) => setParkingName(event.target.value)}
                placeholder="Parking principal"
                required
              />
              <Button type="submit">Ajouter</Button>
            </form>
          </section>

          <section className="form-panel col-12 col-md-8">
            <div className="section-title">
              <h2>Generer des zones</h2>
            </div>
            <form onSubmit={handleZoneSubmit}>
              <div className="mb-3">
                <label className="form-label">Parking</label>
                <select
                  className="form-select"
                  value={zoneForm.parking}
                  onChange={(event) => setZoneForm((current) => ({ ...current, parking: event.target.value }))}
                  required
                >
                  <option value="">Choisir un parking</option>
                  {parkings.map((parking) => (
                    <option key={parking.id} value={parking.id}>{parking.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Type de vehicule</label>
                <select
                  className="form-select"
                  value={zoneForm.vehicle_type}
                  onChange={(event) => setZoneForm((current) => ({ ...current, vehicle_type: event.target.value }))}
                  required
                >
                  <option value="">Choisir un type</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Quantite"
                type="number"
                min="1"
                value={zoneForm.quantity}
                onChange={(event) => setZoneForm((current) => ({ ...current, quantity: event.target.value }))}
                required
              />

              <Button type="submit" className="w-100">
                Generer
              </Button>
            </form>
          </section>
          </div>
        </>
      )}

      <section className="content-section">
        <div className="section-title">
          <h2>Liste des parkings</h2>
        </div>

        <div className="type-filter-buttons" aria-label="Filtrer les parkings par type de vehicule">
          <button
            className={selectedTypeFilter === "all" ? "active" : ""}
            type="button"
            onClick={() => setSelectedTypeFilter("all")}
          >
            Tous
          </button>
          {types.map((type) => (
            <button
              className={String(selectedTypeFilter) === String(type.id) ? "active" : ""}
              key={type.id}
              type="button"
              onClick={() => setSelectedTypeFilter(type.id)}
            >
              {type.name}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState />
        ) : parkings.length === 0 ? (
          <EmptyState title="Aucun parking" text="Les parkings configures apparaitront ici." />
        ) : visibleParkings.length === 0 ? (
          <EmptyState title="Aucun parking pour ce type" text="Aucune zone n'est configuree pour ce type de vehicule." />
        ) : (
          <div className="parking-overview-list">
            {visibleParkings.map((parking) => {
              const parkingZones = zonesByParking[parking.id] || [];
              const stats = parkingStatsById[parking.id] || { total: 0, occupied: 0, available: 0 };
              const typeSummary = Object.entries(typeSummaryByParking[parking.id] || {});

              return (
              <article className="parking-overview" key={parking.id}>
                <div className="parking-overview-header">
                  <div className="parking-title-block">
                    <span className="soft-pill">
                      <i className="fa-solid fa-square-parking" />
                      Parking
                    </span>
                    <strong>{parking.name}</strong>
                    <span>{stats.total} zones configurees</span>
                  </div>

                  <div className="parking-summary">
                    <span className="status-pill status-exited">{stats.available} libres</span>
                    <span className="status-pill status-parked">{stats.occupied} occupees</span>
                  </div>

                  {isAdmin && (
                    <button className="icon-button danger" type="button" onClick={() => handleDeleteParking(parking.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  )}
                </div>

                {typeSummary.length > 0 && (
                  <div className="parking-type-summary">
                    {typeSummary.map(([typeName, total]) => (
                      <span key={typeName} className="soft-pill">
                        {typeName}: {total}
                      </span>
                    ))}
                  </div>
                )}

                {parkingZones.length > 0 ? (
                  <div className="parking-zone-board">
                    {parkingZones.map((zone) => {
                      const occupiedLocation = occupiedByZone[zone.id];

                      return (
                      <div
                        key={zone.id}
                        className={`parking-zone-tile ${occupiedLocation ? "occupied" : "available"}`}
                      >
                        <div>
                          <strong>{zone.name}</strong>
                          <span>{zone.vehicle_type_name}</span>
                        </div>

                        <span className="parking-zone-status">
                          {occupiedLocation ? occupiedLocation.vehicle_plaque : "Libre"}
                        </span>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteZone(zone.id)}
                            aria-label="Supprimer la zone"
                            title="Supprimer la zone"
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        )}
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <p className="muted-text">Aucune zone configuree.</p>
                )}
              </article>
            );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Parkings;
