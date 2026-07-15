# Garage Management System - Frontend

Frontend React/Vite pour l'application de gestion de parking.

## Fonctionnalites

- Connexion JWT
- Tableau de bord
- Gestion des vehicules et photos
- Operations d'entree et sortie
- Selection des parkings et zones compatibles avec le type de vehicule
- Calcul affiche du montant a payer en FC
- Impression et telechargement de recu PDF
- Gestion des parkings, zones et tarifs
- Vue finance pour administrateur
- Gestion des utilisateurs par administrateur

Les montants sont affiches en francs congolais (`FC`). Le paiement minimum est de `500 FC`.

## Installation

Depuis `FRONTEND`:

```powershell
npm install
copy .env.example .env
npm run dev
```

URL locale par defaut:

```txt
http://localhost:5173
```

Si Vite choisit un autre port, utilise celui affiche dans le terminal.

## Configuration

`.env.example`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Le backend doit etre lance sur le port correspondant.

## Scripts

```powershell
npm run dev
npm run lint
npm run build
```

## Note Camera Mobile

La capture photo utilise l'API navigateur `getUserMedia`.

Sur mobile, la camera peut etre bloquee si l'application est ouverte en HTTP sur une IP locale. Pour une utilisation fiable sur telephone, il faut servir l'application en HTTPS ou la deployer en ligne.
