# API Documentation

Base URL locale:

```txt
http://127.0.0.1:8000/api/
```

Toutes les routes applicatives sont protegees par JWT, sauf `/api/token/` et `/api/token/refresh/`.

```http
Authorization: Bearer <access_token>
```

## Auth

```txt
POST /api/token/
POST /api/token/refresh/
```

## Accounts

```txt
GET    /api/accounts/me/
GET    /api/accounts/users/
POST   /api/accounts/users/
GET    /api/accounts/users/{id}/
PATCH  /api/accounts/users/{id}/
DELETE /api/accounts/users/{id}/
GET    /api/accounts/profiles/
```

Creation utilisateur:

```json
{
  "username": "agent1",
  "password": "mot_de_passe",
  "role": "AGENT",
  "is_active": true
}
```

## Vehicles

Types:

```txt
GET    /api/vehicles/types/
POST   /api/vehicles/types/
PATCH  /api/vehicles/types/{id}/
```

```json
{
  "name": "Moto",
  "tarif_hours": "1000.00"
}
```

Vehicules:

```txt
GET    /api/vehicles/vehicles/
POST   /api/vehicles/vehicles/
PATCH  /api/vehicles/vehicles/{id}/
```

```json
{
  "plaque": "abc123",
  "vehicle_type": 1,
  "marque": "Toyota",
  "couleur": "Noir"
}
```

Photos:

```txt
GET  /api/vehicles/photos/
POST /api/vehicles/photos/
```

`POST` utilise `multipart/form-data`:

```txt
vehicle: 1
image: fichier_image
```

## Parkings

Parkings:

```txt
GET    /api/parkings/parkings/
POST   /api/parkings/parkings/
PATCH  /api/parkings/parkings/{id}/
DELETE /api/parkings/parkings/{id}/
```

Zones:

```txt
GET    /api/parkings/zones/
POST   /api/parkings/zones/
DELETE /api/parkings/zones/{id}/
```

Generation automatique:

```json
{
  "parking": 1,
  "vehicle_type": 1,
  "quantity": 5
}
```

## Locations

```txt
GET   /api/locations/locations/
POST  /api/locations/locations/
PATCH /api/locations/locations/{id}/
```

Entree:

```json
{
  "vehicle": 1,
  "parking_zone": 1,
  "nom_deposeur": "Jean",
  "telephone": "0810000000",
  "heure_entree": "2026-07-15T10:00:00Z",
  "statut": "PARKED"
}
```

Sortie:

```json
{
  "statut": "EXITED",
  "heure_sortie": "2026-07-15T10:30:00Z"
}
```

## Payments

```txt
GET   /api/payments/payments/
POST  /api/payments/payments/
PATCH /api/payments/payments/{id}/
```

Creation:

```json
{
  "location": 1,
  "method": "CASH",
  "status": "PAID"
}
```

Paiement mobile money:

```json
{
  "location": 1,
  "method": "MPESA",
  "payment_identifier": "TX-12345",
  "status": "PAID"
}
```

`amount` est en lecture seule et calcule automatiquement cote backend selon le tarif horaire et la duree en minutes.

Les montants sont en francs congolais. Le minimum facture est `500 FC`.

Methodes:

```txt
CASH
ORANGE_MONEY
MPESA
AIRTEL_MONEY
ILLICOCASH
```

Statuts:

```txt
PENDING
PAID
FAILED
CANCELLED
```
