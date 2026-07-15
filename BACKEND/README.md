# Garage Management System - Backend

Backend Django REST Framework pour une application de gestion de parking. Il fournit une API JWT pour gerer les utilisateurs, vehicules, types de vehicules, parkings, zones, entrees/sorties, paiements et photos.

## Fonctionnalites

- Authentification JWT avec access token et refresh token
- Roles `ADMIN` et `AGENT`
- Gestion des utilisateurs par l'administrateur
- CRUD des vehicules et types de vehicules
- Photos de vehicules via upload multipart
- Creation des parkings et generation automatique des zones
- Entree et sortie des vehicules avec controle des emplacements occupes
- Paiement en francs congolais avec montant calcule automatiquement cote backend
- Identifiant obligatoire pour les paiements non cash
- Recu imprimable ou telechargeable cote frontend

## Stack

- Python
- Django
- Django REST Framework
- Simple JWT
- SQLite
- Pillow
- django-cors-headers

## Installation

Depuis `BACKEND`:

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Base URL locale:

```txt
http://127.0.0.1:8000/api/
```

## Configuration

Les variables disponibles sont dans `.env.example`:

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

Pour un depot public ou une mise en production, ne mets jamais la vraie cle secrete directement dans `settings.py`.

## Authentification

Obtenir un token:

```http
POST /api/token/
```

```json
{
  "username": "votre_username",
  "password": "votre_mot_de_passe"
}
```

Renouveler le token:

```http
POST /api/token/refresh/
```

Toutes les routes metier demandent:

```http
Authorization: Bearer <access_token>
```

## Roles Et Permissions

| Ressource | ADMIN | AGENT |
|---|---|---|
| Utilisateurs | CRUD | Interdit |
| Profils | CRUD | Interdit |
| Types de vehicules | CRUD | Lecture |
| Vehicules | CRUD | Lire, creer, modifier |
| Photos | CRUD | CRUD |
| Parkings | CRUD | Lecture |
| Zones | CRUD | Lecture |
| Locations | CRUD | CRUD |
| Paiements | CRUD | CRUD |

## Routes Principales

### Accounts

```txt
GET    /api/accounts/me/
GET    /api/accounts/users/
POST   /api/accounts/users/
PATCH  /api/accounts/users/{id}/
DELETE /api/accounts/users/{id}/
GET    /api/accounts/profiles/
```

### Vehicles

```txt
GET    /api/vehicles/types/
POST   /api/vehicles/types/
PATCH  /api/vehicles/types/{id}/
GET    /api/vehicles/vehicles/
POST   /api/vehicles/vehicles/
PATCH  /api/vehicles/vehicles/{id}/
GET    /api/vehicles/photos/
POST   /api/vehicles/photos/
```

### Parkings

```txt
GET    /api/parkings/parkings/
POST   /api/parkings/parkings/
GET    /api/parkings/zones/
POST   /api/parkings/zones/
DELETE /api/parkings/zones/{id}/
```

`POST /api/parkings/zones/` genere plusieurs zones automatiquement:

```json
{
  "parking": 1,
  "vehicle_type": 1,
  "quantity": 5
}
```

Exemple de noms generes:

```txt
Moto-AAA
Moto-AAB
Moto-AAC
```

### Locations

```txt
GET    /api/locations/locations/
POST   /api/locations/locations/
PATCH  /api/locations/locations/{id}/
```

Une location `PARKED` empeche:

- de garer deux fois le meme vehicule;
- d'occuper deux fois la meme zone;
- de choisir une zone incompatible avec le type du vehicule.

### Payments

```txt
GET    /api/payments/payments/
POST   /api/payments/payments/
PATCH  /api/payments/payments/{id}/
```

Le champ `amount` est calcule automatiquement cote backend en francs congolais avec:

```txt
tarif_horaire / 60 * minutes_facturees
```

Exemple: si 1h coute `1000`, alors 30 minutes coutent `500`.

Le montant minimum facture est `500 FC`. Si le calcul donne moins de `500 FC`, le paiement reste donc a `500 FC`.

Pour un paiement non cash, `payment_identifier` est obligatoire.

## Verification

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Note: les tests automatises sont encore a ajouter.

## Fichiers A Ne Pas Publier

Le `.gitignore` exclut notamment:

- `BACKEND/env/`
- `BACKEND/db.sqlite3`
- `BACKEND/.env`
- `BACKEND/media/`
- `FRONTEND/node_modules/`
- `FRONTEND/dist/`
- `FRONTEND/.env`
