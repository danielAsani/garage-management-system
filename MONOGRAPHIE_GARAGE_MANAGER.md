# MONOGRAPHIE DU PROJET

## Garage Manager

**Sujet :** Conception et realisation d'une application web de gestion d'un garage parking avec Django, templates Django et SQLite.

**Technologies principales :** Python, Django, Django Templates, Django REST Framework, SQLite, HTML, CSS, JavaScript, DaisyUI, Bootstrap/SB Admin.

---

## Resume

Garage Manager est une application web destinee a faciliter la gestion quotidienne d'un garage parking. Elle permet d'enregistrer les vehicules, de gerer les entrees et sorties, de controler les emplacements disponibles, de calculer automatiquement les paiements et de suivre les recettes.

Le projet est realise comme une seule application Django. Il n'y a plus de dossier frontend separe ni de dossier backend separe. Tout le projet se trouve directement dans `PROJETL2`, avec l'interface dans `templates`, les fichiers CSS et JavaScript dans `static`, et la base de donnees SQLite a la racine.

L'application conserve une API REST pour les integrations futures, mais l'utilisation principale se fait depuis les pages Django.

---

## Problematique

Dans beaucoup de garages parkings, les informations sont encore notees sur papier ou dans des fichiers disperses. Cela provoque des erreurs, complique le suivi des places disponibles et rend le calcul des paiements moins fiable.

La question principale est donc :

**Comment concevoir une application web simple et maintenable permettant de gerer efficacement les vehicules, les emplacements, les paiements et les utilisateurs d'un garage parking ?**

---

## Objectif General

L'objectif general du projet est de developper une application Django permettant de gerer un garage parking depuis une seule interface web, avec SQLite comme base de donnees et une architecture simple a maintenir.

---

## Objectifs Specifiques

- creer une interface web integree directement dans Django ;
- gerer les utilisateurs avec des roles differents ;
- enregistrer les vehicules et leurs informations ;
- joindre des photos aux vehicules ;
- configurer les parkings et leurs zones ;
- gerer les entrees et sorties des vehicules ;
- calculer automatiquement le montant a payer ;
- enregistrer les paiements ;
- imprimer un recu ;
- consulter les statistiques financieres ;
- garder un style visuel coherent avec DaisyUI et les styles existants.

---

## Choix Technologiques

### Django

Django est le framework principal du projet. Il gere les routes, les vues, les templates, l'authentification, les sessions, les formulaires et l'acces a la base de donnees.

### Django Templates

Les templates Django permettent de construire l'interface utilisateur sans framework frontend separe. Les pages HTML sont placees dans :

```txt
templates/
```

### Static Files

Les fichiers CSS, JavaScript et la favicon sont places dans :

```txt
static/
```

### SQLite

SQLite est utilise pour simplifier l'installation et le deploiement local. Le fichier de base de donnees est :

```txt
db.sqlite3
```

### Django REST Framework

Django REST Framework reste disponible pour exposer une API utile en cas d'integration avec une application mobile ou un service externe.

---

## Architecture Du Projet

Le projet est maintenant directement organise a la racine `PROJETL2`.

```txt
PROJETL2/
├── apps/
│   ├── accounts/
│   ├── locations/
│   ├── parkings/
│   ├── payments/
│   ├── vehicles/
│   └── web/
├── config/
├── media/
├── static/
│   └── web/
│       ├── css/
│       └── js/
├── templates/
│   ├── web/
│   ├── 403.html
│   ├── 404.html
│   └── 500.html
├── db.sqlite3
├── manage.py
├── requirements.txt
├── README.md
├── API.md
└── MONOGRAPHIE_GARAGE_MANAGER.md
```

---

## Role Des Dossiers

`apps/accounts` gere les utilisateurs et les roles.

`apps/vehicles` gere les vehicules, les types de vehicules et les photos.

`apps/parkings` gere les parkings et leurs zones.

`apps/locations` gere les entrees et sorties des vehicules.

`apps/payments` gere les paiements.

`apps/web` contient les vues web Django.

`templates` contient l'interface HTML.

`static` contient les fichiers CSS, JavaScript et les ressources statiques.

`media` contient les fichiers envoyes par les utilisateurs.

---

## Fonctionnalites

### Authentification

L'utilisateur doit se connecter avant d'acceder a l'application. Deux roles sont disponibles :

- `ADMIN` : administrateur ;
- `AGENT` : agent.

### Tableau De Bord

Le tableau de bord affiche le nombre de vehicules, les vehicules stationnes, les paiements et les dernieres entrees.

### Vehicules

L'application permet d'ajouter, modifier et consulter les vehicules. Elle permet aussi d'associer des photos a chaque vehicule.

### Parkings Et Zones

L'administrateur peut creer des parkings et generer automatiquement des zones selon les types de vehicules.

### Operations

Les agents peuvent enregistrer les entrees, choisir une place disponible, rechercher un vehicule et finaliser sa sortie.

### Paiements

Le montant est calcule automatiquement selon le tarif horaire et la duree de stationnement. Un montant minimum de `500 FC` est applique.

### Finance

La page finance permet a l'administrateur de suivre les recettes, les paiements et les rendements par methode.

### Utilisateurs

L'administrateur peut creer, modifier, activer ou desactiver les comptes utilisateurs.

### Pages D'Erreur

Le projet contient des pages personnalisees pour :

- erreur 403 : acces refuse ;
- erreur 404 : page introuvable ;
- erreur 500 : erreur serveur.

---

## Modeles De Donnees

Les principaux modeles sont :

- `UserProfile` : role de l'utilisateur ;
- `VehicleType` : type et tarif horaire ;
- `Vehicle` : vehicule ;
- `VehiclePhoto` : photo du vehicule ;
- `Parking` : parking ;
- `ParkingZone` : place de parking ;
- `Location` : operation d'entree ou de sortie ;
- `Payment` : paiement.

---

## Regles De Gestion

- Un vehicule ne peut pas etre stationne deux fois au meme moment.
- Une zone ne peut pas etre occupee par deux vehicules en meme temps.
- Une zone doit correspondre au type du vehicule.
- Une sortie exige une heure de sortie.
- Le montant du paiement est calcule automatiquement.
- Le montant minimum facture est de `500 FC`.
- Un paiement non cash exige un identifiant de transaction.
- Seul l'administrateur peut gerer les utilisateurs.
- Seul l'administrateur peut modifier la configuration des parkings.

---

## Securite

La securite est assuree par :

- l'authentification Django ;
- les sessions ;
- la protection CSRF ;
- les permissions par role ;
- la validation des modeles ;
- la protection contre les suppressions de donnees deja utilisees.

---

## Installation Et Lancement

Depuis la racine du projet `PROJETL2` :

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

L'application est disponible a l'adresse :

```txt
http://127.0.0.1:8000/
```

---

## Verification

La verification principale du projet se fait avec :

```powershell
python manage.py check
```

---

## Limites Et Perspectives

Le projet peut encore evoluer avec :

- des rapports financiers par periode ;
- un export PDF avance des recus ;
- une sauvegarde automatique de SQLite ;
- une connexion a une imprimante thermique ;
- une application mobile connectee a l'API ;
- une base PostgreSQL pour une utilisation plus grande.

---

## Conclusion

Garage Manager est une application web Django concue pour simplifier la gestion d'un garage parking. Le projet est maintenant organise directement dans `PROJETL2`, sans separation frontend/backend. Cette organisation rend l'application plus simple a maintenir, plus claire pour le developpement et plus facile a lancer.
