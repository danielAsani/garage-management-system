# Parking Management API

Backend Django REST Framework pour gerer un systeme de parking: vehicules, types de vehicules, parkings, zones de parking, locations et paiements.

## Vue D'ensemble

Ce projet expose une API REST permettant de:

- creer des types de vehicules, par exemple `Moto`, `Voiture`, `Bus`;
- enregistrer des vehicules avec leur plaque, marque, couleur et type;
- creer des parkings;
- generer automatiquement plusieurs zones de parking;
- enregistrer les entrees et sorties de vehicules;
- enregistrer les paiements lies aux locations;
- exposer des donnees lisibles pour le frontend, comme `vehicle_type_name`, `parking_name`, `vehicle_plaque`, etc.

## Stack Technique

- Python
- Django
- Django REST Framework
- SQLite
- Pillow pour les champs image

Dependances utilisees dans l'environnement actuel:

```txt
asgiref==3.11.1
Django==6.0.7
djangorestframework==3.17.1
pillow==12.3.0
sqlparse==0.5.5
tzdata==2026.3
```

## Structure Du Projet

```txt
BACKEND/
|-- apps/
|   |-- accounts/
|   |-- locations/
|   |-- parkings/
|   |-- payments/
|   `-- vehicles/
|-- config/
|   |-- settings.py
|   `-- urls.py
|-- manage.py
`-- db.sqlite3
```

## Installation Locale

Depuis le dossier du projet:

```powershell
cd C:\Users\HP\Desktop\PROJETL2\BACKEND
```

Creer un environnement virtuel:

```powershell
python -m venv env
```

Activer l'environnement:

```powershell
.\env\Scripts\Activate.ps1
```

Installer les dependances:

```powershell
python -m pip install Django djangorestframework Pillow
```

Appliquer les migrations:

```powershell
python manage.py migrate
```

Lancer le serveur:

```powershell
python manage.py runserver 8001
```

Base URL locale:

```txt
http://127.0.0.1:8001/api/
```

## Routes API

### Accounts

| Methode | URL | Description |
|---|---|---|
| GET | `/api/accounts/posts/` | Lister les postes |
| POST | `/api/accounts/posts/` | Creer un poste |
| GET | `/api/accounts/profiles/` | Lister les profils utilisateurs |
| POST | `/api/accounts/profiles/` | Creer un profil utilisateur |

### Vehicles

| Methode | URL | Description |
|---|---|---|
| GET | `/api/vehicles/types/` | Lister les types de vehicules |
| POST | `/api/vehicles/types/` | Creer un type de vehicule |
| GET | `/api/vehicles/vehicles/` | Lister les vehicules |
| POST | `/api/vehicles/vehicles/` | Creer un vehicule |
| GET | `/api/vehicles/photos/` | Lister les photos de vehicules |
| POST | `/api/vehicles/photos/` | Ajouter une photo de vehicule |

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

## Exemples De Requetes

### Creer Un Type De Vehicule

```http
POST /api/vehicles/types/
```

```json
{
  "name": "Moto",
  "tarif_hours": "1000.00"
}
```

### Creer Un Vehicule

```http
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

La plaque est normalisee cote backend avec `upper().strip()`.

### Creer Un Parking

```http
POST /api/parkings/parkings/
```

```json
{
  "name": "Parking Central"
}
```

### Generer Des Zones De Parking

```http
POST /api/parkings/zones/
```

```json
{
  "parking": 1,
  "vehicle_type": 1,
  "quantity": 5
}
```

Exemple de zones generees:

```txt
Moto-AAA
Moto-AAB
Moto-AAC
Moto-AAD
Moto-AAE
```

Le backend:

1. recupere le parking;
2. recupere le type de vehicule;
3. lit la quantite demandee;
4. compte les zones existantes pour ce parking et ce type;
5. genere les prochains noms;
6. retourne la liste des zones creees.

Une contrainte empeche deux zones d'avoir le meme nom dans un meme parking.

### Creer Une Location

```http
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

Le champ `code` est genere automatiquement par le backend.

### Creer Un Paiement

```http
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

Methodes de paiement disponibles:

```txt
CASH
ORANGE_MONEY
MPESA
AIRTEL_MONEY
ILLICOCASH
```

Statuts disponibles:

```txt
PENDING
PAID
FAILED
CANCELLED
```

## Champs Lisibles Pour Le Frontend

Plusieurs serializers renvoient des champs supplementaires en lecture seule pour eviter au frontend de refaire trop de requetes.

Exemples:

- `vehicle_type_name` dans les vehicules;
- `parking_name` et `vehicle_type_name` dans les zones;
- `vehicle_plaque`, `vehicle_marque`, `vehicle_couleur` dans les locations;
- `location_code` et `vehicle_plaque` dans les paiements;
- `post_name` dans les profils utilisateurs.

Ces champs sont en lecture seule. Pour creer ou modifier une relation, il faut toujours envoyer l'id.

## Verification

Verifier la configuration Django:

```powershell
python manage.py check
```

Verifier les migrations:

```powershell
python manage.py makemigrations --check --dry-run
```

Appliquer les migrations:

```powershell
python manage.py migrate
```

## Ordre De Test Conseille Dans Postman

1. `POST /api/vehicles/types/`
2. `POST /api/vehicles/vehicles/`
3. `POST /api/parkings/parkings/`
4. `POST /api/parkings/zones/`
5. `POST /api/locations/locations/`
6. `POST /api/payments/payments/`

Apres chaque `POST`, tester le `GET` correspondant pour verifier que l'objet est bien cree.

## Notes Pour Publication GitHub

Avant de publier publiquement:

- ne pas pousser le dossier `env/`;
- eviter de pousser des fichiers caches `__pycache__/`;
- envisager de retirer `db.sqlite3` si le depot doit etre un projet propre sans donnees locales;
- deplacer `SECRET_KEY` et `DEBUG` vers des variables d'environnement pour un usage hors developpement;
- ajouter un fichier `.gitignore` adapte a Python/Django.

## Statut

Le projet est un backend API Django REST Framework fonctionnel pour un systeme de gestion de parking.
