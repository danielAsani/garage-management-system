# API Documentation

Base URL locale:

```txt
http://127.0.0.1:8001/api/
```

Toutes les routes applicatives sont protegees par JWT. Il faut envoyer:

```http
Authorization: Bearer <access_token>
```

## Auth

### Obtenir Un Token

```http
POST /api/token/
```

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

### Renouveler Un Token

```http
POST /api/token/refresh/
```

```json
{
  "refresh": "..."
}
```

## Permissions

| Ressource | ADMIN | AGENT |
|---|---|---|
| `/api/accounts/profiles/` | CRUD | Interdit |
| `/api/vehicles/types/` | CRUD | GET seulement |
| `/api/vehicles/vehicles/` | CRUD | GET, POST, PUT, PATCH |
| `/api/vehicles/photos/` | CRUD | CRUD |
| `/api/parkings/parkings/` | CRUD | GET seulement |
| `/api/parkings/zones/` | CRUD | GET seulement |
| `/api/locations/locations/` | CRUD | CRUD |
| `/api/payments/payments/` | CRUD | CRUD |

## Accounts

### Profils

```http
GET /api/accounts/profiles/
POST /api/accounts/profiles/
GET /api/accounts/profiles/{id}/
PUT /api/accounts/profiles/{id}/
PATCH /api/accounts/profiles/{id}/
DELETE /api/accounts/profiles/{id}/
```

Exemple:

```json
{
  "user": 1,
  "role": "AGENT"
}
```

## Vehicles

### Types

```http
GET /api/vehicles/types/
POST /api/vehicles/types/
```

```json
{
  "name": "Moto",
  "tarif_hours": "1000.00"
}
```

### Vehicules

```http
GET /api/vehicles/vehicles/
POST /api/vehicles/vehicles/
```

```json
{
  "plaque": "abc123",
  "vehicle_type": 1,
  "marque": "Toyota",
  "couleur": "Noir"
}
```

### Photos

```http
GET /api/vehicles/photos/
POST /api/vehicles/photos/
```

Avec `multipart/form-data`:

```txt
vehicle: 1
image: fichier image
```

## Parkings

### Parkings

```http
GET /api/parkings/parkings/
POST /api/parkings/parkings/
```

```json
{
  "name": "Parking Central"
}
```

### Zones

```http
GET /api/parkings/zones/
POST /api/parkings/zones/
```

```json
{
  "parking": 1,
  "vehicle_type": 1,
  "quantity": 5
}
```

La route `POST /api/parkings/zones/` cree plusieurs zones automatiquement.

## Locations

```http
GET /api/locations/locations/
POST /api/locations/locations/
```

```json
{
  "vehicle": 1,
  "nom_deposeur": "Jean",
  "telephone": "0810000000",
  "heure_entree": "2026-07-13T10:00:00Z",
  "statut": "PARKED"
}
```

## Payments

```http
GET /api/payments/payments/
POST /api/payments/payments/
```

```json
{
  "location": 1,
  "amount": "1000.00",
  "method": "CASH",
  "status": "PENDING"
}
```

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
