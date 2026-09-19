# EssentiElles (Livrella) 🌸

> Application mobile e-commerce React Native pour produits de santé, bien-être et bébé avec abonnements mensuels.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)

## 📋 Table des Matières

- [À Propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Développement](#développement)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [API Documentation](#api-documentation)
- [Contribution](#contribution)
- [License](#license)

## 🎯 À Propos

EssentiElles (Livrella) est une application mobile e-commerce moderne développée avec React Native (Expo) et FastAPI, spécialisée dans les produits d'hygiène féminine et bébé avec un système d'abonnement mensuel.

### Technologies Principales

**Frontend:**
- React Native 0.81.5
- Expo SDK 54
- TypeScript 5.9
- Zustand (state management)
- React Navigation 7
- Axios (API client)

**Backend:**
- Python 3.11
- FastAPI 0.110
- MongoDB 7.0 (Motor async driver)
- JWT Authentication
- Uvicorn (ASGI server)

**Infrastructure:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (reverse proxy)
- Redis (caching)

## ✨ Fonctionnalités

### Pour les Utilisateurs

- ✅ **Authentification sécurisée** - Inscription, connexion, récupération de mot de passe
- 🛍️ **Catalogue produits** - Navigation par catégories, filtres, recherche
- 🔄 **Abonnements mensuels** - Gestion flexible des abonnements (hebdomadaire, bi-hebdomadaire, mensuel)
- 🛒 **Panier intelligent** - Ajout/suppression, calcul automatique
- 📦 **Suivi de commandes** - Historique, tracking en temps réel
- 💳 **Paiement sécurisé** - Intégration Stripe
- 👤 **Profil utilisateur** - Gestion des informations, adresses de livraison
- 🌐 **Multi-langue** - Français/Anglais (i18n)
- 🎨 **Design moderne** - Interface intuitive avec thème Organic & Pastel

### Pour les Administrateurs

- 📊 **Dashboard admin** - Vue d'ensemble des ventes, utilisateurs, commandes
- 📦 **Gestion des produits** - CRUD complet, stock, catégories
- 👥 **Gestion des utilisateurs** - Modération, statistiques
- 🚚 **Gestion des commandes** - Validation, expédition, tracking
- 📈 **Statistiques** - Analyses détaillées des ventes et performances

## 🏗️ Architecture

```
EssentiElles/
├── backend/                    # API FastAPI
│   ├── server.py              # Application principale (+ health checks, static web)
│   ├── middleware.py          # Security headers, logging & rate limiting
│   ├── validators.py          # Input validation
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Docker image
│   └── tests/                # Backend tests (in-memory DB)
│
├── frontend/                  # Application React Native
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/          # Authentication screens
│   │   ├── (main)/          # Main app screens
│   │   └── admin/           # Admin screens
│   ├── src/
│   │   ├── services/        # API client, business logic
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utilities, helpers
│   │   └── components/      # Reusable components
│   ├── assets/              # Images, fonts, icons
│   └── package.json
│
├── nginx/                    # Nginx configuration
├── docker-compose.yml        # Multi-container setup
├── .github/workflows/        # CI/CD pipelines
└── README.md

```

### Flux de Données

```
┌─────────────┐      HTTPS      ┌────────┐      HTTP       ┌──────────┐
│   Mobile    │ ───────────────> │ Nginx  │ ──────────────> │ FastAPI  │
│     App     │ <─────────────── │ Proxy  │ <────────────── │ Backend  │
└─────────────┘    JSON/JWT      └────────┘    JSON         └──────────┘
                                                                   │
                                                                   ▼
                                                             ┌──────────┐
                                                             │ MongoDB  │
                                                             └──────────┘
```

## 🚀 Installation

### Prérequis

- **Node.js** 20+ et npm
- **Python** 3.11+
- **MongoDB** 7.0+ *(optionnel en dev — voir mode mémoire ci-dessous)*
- **Docker** & Docker Compose (optionnel)

### 🚀 Démarrage le plus rapide (sans MongoDB)

Le backend peut tourner avec une base **en mémoire embarquée** (aucune installation requise) — parfait pour tester/démo :

```bash
git clone https://github.com/ben3100/EssentiElles.git
cd EssentiElles

# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DB_BACKEND=memory SEED_DEMO_DATA=true uvicorn server:app --reload
```

Compte de démo auto-créé : **sarah@example.com / password123**
Admin : **admin@livrella.com / Admin2026!**

### Installation Rapide avec Docker

```bash
# Cloner le repository
git clone https://github.com/ben3100/EssentiElles.git
cd EssentiElles

# Copier les fichiers d'environnement
cp .env.example .env
cp frontend/.env.example frontend/.env

# Configurer les variables d'environnement
nano .env

# Lancer avec Docker Compose
docker-compose up -d

# L'API sera disponible sur http://localhost:8000
# La documentation API sur http://localhost:8000/docs
```

### Installation Manuelle

#### Backend

```bash
cd backend

# Créer environnement virtuel Python
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'environnement
cp ../.env.example .env

# Lancer le serveur
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Lancer l'app en développement
npm start

# Ou directement sur Android/iOS/web
npm run android
npm run ios
npm run web
```

#### 🌐 Déployer l'app web et l'API sur un seul domaine

Le backend sait servir l'export web statique Expo — une seule origine, zéro souci CORS :

```bash
cd frontend
EXPO_PUBLIC_BACKEND_URL=/api npm run build:web   # génère frontend/dist/

cd ../backend
WEB_DIST_DIR=/chemin/vers/frontend/dist uvicorn server:app --host 0.0.0.0 --port 8000
# → http://localhost:8000 sert la boutique web + /api/*
```

## ⚙️ Configuration

### Variables d'Environnement Backend

Voir [.env.example](.env.example) pour la liste complète commentée. Principales :

| Variable | Défaut | Rôle |
|---|---|---|
| `DB_BACKEND` | `mongodb` | `mongodb` (prod) ou `memory` (dev/tests sans serveur) |
| `MONGO_URL` / `DB_NAME` | — | Connexion MongoDB (requis si `DB_BACKEND=mongodb`) |
| `JWT_SECRET` | **requis en prod** | Clé de signature des tokens (`openssl rand -hex 32`) |
| `ENVIRONMENT` | `development` | `development` ou `production` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | — | Compte admin créé au 1er démarrage |
| `CORS_ORIGINS` | `*` | Origines autorisées (CSV) — à restreindre en prod |
| `RATE_LIMIT_PER_MINUTE` | `240` | Limite de requêtes / IP (`0` = désactivé) |
| `SEED_DEMO_DATA` | `true` hors prod | Catalogue + compte démo au démarrage |
| `WEB_DIST_DIR` | — | Dossier de l'export web Expo à servir sur `/` |
| `STRIPE_SECRET_KEY` | — | Active le mode paiement Stripe (sinon : démo) |

### Variables d'Environnement Frontend

Voir [frontend/.env.example](frontend/.env.example). Principales :

| Variable | Rôle |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | URL de l'API (`http://localhost:8000`, ou `/api` en single-origin) |
| `EXPO_PUBLIC_PAYMENT_MODE` | `demo` ou `stripe` |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (si mode stripe) |

## 🛠️ Développement

### Lancer en mode développement

```bash
# Backend (Terminal 1)
cd backend
source .venv/bin/activate
DB_BACKEND=memory uvicorn server:app --reload

# Frontend (Terminal 2)
cd frontend
npm start
```

### Linting & Formatting

```bash
# Backend
cd backend
black .                    # Format code
isort .                    # Sort imports
flake8 .                   # Lint
mypy .                     # Type check

# Frontend
cd frontend
npm run lint               # ESLint
npm run typecheck          # TypeScript check
```

### Structure du Code

#### Backend: Architecture en couches

- **server.py** - Endpoints & routing
- **middleware.py** - Security, logging, rate limiting
- **validators.py** - Input validation & sanitization
- **health.py** - Health checks & monitoring

#### Frontend: Architecture modulaire

- **services/** - API clients, business logic
- **hooks/** - Custom React hooks (useApi, useMutation)
- **utils/** - Utilities (errorHandler, performance)
- **components/** - Reusable UI components

## 🧪 Tests

### Backend Tests

Les tests tournent sur une base **en mémoire embarquée** — aucune installation MongoDB nécessaire :

```bash
cd backend
source .venv/bin/activate

# Lancer tous les tests
pytest

# Avec coverage
pytest --cov=. --cov-report=html

# Tests spécifiques
pytest tests/test_api.py -v
```

### Frontend Tests

```bash
cd frontend

# Lancer les tests
npm test

# Avec coverage
npm test -- --coverage

# Mode watch
npm test -- --watch
```

### Tests d'Intégration

```bash
# Lancer l'environnement de test
docker-compose -f docker-compose.test.yml up -d

# Lancer les tests E2E
npm run test:e2e
```

## 📦 Déploiement

### Production avec Docker

```bash
# Build des images
docker-compose -f docker-compose.prod.yml build

# Lancer en production
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose logs -f backend
```

### Build Mobile (EAS)

```bash
cd frontend

# Configuration EAS
eas build:configure

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### CI/CD avec GitHub Actions

Les workflows sont configurés dans `.github/workflows/ci-cd.yml`:

- ✅ Tests automatiques (backend + frontend)
- 🔍 Linting & type checking
- 🐳 Build Docker images
- 📱 Build mobile apps (EAS)
- 🔒 Security scanning (Trivy)

## 📖 API Documentation

La documentation API interactive est disponible:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Endpoints Principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/forgot-password` - Demander un code de réinitialisation
- `POST /api/auth/reset-password` - Réinitialiser avec le code
- `DELETE /api/auth/me` - Suppression de compte (RGPD)

#### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/{id}` - Détails d'un produit
- `GET /api/categories` - Catégories

#### Commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders` - Historique des commandes
- `GET /api/orders/{id}` - Détails d'une commande

#### Abonnements
- `POST /api/subscriptions` - Créer un abonnement
- `GET /api/subscriptions` - Mes abonnements
- `PUT /api/subscriptions/{id}` - Modifier un abonnement

#### Paiements
- `GET /api/payments/config` - Mode de paiement actif (demo/stripe)
- `POST /api/payments/create-intent` - PaymentIntent Stripe (montant serveur)

## 🔒 Sécurité

### Mesures Implémentées

- ✅ **JWT Authentication** avec expiration
- ✅ **Password hashing** (bcrypt) + politique de mot de passe fort
- ✅ **Prix calculés côté serveur** — le client n'envoie que produit + quantité (impossible de frauder les prix)
- ✅ **Stock réservé atomiquement** à chaque commande/abonnement
- ✅ **Adresses vérifiées** — une commande ne peut partir que vers une adresse du client
- ✅ **Rate limiting** (configurable, 240 req/min par IP par défaut)
- ✅ **Input validation** & sanitization
- ✅ **CORS** configurable par variable d'environnement
- ✅ **Security headers** (CSP, HSTS, X-Frame-Options)
- ✅ **Injection protection** (requêtes MongoDB paramétrées)
- ✅ **Réinitialisation de mot de passe** par code à 6 chiffres expirant (hashé en base)
- ✅ **Suppression de compte RGPD** avec anonymisation des commandes

### Rapporter une Vulnérabilité

Envoyez un email à security@essentielles.com

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Guidelines

- Suivre les conventions de code (Black, ESLint)
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation si nécessaire

## 📄 License

Ce projet est sous license MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **Product Owner** - [@ben3100](https://github.com/ben3100)

## 📞 Support

- **Email**: support@essentielles.com
- **Documentation**: https://docs.essentielles.com
- **GitHub Issues**: https://github.com/ben3100/EssentiElles/issues

---

Fait avec ❤️ pour les mamans et leurs bébés
