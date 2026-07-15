import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import CameraCapture from "../components/common/CameraCapture";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api, { getAllPages, getErrorMessage, getMediaUrl, getPageData } from "../services/api";

const methods = [
  ["CASH", "Cash"],
  ["ORANGE_MONEY", "Orange Money"],
  ["MPESA", "M-Pesa"],
  ["AIRTEL_MONEY", "Airtel Money"],
  ["ILLICOCASH", "Illicocash"],
];

const MINIMUM_PAYMENT_AMOUNT = 500;

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} FC`;
}

const emptyEntryForm = {
  plaque: "",
  vehicle_type: "",
  marque: "",
  couleur: "",
  nom_deposeur: "",
  telephone: "",
  parking: "",
  parking_zone: "",
};

const emptyExitForm = {
  search: "",
  amount: "",
  method: "CASH",
  payment_identifier: "",
};

function toDateTimeLocal(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function samePlate(left, right) {
  return left?.trim().toUpperCase() === right?.trim().toUpperCase();
}

function calculateParkingAmount(location, vehicles, types) {
  if (!location) {
    return null;
  }

  const vehicle = vehicles.find((item) => item.id === location.vehicle);
  const vehicleType = types.find((item) => item.id === vehicle?.vehicle_type);
  const hourlyRate = Number(vehicleType?.tarif_hours || 0);

  if (!hourlyRate) {
    return null;
  }

  const entryDate = new Date(location.heure_entree);
  const endDate = location.heure_sortie ? new Date(location.heure_sortie) : new Date();
  const durationMs = Math.max(0, endDate.getTime() - entryDate.getTime());
  const billedMinutes = Math.max(1, Math.ceil(durationMs / 60000));
  const rawAmount = (hourlyRate / 60) * billedMinutes;
  const amount = Math.max(rawAmount, MINIMUM_PAYMENT_AMOUNT);

  return {
    hourlyRate,
    billedMinutes,
    amount: amount.toFixed(2),
    vehicleTypeName: vehicleType.name,
  };
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function getReceiptRows({ location, payment }) {
  const paidAt = payment?.paid_at ? formatDateTime(payment.paid_at) : new Date().toLocaleString();

  return [
    ["Code", location.code],
    ["Plaque", location.vehicle_plaque],
    ["Parking", location.parking_name || "-"],
    ["Place", location.parking_zone_name || "-"],
    ["Entree", formatDateTime(location.heure_entree)],
    ["Sortie", formatDateTime(location.heure_sortie)],
    ["Methode", payment.method],
    ["Identifiant", payment.payment_identifier || "-"],
    ["Total", formatMoney(payment.amount)],
    ["Paye le", paidAt],
  ];
}

function printReceipt({ location, payment }) {
  const receiptWindow = window.open("", "_blank", "width=360,height=640");

  if (!receiptWindow) {
    return false;
  }

  const rows = getReceiptRows({ location, payment });

  receiptWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Recu ${location.code}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          * { box-sizing: border-box; }
          body {
            width: 72mm;
            margin: 0 auto;
            color: #111;
            font-family: "Courier New", monospace;
            font-size: 11px;
          }
          .center { text-align: center; }
          h1 { font-size: 15px; margin: 0 0 3mm; }
          .line { border-top: 1px dashed #111; margin: 3mm 0; }
          .row { display: flex; justify-content: space-between; gap: 4mm; margin: 1.5mm 0; }
          .row span:last-child { text-align: right; font-weight: 700; }
          .total { font-size: 14px; font-weight: 700; }
          @media print {
            body { width: 72mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>GARAGE MANAGER</h1>
          <div>RECU DE PARKING</div>
        </div>
        <div class="line"></div>
        ${rows.slice(0, 6).map(([label, value]) => `<div class="row"><span>${label}</span><span>${value}</span></div>`).join("")}
        <div class="line"></div>
        ${rows.slice(6).map(([label, value]) => `<div class="row ${label === "Total" ? "total" : ""}"><span>${label}</span><span>${value}</span></div>`).join("")}
        <div class="line"></div>
        <div class="center">Merci et bonne route</div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  receiptWindow.document.close();
  return true;
}

function downloadReceipt({ location, payment }) {
  const rows = getReceiptRows({ location, payment });
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 160],
  });

  let y = 10;

  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.text("GARAGE MANAGER", 40, y, { align: "center" });

  y += 6;
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.text("RECU DE PARKING", 40, y, { align: "center" });

  y += 6;
  doc.line(5, y, 75, y);
  y += 6;

  rows.forEach(([label, value], index) => {
    if (index === 6) {
      y += 2;
      doc.line(5, y, 75, y);
      y += 6;
    }

    doc.setFont("courier", label === "Total" ? "bold" : "normal");
    doc.setFontSize(label === "Total" ? 11 : 9);
    doc.text(String(label), 6, y);
    doc.text(String(value), 74, y, { align: "right", maxWidth: 42 });
    y += label === "Total" ? 7 : 6;
  });

  y += 1;
  doc.line(5, y, 75, y);
  y += 7;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text("Merci et bonne route", 40, y, { align: "center" });

  doc.save(`recu-${location.code}.pdf`);
}

function Operations() {
  const [activeTab, setActiveTab] = useState("entry");
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [zones, setZones] = useState([]);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [entryPhotos, setEntryPhotos] = useState([]);
  const [exitForm, setExitForm] = useState(emptyExitForm);
  const [exitTarget, setExitTarget] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationPhotos, setSelectedLocationPhotos] = useState([]);
  const [loadingLocationPhotos, setLoadingLocationPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const [vehiclesData, typesData, parkedLocationsData, exitedLocationsData, paymentsData, parkingsData, zonesData] =
      await Promise.all([
        getAllPages("/vehicles/vehicles/"),
        getAllPages("/vehicles/types/"),
        getAllPages("/locations/locations/?statut=PARKED"),
        getPageData("/locations/locations/?statut=EXITED&limit=10"),
        getPageData("/payments/payments/?limit=100"),
        getAllPages("/parkings/parkings/"),
        getAllPages("/parkings/zones/"),
      ]);

    setVehicles(vehiclesData);
    setTypes(typesData);
    setLocations([...parkedLocationsData, ...exitedLocationsData.results]);
    setPayments(paymentsData.results);
    setParkings(parkingsData);
    setZones(zonesData);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => {
      setError("Impossible de charger les operations.");
      setLoading(false);
    });
  }, []);

  const parkedLocations = useMemo(
    () => locations.filter((location) => location.statut === "PARKED"),
    [locations]
  );

  const exitedLocations = useMemo(
    () => locations.filter((location) => location.statut === "EXITED"),
    [locations]
  );

  const occupiedZoneIds = useMemo(
    () => new Set(parkedLocations.map((location) => location.parking_zone).filter(Boolean)),
    [parkedLocations]
  );

  const existingVehicle = useMemo(
    () => vehicles.find((vehicle) => samePlate(vehicle.plaque, entryForm.plaque)),
    [vehicles, entryForm.plaque]
  );

  const vehicleHistory = useMemo(() => {
    if (!entryForm.plaque) {
      return [];
    }

    return locations.filter((location) => samePlate(location.vehicle_plaque, entryForm.plaque));
  }, [locations, entryForm.plaque]);

  const selectedVehicleType = entryForm.vehicle_type || existingVehicle?.vehicle_type || "";

  const filteredParkings = useMemo(() => {
    if (!selectedVehicleType) {
      return [];
    }

    const parkingIds = new Set(
      zones
        .filter((zone) => String(zone.vehicle_type) === String(selectedVehicleType))
        .map((zone) => zone.parking)
    );

    return parkings.filter((parking) => parkingIds.has(parking.id));
  }, [parkings, zones, selectedVehicleType]);

  const selectedParkingZones = useMemo(
    () => zones.filter(
      (zone) =>
        String(zone.parking) === String(entryForm.parking) &&
        String(zone.vehicle_type) === String(selectedVehicleType)
    ),
    [zones, entryForm.parking, selectedVehicleType]
  );

  const canSubmitEntry =
    Boolean(entryForm.parking_zone) &&
    (Boolean(existingVehicle) || Boolean(entryForm.vehicle_type));

  const paymentByLocation = useMemo(() => {
    return payments.reduce((acc, payment) => {
      acc[payment.location] = payment;
      return acc;
    }, {});
  }, [payments]);

  const exitCalculation = useMemo(
    () => calculateParkingAmount(exitTarget, vehicles, types),
    [exitTarget, vehicles, types]
  );

  const selectedLocationCalculation = useMemo(
    () => calculateParkingAmount(selectedLocation, vehicles, types),
    [selectedLocation, vehicles, types]
  );

  const selectedLocationPayment = selectedLocation ? paymentByLocation[selectedLocation.id] : null;

  const parkingStats = (parkingId) => {
    const parkingZones = zones.filter(
      (zone) =>
        zone.parking === parkingId &&
        String(zone.vehicle_type) === String(selectedVehicleType)
    );
    const used = parkingZones.filter((zone) => occupiedZoneIds.has(zone.id)).length;

    return {
      total: parkingZones.length,
      used,
      available: parkingZones.length - used,
    };
  };

  const handleEntryChange = (field, value) => {
    setEntryForm((current) => ({ ...current, [field]: value }));
  };

  const handlePlateChange = (value) => {
    const plaque = value.toUpperCase();
    const foundVehicle = vehicles.find((vehicle) => samePlate(vehicle.plaque, plaque));

    setEntryForm((current) => ({
      ...current,
      plaque,
      vehicle_type: foundVehicle?.vehicle_type || current.vehicle_type,
      parking: foundVehicle?.vehicle_type && String(foundVehicle.vehicle_type) !== String(current.vehicle_type) ? "" : current.parking,
      parking_zone: foundVehicle?.vehicle_type && String(foundVehicle.vehicle_type) !== String(current.vehicle_type) ? "" : current.parking_zone,
      marque: foundVehicle?.marque || current.marque,
      couleur: foundVehicle?.couleur || current.couleur,
    }));
  };

  const handleVehicleTypeChange = (value) => {
    setEntryForm((current) => ({
      ...current,
      vehicle_type: value,
      parking: "",
      parking_zone: "",
    }));
  };

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

  const createOrGetVehicle = async () => {
    if (existingVehicle) {
      return existingVehicle;
    }

    const response = await api.post("/vehicles/vehicles/", {
      plaque: entryForm.plaque,
      vehicle_type: Number(entryForm.vehicle_type),
      marque: entryForm.marque,
      couleur: entryForm.couleur,
    });

    return response.data;
  };

  const uploadVehiclePhotos = async (vehicleId) => {
    if (entryPhotos.length === 0) {
      return;
    }

    await Promise.all(
      entryPhotos.map((photo) => {
        const formData = new FormData();
        formData.append("vehicle", vehicleId);
        formData.append("image", photo);

        return api.post("/vehicles/photos/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      })
    );
  };

  const resetEntryForm = () => {
    setEntryForm(emptyEntryForm);
    setEntryPhotos([]);
  };

  const handleEntrySubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const vehicle = await createOrGetVehicle();
      await uploadVehiclePhotos(vehicle.id);

      await api.post("/locations/locations/", {
        vehicle: vehicle.id,
        parking_zone: Number(entryForm.parking_zone),
        nom_deposeur: entryForm.nom_deposeur,
        telephone: entryForm.telephone || null,
        heure_entree: toDateTimeLocal(),
        statut: "PARKED",
      });

      await loadData();
      resetEntryForm();
      setMessage("Vehicule gare avec succes.");
    } catch (err) {
      setError(err.response ? getErrorMessage(err, "Impossible d'enregistrer l'entree.") : err.message);
    } finally {
      setSaving(false);
    }
  };

  const searchExitTarget = () => {
    const query = exitForm.search.trim().toUpperCase();
    const found = parkedLocations.find(
      (location) => samePlate(location.vehicle_plaque, query) || samePlate(location.code, query)
    );

    setExitTarget(found || null);

    if (!found) {
      setError("Aucun vehicule actuellement gare avec ce code ou cette plaque.");
      return;
    }

    const calculation = calculateParkingAmount(found, vehicles, types);

    setExitForm((current) => ({
      ...current,
      amount: calculation?.amount || "",
    }));
    setError(calculation ? "" : "Impossible de calculer le montant: tarif horaire introuvable.");
  };

  const finalizeExit = async (event) => {
    event.preventDefault();

    if (!exitTarget) {
      setError("Recherche d'abord le vehicule a sortir.");
      return;
    }

    const finalCalculation = calculateParkingAmount(exitTarget, vehicles, types);

    if (!finalCalculation) {
      setError("Impossible de calculer le montant a payer.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const existingPayment = paymentByLocation[exitTarget.id];
      const paymentPayload = {
        location: exitTarget.id,
        method: exitForm.method,
        payment_identifier: exitForm.method === "CASH" ? "" : exitForm.payment_identifier,
        status: "PAID",
      };

      let paymentResponse;
      if (existingPayment) {
        paymentResponse = await api.patch(`/payments/payments/${existingPayment.id}/`, paymentPayload);
      } else {
        paymentResponse = await api.post("/payments/payments/", paymentPayload);
      }

      const locationResponse = await api.patch(`/locations/locations/${exitTarget.id}/`, {
        statut: "EXITED",
        heure_sortie: toDateTimeLocal(),
      });

      await loadData();
      setLastReceipt({
        location: locationResponse.data,
        payment: paymentResponse.data,
      });
      setExitForm(emptyExitForm);
      setExitTarget(null);
      setMessage("Paiement valide et sortie finalisee.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de finaliser la sortie."));
    } finally {
      setSaving(false);
    }
  };

  const renderParkingCards = () => (
    <div className="parking-choice-grid">
      {filteredParkings.map((parking) => {
        const stats = parkingStats(parking.id);
        const active = String(entryForm.parking) === String(parking.id);

        return (
          <button
            className={`parking-choice ${active ? "active" : ""}`}
            key={parking.id}
            type="button"
            onClick={() => setEntryForm((current) => ({ ...current, parking: parking.id, parking_zone: "" }))}
          >
            <strong>{parking.name}</strong>
            <span>{stats.available} libres / {stats.total}</span>
            <div className="progress parking-progress">
              <div
                className="progress-bar"
                style={{ width: `${stats.total ? (stats.used / stats.total) * 100 : 0}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderZoneChoices = () => (
    <div className="zone-choice-grid">
      {selectedParkingZones.map((zone) => {
        const occupied = occupiedZoneIds.has(zone.id);
        const disabled = occupied;
        const active = String(entryForm.parking_zone) === String(zone.id);

        return (
          <button
            className={`zone-choice ${active ? "active" : ""} ${occupied ? "occupied" : ""}`}
            disabled={disabled}
            key={zone.id}
            type="button"
            onClick={() => handleEntryChange("parking_zone", zone.id)}
          >
            <strong>{zone.name}</strong>
            <span>{occupied ? "Occupe" : "Disponible"}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Operations"
        subtitle="Gerer les entrees, sorties, emplacements et paiements"
      />

      <Alert type="success" message={message} />
      <Alert message={error} />

      <div className="operation-tabs">
        <button className={activeTab === "entry" ? "active" : ""} type="button" onClick={() => setActiveTab("entry")}>
          <i className="fa-solid fa-arrow-right-to-bracket" />
          Entrer
        </button>
        <button className={activeTab === "exit" ? "active" : ""} type="button" onClick={() => setActiveTab("exit")}>
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Sortie
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {activeTab === "entry" && (
            <section className="form-panel">
              <div className="section-title">
                <h2>Entrer un vehicule</h2>
              </div>

              <form onSubmit={handleEntrySubmit}>
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Type de vehicule</label>
                    <select
                      className="form-select mb-3"
                      value={selectedVehicleType}
                      onChange={(event) => handleVehicleTypeChange(event.target.value)}
                      disabled={Boolean(existingVehicle)}
                      required
                    >
                      <option value="">Choisir</option>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Plaque"
                  value={entryForm.plaque}
                  onChange={(event) => handlePlateChange(event.target.value)}
                  placeholder="Ex: CGO-1234"
                  required
                />

                {entryForm.plaque && (
                  <div className={`lookup-box ${existingVehicle ? "found" : ""}`}>
                    <strong>{existingVehicle ? "Vehicule deja connu" : "Nouveau vehicule"}</strong>
                    <span>
                      {existingVehicle && `${existingVehicle.plaque} - ${existingVehicle.vehicle_type_name}`}
                      {!existingVehicle && "Aucun vehicule trouve. Complete les informations pour l'enregistrer."}
                    </span>
                    {vehicleHistory.length > 0 && (
                      <small>{vehicleHistory.length} passage(s) trouve(s) dans l'historique.</small>
                    )}
                  </div>
                )}

                {!existingVehicle && entryForm.plaque && (
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <Input
                        label="Marque"
                        value={entryForm.marque}
                        onChange={(event) => handleEntryChange("marque", event.target.value)}
                        disabled={Boolean(existingVehicle)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <Input
                        label="Couleur"
                        value={entryForm.couleur}
                        onChange={(event) => handleEntryChange("couleur", event.target.value)}
                        disabled={Boolean(existingVehicle)}
                      />
                    </div>
                  </div>
                )}

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <Input
                      label="Nom du deposeur"
                      value={entryForm.nom_deposeur}
                      onChange={(event) => handleEntryChange("nom_deposeur", event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Telephone"
                      type="tel"
                      value={entryForm.telephone}
                      onChange={(event) => handleEntryChange("telephone", event.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Photos du vehicule</label>
                  <CameraCapture photos={entryPhotos} onChange={setEntryPhotos} />
                  <small className="form-text">Optionnel. Tu peux prendre plusieurs photos directement ici.</small>
                </div>

                <div className="section-title mt-2">
                  <h2>Choisir le parking</h2>
                </div>
                {!selectedVehicleType ? (
                  <EmptyState title="Choisis d'abord le type" text="Les parkings disponibles seront filtres selon le type de vehicule." />
                ) : parkings.length === 0 ? (
                  <EmptyState title="Aucun parking" text="Configure d'abord les parkings et zones." />
                ) : filteredParkings.length === 0 ? (
                  <EmptyState title="Aucun parking compatible" text="Aucun parking n'a encore de zones pour ce type de vehicule." />
                ) : (
                  renderParkingCards()
                )}

                {entryForm.parking && (
                  <>
                    <div className="section-title mt-3">
                      <h2>Choisir l'emplacement</h2>
                    </div>
                    {selectedParkingZones.length === 0 ? (
                      <EmptyState title="Aucun emplacement compatible" text="Ce parking n'a pas de zones pour ce type de vehicule." />
                    ) : (
                      renderZoneChoices()
                    )}
                  </>
                )}

                <Button type="submit" className="w-100 mt-3" disabled={saving || !canSubmitEntry}>
                  {saving ? "Enregistrement..." : "Garer le vehicule"}
                </Button>
              </form>
            </section>
          )}

          {activeTab === "exit" && (
            <section className="form-panel">
              <div className="section-title">
                <h2>Sortir un vehicule</h2>
              </div>

              <form onSubmit={finalizeExit}>
                <div className="search-line">
                  <Input
                    label="Code ou plaque"
                    value={exitForm.search}
                    onChange={(event) => setExitForm((current) => ({ ...current, search: event.target.value }))}
                    placeholder="LOC... ou plaque"
                    required
                  />
                  <Button type="button" variant="outline-primary" onClick={searchExitTarget}>
                    Rechercher
                  </Button>
                </div>

                {exitTarget && (
                  <article className="data-card exit-target-card">
                    <div className="data-card-header">
                      <div>
                        <strong>{exitTarget.vehicle_plaque}</strong>
                        <span>{exitTarget.code}</span>
                      </div>
                      <span className="status-pill status-parked">GARE</span>
                    </div>
                    <dl className="meta-grid">
                      <div>
                        <dt>Parking</dt>
                        <dd>{exitTarget.parking_name || "-"}</dd>
                      </div>
                      <div>
                        <dt>Emplacement</dt>
                        <dd>{exitTarget.parking_zone_name || "-"}</dd>
                      </div>
                      <div>
                        <dt>Deposeur</dt>
                        <dd>{exitTarget.nom_deposeur}</dd>
                      </div>
                      <div>
                        <dt>Entree</dt>
                        <dd>{new Date(exitTarget.heure_entree).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt>Tarif</dt>
                        <dd>{exitCalculation ? `${formatMoney(exitCalculation.hourlyRate)}/h` : "-"}</dd>
                      </div>
                      <div>
                        <dt>Duree facturee</dt>
                        <dd>{exitCalculation ? `${exitCalculation.billedMinutes} min` : "-"}</dd>
                      </div>
                    </dl>
                  </article>
                )}

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <Input
                      label="Montant a payer"
                      type="text"
                      value={exitCalculation ? formatMoney(exitCalculation.amount) : formatMoney(exitForm.amount)}
                      onChange={() => {}}
                      disabled
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Methode</label>
                    <select
                      className="form-select mb-3"
                      value={exitForm.method}
                      onChange={(event) => setExitForm((current) => ({
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
                </div>

                {exitForm.method !== "CASH" && (
                  <Input
                    label="Identifiant de transaction"
                    value={exitForm.payment_identifier}
                    onChange={(event) => setExitForm((current) => ({
                      ...current,
                      payment_identifier: event.target.value,
                    }))}
                    placeholder="Ex: transaction mobile money"
                    required
                  />
                )}

                <Button type="submit" className="w-100" disabled={saving || !exitTarget || !exitCalculation}>
                  {saving ? "Finalisation..." : "Payer et finaliser la sortie"}
                </Button>
              </form>

              {lastReceipt && (
                <div className="receipt-action">
                  <Button type="button" variant="outline-primary" onClick={() => printReceipt(lastReceipt)}>
                    Imprimer le recu
                  </Button>
                  <Button type="button" variant="primary" onClick={() => downloadReceipt(lastReceipt)}>
                    Telecharger le recu
                  </Button>
                </div>
              )}
            </section>
          )}

          <section className="content-section">
            <div className="section-title">
              <h2>Vehicules gares</h2>
            </div>
            {parkedLocations.length === 0 ? (
              <EmptyState title="Aucun vehicule gare" text="Les vehicules presents apparaitront ici." />
            ) : (
              <div className="item-list">
                {parkedLocations.map((location) => (
                  <article
                    className="data-card location-click-card"
                    key={location.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLocationDetail(location)}
                    onKeyDown={(event) => handleLocationCardKeyDown(event, location)}
                  >
                    <div className="data-card-header">
                      <div>
                        <strong>{location.vehicle_plaque}</strong>
                        <span>{location.code}</span>
                      </div>
                      <span className="status-pill status-parked">GARE</span>
                    </div>
                    <dl className="meta-grid">
                      <div>
                        <dt>Parking</dt>
                        <dd>{location.parking_name || "-"}</dd>
                      </div>
                      <div>
                        <dt>Emplacement</dt>
                        <dd>{location.parking_zone_name || "-"}</dd>
                      </div>
                      <div>
                        <dt>Deposeur</dt>
                        <dd>{location.nom_deposeur}</dd>
                      </div>
                      <div>
                        <dt>Entree</dt>
                        <dd>{formatDateTime(location.heure_entree)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="content-section">
            <div className="section-title">
              <h2>Vehicules sortis</h2>
            </div>
            {exitedLocations.length === 0 ? (
              <EmptyState title="Aucune sortie" text="Les sorties finalisees apparaitront ici." />
            ) : (
              <div className="item-list">
                {exitedLocations.slice(0, 10).map((location) => (
                  <article
                    className="data-card location-click-card"
                    key={location.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLocationDetail(location)}
                    onKeyDown={(event) => handleLocationCardKeyDown(event, location)}
                  >
                    <div className="data-card-header">
                      <div>
                        <strong>{location.vehicle_plaque}</strong>
                        <span>{location.code}</span>
                      </div>
                      <span className="status-pill status-exited">SORTI</span>
                    </div>
                    <dl className="meta-grid">
                      <div>
                        <dt>Sortie</dt>
                        <dd>{formatDateTime(location.heure_sortie)}</dd>
                      </div>
                      <div>
                        <dt>Paiement</dt>
                        <dd>{formatMoney(paymentByLocation[location.id]?.amount)}</dd>
                      </div>
                      <div>
                        <dt>Identifiant</dt>
                        <dd>{paymentByLocation[location.id]?.payment_identifier || "-"}</dd>
                      </div>
                    </dl>
                    {paymentByLocation[location.id] && (
                      <div className="card-actions">
                        <Button
                          type="button"
                          variant="outline-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            printReceipt({
                            location,
                            payment: paymentByLocation[location.id],
                            });
                          }}
                        >
                          Imprimer recu
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            downloadReceipt({
                            location,
                            payment: paymentByLocation[location.id],
                            });
                          }}
                        >
                          Telecharger recu
                        </Button>
                      </div>
                    )}
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
                aria-labelledby="locationDetailTitle"
                style={{ display: "block" }}
                tabIndex="-1"
              >
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                  <div className="modal-content location-detail-modal">
                    <div className="modal-header">
                      <div>
                        <h2 className="modal-title fs-5" id="locationDetailTitle">
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
                        <div>
                          <dt>Duree facturee</dt>
                          <dd>{selectedLocationCalculation ? `${selectedLocationCalculation.billedMinutes} min` : "-"}</dd>
                        </div>
                        <div>
                          <dt>Tarif</dt>
                          <dd>{selectedLocationCalculation ? `${formatMoney(selectedLocationCalculation.hourlyRate)}/h` : "-"}</dd>
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

                      <section className="location-payment-detail">
                        <div className="section-title">
                          <h2>Paiement</h2>
                        </div>
                        <dl className="meta-grid location-detail-grid">
                          <div>
                            <dt>Montant</dt>
                            <dd>
                              {selectedLocationPayment
                                ? formatMoney(selectedLocationPayment.amount)
                                : formatMoney(selectedLocationCalculation?.amount)}
                            </dd>
                          </div>
                          <div>
                            <dt>Statut</dt>
                            <dd>{selectedLocationPayment?.status || "Non cree"}</dd>
                          </div>
                          <div>
                            <dt>Methode</dt>
                            <dd>{selectedLocationPayment?.method || "-"}</dd>
                          </div>
                          <div>
                            <dt>Identifiant</dt>
                            <dd>{selectedLocationPayment?.payment_identifier || "-"}</dd>
                          </div>
                          <div>
                            <dt>Paye le</dt>
                            <dd>{formatDateTime(selectedLocationPayment?.paid_at)}</dd>
                          </div>
                        </dl>
                      </section>
                    </div>

                    <div className="modal-footer">
                      {selectedLocationPayment && (
                        <>
                          <Button
                            type="button"
                            variant="outline-primary"
                            onClick={() => printReceipt({
                              location: selectedLocation,
                              payment: selectedLocationPayment,
                            })}
                          >
                            Imprimer recu
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => downloadReceipt({
                              location: selectedLocation,
                              payment: selectedLocationPayment,
                            })}
                          >
                            Telecharger recu
                          </Button>
                        </>
                      )}
                      <Button type="button" variant="outline-secondary" onClick={() => setSelectedLocation(null)}>
                        Fermer
                      </Button>
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

export default Operations;
