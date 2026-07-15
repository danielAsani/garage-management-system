import { useEffect, useMemo, useState } from "react";
import CameraCapture from "../components/common/CameraCapture";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import api, { getAllPages, getErrorMessage, getMediaUrl } from "../services/api";

const emptyVehicleForm = {
  plaque: "",
  vehicle_type: "",
  marque: "",
  couleur: "",
};

const emptyTypeForm = {
  name: "",
  tarif_hours: "",
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} FC`;
}

function Vehicles() {
  const { isAdmin, isAgent } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canWriteVehicle = isAdmin || isAgent;
  const canDeleteVehicle = isAdmin;

  const photosByVehicle = useMemo(() => {
    return photos.reduce((acc, photo) => {
      acc[photo.vehicle] = acc[photo.vehicle] || [];
      acc[photo.vehicle].push(photo);
      return acc;
    }, {});
  }, [photos]);

  const loadData = async () => {
    const [vehiclesData, typesData, photosData] = await Promise.all([
      getAllPages("/vehicles/vehicles/"),
      getAllPages("/vehicles/types/"),
      getAllPages("/vehicles/photos/"),
    ]);

    setVehicles(vehiclesData);
    setTypes(typesData);
    setPhotos(photosData);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => {
      setError("Impossible de charger les vehicules.");
      setLoading(false);
    });
  }, []);

  const resetVehicleForm = () => {
    setVehicleForm(emptyVehicleForm);
    setSelectedPhotos([]);
    setEditingVehicle(null);
  };

  const resetTypeForm = () => {
    setTypeForm(emptyTypeForm);
    setEditingType(null);
  };

  const handleVehicleChange = (field, value) => {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  };

  const uploadPhotos = async (vehicleId) => {
    if (selectedPhotos.length === 0) {
      return;
    }

    await Promise.all(
      selectedPhotos.map((photo) => {
        const formData = new FormData();
        formData.append("vehicle", vehicleId);
        formData.append("image", photo);
        return api.post("/vehicles/photos/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      })
    );
  };

  const handleVehicleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...vehicleForm,
        vehicle_type: Number(vehicleForm.vehicle_type),
      };

      const response = editingVehicle
        ? await api.patch(`/vehicles/vehicles/${editingVehicle.id}/`, payload)
        : await api.post("/vehicles/vehicles/", payload);

      await uploadPhotos(response.data.id);
      await loadData();
      resetVehicleForm();
      setMessage(editingVehicle ? "Vehicule modifie avec succes." : "Vehicule enregistre avec succes.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer le vehicule."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      plaque: vehicle.plaque || "",
      vehicle_type: vehicle.vehicle_type || "",
      marque: vehicle.marque || "",
      couleur: vehicle.couleur || "",
    });
    setSelectedPhotos([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm("Supprimer ce vehicule ?")) {
      return;
    }

    try {
      await api.delete(`/vehicles/vehicles/${vehicleId}/`);
      await loadData();
      setMessage("Vehicule supprime.");
    } catch (err) {
      setError(getErrorMessage(err, "Suppression impossible."));
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await api.delete(`/vehicles/photos/${photoId}/`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de supprimer la photo."));
    }
  };

  const handleTypeSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingType) {
        await api.patch(`/vehicles/types/${editingType.id}/`, typeForm);
      } else {
        await api.post("/vehicles/types/", typeForm);
      }

      resetTypeForm();
      await loadData();
      setMessage(editingType ? "Tarif modifie." : "Type de vehicule ajoute.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer le type."));
    }
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name || "",
      tarif_hours: type.tarif_hours || "",
    });
  };

  return (
    <div>
      <PageHeader
        title="Vehicules"
        subtitle="Enregistrer les vehicules et joindre des photos si necessaire"
      />

      <Alert type="success" message={message} />
      <Alert message={error} />

      {canWriteVehicle && (
        <section className="form-panel">
          <div className="section-title">
            <h2>{editingVehicle ? "Modifier le vehicule" : "Nouveau vehicule"}</h2>
            {editingVehicle && (
              <button className="text-button" type="button" onClick={resetVehicleForm}>
                Annuler
              </button>
            )}
          </div>

          <form onSubmit={handleVehicleSubmit}>
            <Input
              label="Plaque"
              value={vehicleForm.plaque}
              onChange={(event) => handleVehicleChange("plaque", event.target.value)}
              placeholder="Ex: CGO-1234"
              required
            />

            <div className="mb-3">
              <label className="form-label">Type de vehicule</label>
              <select
                className="form-select"
                value={vehicleForm.vehicle_type}
                onChange={(event) => handleVehicleChange("vehicle_type", event.target.value)}
                required
              >
                <option value="">Choisir un type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {formatMoney(type.tarif_hours)}/h
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <Input
                  label="Marque"
                  value={vehicleForm.marque}
                  onChange={(event) => handleVehicleChange("marque", event.target.value)}
                  placeholder="Toyota, Honda..."
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="Couleur"
                  value={vehicleForm.couleur}
                  onChange={(event) => handleVehicleChange("couleur", event.target.value)}
                  placeholder="Noir, blanc..."
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Photos du vehicule</label>
              <CameraCapture photos={selectedPhotos} onChange={setSelectedPhotos} />
              <small className="form-text">Optionnel. Tu peux prendre plusieurs photos avant d'enregistrer.</small>
            </div>

            <Button type="submit" className="w-100" disabled={saving}>
              {saving ? "Enregistrement..." : editingVehicle ? "Modifier" : "Enregistrer"}
            </Button>
          </form>
        </section>
      )}

      {isAdmin && (
        <section className="form-panel compact-panel">
          <div className="section-title">
            <h2>{editingType ? "Modifier le tarif" : "Types de vehicules"}</h2>
            {editingType && (
              <button className="text-button" type="button" onClick={resetTypeForm}>
                Annuler
              </button>
            )}
          </div>
          <form className="inline-form" onSubmit={handleTypeSubmit}>
            <input
              className="form-control"
              value={typeForm.name}
              onChange={(event) => setTypeForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Moto"
              required
            />
            <input
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              value={typeForm.tarif_hours}
              onChange={(event) => setTypeForm((current) => ({ ...current, tarif_hours: event.target.value }))}
              placeholder="Tarif/h"
              required
            />
            <Button type="submit">{editingType ? "Modifier" : "Ajouter"}</Button>
          </form>

          {types.length > 0 && (
            <div className="type-rate-list">
              {types.map((type) => (
                <article className="type-rate-item" key={type.id}>
                  <div>
                    <strong>{type.name}</strong>
                    <span>{formatMoney(type.tarif_hours)}/h</span>
                  </div>
                  <Button variant="outline-primary" onClick={() => handleEditType(type)}>
                    Modifier
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="content-section">
        <div className="section-title">
          <h2>Liste des vehicules</h2>
        </div>

        {loading ? (
          <LoadingState />
        ) : vehicles.length === 0 ? (
          <EmptyState title="Aucun vehicule" text="Les vehicules enregistres apparaitront ici." />
        ) : (
          <div className="item-grid">
            {vehicles.map((vehicle) => (
              <article className="vehicle-card" key={vehicle.id}>
                <div className="vehicle-card-main">
                  <div>
                    <strong>{vehicle.plaque}</strong>
                    <span>{vehicle.vehicle_type_name}</span>
                  </div>
                  <span className="soft-pill">{vehicle.couleur || "Couleur -"}</span>
                </div>

                <dl className="meta-grid">
                  <div>
                    <dt>Marque</dt>
                    <dd>{vehicle.marque || "-"}</dd>
                  </div>
                  <div>
                    <dt>Photos</dt>
                    <dd>{photosByVehicle[vehicle.id]?.length || 0}</dd>
                  </div>
                </dl>

                {photosByVehicle[vehicle.id]?.length > 0 && (
                  <div className="photo-strip">
                    {photosByVehicle[vehicle.id].map((photo) => (
                      <div className="photo-thumb" key={photo.id}>
                        <img src={getMediaUrl(photo.image)} alt={`Vehicule ${vehicle.plaque}`} />
                        {(isAdmin || isAgent) && (
                          <button type="button" onClick={() => handleDeletePhoto(photo.id)} aria-label="Supprimer la photo">
                            <i className="fa-solid fa-xmark" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="card-actions">
                  {canWriteVehicle && (
                    <Button variant="outline-primary" onClick={() => handleEdit(vehicle)}>
                      Modifier
                    </Button>
                  )}
                  {canDeleteVehicle && (
                    <Button variant="outline-danger" onClick={() => handleDeleteVehicle(vehicle.id)}>
                      Supprimer
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Vehicles;
