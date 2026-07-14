# Garage Management System - Backend

Backend Django REST Framework pour une application de gestion de parking/garage. L'API permet de gerer les vehicules, les types de vehicules, les parkings, les zones, les locations, les paiements et les profils utilisateurs avec authentification JWT.

## Fonctionnalites

- Authentification par JWT avec `access` et `refresh token`
- Roles utilisateurs: `ADMIN` et `AGENT`
- Permissions par role
- CRUD des vehicules
- Gestion des types de vehicules
- Gestion des parkings et des zones
- Generation automatique des zones de parking, par exemple `Moto-AAA`, `Moto-AAB`
- Gestion des locations de vehicules
- Gestion des paiements
- Reponses API enrichies avec des champs lisibles pour le frontend

## Stack

- Python
- Django
- Django REST Framework
- Simple JWT
- SQLite
- Pillow

## Structure

```txt
BACKEND/
|-- apps/
|   |-- accounts/
|   |-- locations/
|   |-- parkings/
|   |-- payments/
|   `-- vehicles/
|-- config/
|-- manage.py
|-- requirements.txt
`-- README.md
```

## Installation

Depuis le dossier `BACKEND`:

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

Base URL locale:

```txt
http://127.0.0.1:8001/api/
```

## Authentification JWT

Obtenir un token:

```http
POST /api/token/
```

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Reponse:

```json
{
  "refresh": "...",
  "access": "..."
}
```

Renouveler le token d'acces:

```http
POST /api/token/refresh/
```

```json
{
  "refresh": "..."
}
```

Pour appeler les routes protegees, ajouter le header:

```http
Authorization: Bearer <access_token>
```

## Roles Et Permissions

Le projet utilise deux roles:

```txt
ADMIN
AGENT
```

Regles principales:

| Ressource | ADMIN | AGENT |
|---|---|---|
| Profils utilisateurs | Tout | Aucun acces |
| Types de vehicules | Tout | Lecture seulement |
| Vehicules | Tout | Lire, creer, modifier |
| Photos de vehicules | Tout | Tout |
| Parkings | Tout | Lecture seulement |
| Zones de parking | Tout | Lecture seulement |
| Locations | Tout | Tout |
| Paiements | Tout | Tout |

Un utilisateur doit avoir un `UserProfile` associe pour que son role soit reconnu.

## Routes Principales

### Auth

| Methode | URL | Description |
|---|---|---|
| POST | `/api/token/` | Obtenir `access` et `refresh` |
| POST | `/api/token/refresh/` | Renouveler `access` |

### Accounts

| Methode | URL | Description |
|---|---|---|
| GET | `/api/accounts/profiles/` | Lister les profils |
| POST | `/api/accounts/profiles/` | Creer un profil |

### Vehicles

| Methode | URL | Description |
|---|---|---|
| GET | `/api/vehicles/types/` | Lister les types |
| POST | `/api/vehicles/types/` | Creer un type |
| GET | `/api/vehicles/vehicles/` | Lister les vehicules |
| POST | `/api/vehicles/vehicles/` | Creer un vehicule |
| GET | `/api/vehicles/photos/` | Lister les photos |
| POST | `/api/vehicles/photos/` | Ajouter une photo |

### Parkings

| Methode | URL | Description |
|---|---|---|
| GET | `/api/parkings/parkings/` | Lister les parkings |
| POST | `/api/parkings/parkings/` | Creer un parking |
| GET | `/api/parkings/zones/` | Lister les zones |
| POST | `/api/parkings/zones/` | Generer plusieurs zones |

### Locations

| Methode | URL | Description |
|---|---|---|
| GET | `/api/locations/locations/` | Lister les locations |
| POST | `/api/locations/locations/` | Creer une location |

### Payments

| Methode | URL | Description |
|---|---|---|
| GET | `/api/payments/payments/` | Lister les paiements |
| POST | `/api/payments/payments/` | Creer un paiement |

## Exemples JSON

Creer un type de vehicule:

```json
{
  "name": "Moto",
  "tarif_hours": "1000.00"
}
```

Creer un vehicule:

```json
{
  "plaque": "abc123",
  "vehicle_type": 1,
  "marque": "Toyota",
  "couleur": "Noir"
}
```

Generer des zones:

```json
{
  "parking": 1,
  "vehicle_type": 1,
  "quantity": 5
}
```

Exemple de resultat:

```txt
Moto-AAA
Moto-AAB
Moto-AAC
Moto-AAD
Moto-AAE
```

Creer une location:

```json
{
  "vehicle": 1,
  "nom_deposeur": "Jean",
  "telephone": "0810000000",
  "heure_entree": "2026-07-13T10:00:00Z",
  "statut": "PARKED"
}
```

Creer un paiement:

```json
{
  "location": 1,
  "amount": "1000.00",
  "method": "CASH",
  "status": "PENDING"
}
```

## Champs Lisibles

Les serializers ajoutent des champs en lecture seule pour faciliter l'affichage frontend:

- `vehicle_type_name`
- `parking_name`
- `vehicle_plaque`
- `vehicle_marque`
- `vehicle_couleur`
- `location_code`

Ces champs ne doivent pas etre envoyes dans les `POST`. Pour les relations, envoyer les ids.

## Verification

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Note: les tests automatises restent a enrichir.

## Publication GitHub

Ne pas publier:

- `env/`
- `db.sqlite3`
- `__pycache__/`
- fichiers `.env`

Le projet contient encore une configuration locale dans `settings.py`. Pour une mise en production, deplacer `SECRET_KEY`, `DEBUG` et `ALLOWED_HOSTS` vers des variables d'environnement.
