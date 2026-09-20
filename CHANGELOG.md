# Changelog

All notable changes to EssentiElles will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-09-20 — Design « modern premium » ✨

### Added — Design system v2
- `frontend/src/constants/theme.ts` : point d'entrée unique des tokens (Gradients, Elevation compatible web, Type, Motion, Surfaces, Layout). `colors.ts` / `spacing.ts` restent réexportés pour la compatibilité.
- Nouvelles primitives UI : `Screen` + `Atmosphere`, `PressableScale`, `IconButton`, `Chip`/`ChipRow`, `QuantityStepper`, `GradientCard`/`HeroCard`, `Sheet`, `ListRow`/`ListGroup`, `StatTile`, `ProgressSteps`, `OfflineBanner`.
- Composants métier réécrits : `AppBadge` (9 variantes), `EmptyState`, `PrimaryButton`/`SecondaryButton`, `SkeletonCard` (box/ligne/carte/liste/grille), `StatusBadge`, `SectionHeader`, `ProductCard`, `OrderCard`.
- `TabBar` flottante (blur + pastille animée) montée dans `app/(main)/_layout.tsx`.

### Added — Fonctionnalités
- **Sauter la prochaine livraison** : `POST /api/subscriptions/{id}/skip` (report d'un cycle, compteur `skippedDeliveries`, notification client) + `subscriptionService.skipNextDelivery`.
- **Recommandations personnalisées locales** (`src/services/recommendations.ts`) basées sur la routine, les commandes, les favoris et les produits vus récemment, avec la raison affichée sur la carte ; produits complémentaires « Souvent associé » sur la fiche produit. Fonctionne hors connexion.
- **Hors-ligne d'abord** : cache AsyncStorage (`livrella_cache:*`), rappels de livraison locaux, favoris, conseils sauvegardés, checklist maternité, préférences de notifications.
- **FR/EN** : les libellés de navigation suivent la langue choisie dans le profil (infrastructure i18n `src/constants/strings.ts` + hook `useLang`).
- Assets de marque locaux : logo, illustrations d'onboarding, visuels des guides.
- Historique de livraisons modernisé (filtres par année, statistiques, tri par statut livré).

### Changed
- Tous les écrans (accueil, catalogue, fiche produit, panier/checkout, abonnements, plan, commandes, suivi, factures, favoris, conseils, notifications, offres, profil, adresses, paramètres, support, ticket, authentification, back-office admin) refondus sur les tokens v2 avec skeletons, états vides et micro-interactions.
- En-têtes de sécurité assouplis hors production (`frame-ancestors`) pour permettre l'intégration en iframe de l'aperçu web.

### Tests
- Frontend : 8 suites / 56 tests (tokens de design, i18n, cache et rappels, stores locaux, guides, moteur de recommandations).
- Backend : 19 tests E2E (dont 2 nouveaux sur le report de livraison).

## [1.1.0] — 2026-09-19 — Prêt pour la vente 🚀

### Security (critical)
- **Prix côté serveur** : les commandes n'acceptent plus que `productId` + `quantity` ; les prix/noms/totaux sont recalculés depuis le catalogue (impossible de falsifier les prix depuis le client)
- **Stock atomique** : chaque commande/abonnement réserve le stock via `findOneAndUpdate` avec rollback en cas d'échec ; `inStock` se désactive à 0
- **Adresses cloisonnées** : une commande ne peut être expédiée qu'à une adresse appartenant au client (404 sinon)
- Middlewares **rate limiting** et **security headers** désormais montés dans l'application (`RATE_LIMIT_PER_MINUTE`)
- **CORS** configurable via `CORS_ORIGINS` (warning en prod si `*`)
- `JWT_SECRET` obligatoire en production (fallback dev uniquement hors prod)

### Added
- **Réinitialisation de mot de passe complète** : code à 6 chiffres hashé en base, expiration 30 min, nouveau flow 2 étapes côté app (`/auth/forgot-password` + `/auth/reset-password`)
- **Suppression de compte RGPD** (`DELETE /auth/me`) avec mot de passe de confirmation et anonymisation des commandes/factures
- **Paiement Stripe prêt à activer** : `GET /api/payments/config` + `POST /api/payments/create-intent` (montant calculé serveur) — mode démo conservé sans clés
- **Web single-origin** : `WEB_DIST_DIR` permet au backend de servir l'export web Expo (deep links SPA inclus)
- **Notifications métier** : bienvenue à l'inscription, confirmation de commande, notification au client à chaque changement de statut (numéro de suivi généré à l'expédition)
- **Mode base mémoire** (`DB_BACKEND=memory`) pour dev/tests/démo sans MongoDB
- `GET /api/admin/products` : liste admin complète incluant les produits désactivés
- Endpoint santé : `/health`, `/health/detailed`, `/metrics` fonctionnels (uptime, état DB)
- 17 tests backend E2E (auth, anti-fraude prix, stock, RGPD, admin) + 13 tests frontend (jest installé et configuré)

### Fixed
- **Crash démarrage/déconnexion** : migration vers l'API AsyncStorage v3 (`getMany`/`removeMany`)
- **Panel admin cassé** : `initialized` inexistant dans le store + `fetch('/api/...')` avec `getToken()` fantôme + corps JSON manquants (`updateOrderStatus`, `broadcast`)
- **Navigation cassée** : `/(main)/profile/addresses` n'existe pas → `/(main)/addresses`
- **Mot de passe oublié factice** (setTimeout) remplacé par le vrai flow API
- **Suppression de compte factice** (simple logout) remplacée par la suppression serveur
- Panier : achat unitaire facturé au **prix normal** (la remise reste l'avantage abonné) + encart "économisez avec l'abonnement"
- `app.json` : référence cassée `splash-icon.png` corrigée, couleurs de marque appliquées
- Package : standardisation **npm** (package-lock.json), scripts `test`, `typecheck`, `build:web`

### Chore
- `.env` / `frontend/.env` / `.metro-cache` retirés du suivi git ; règles d'ignore complètes
- Brief produit déplacé vers `docs/PRODUCT_BRIEF.md`
- Backend conforme black / isort / flake8 / mypy ; CI corrigée (npm + package-lock)

### Added (origine)
- Docker & Docker Compose configuration for easy deployment
- CI/CD pipeline with GitHub Actions
- Nginx reverse proxy configuration
- Rate limiting middleware (60 req/min)
- Security headers middleware
- Enhanced input validation and sanitization
- Health check endpoints (/health, /health/detailed)
- API client with retry logic and error handling
- Custom React hooks (useApi, useMutation)
- Performance utilities (debounce, throttle, memoize)
- Error handling utilities with user-friendly messages
- Comprehensive test suites (backend + frontend)
- Jest configuration for frontend tests
- Pytest configuration for backend tests
- Professional README with full documentation
- Contributing guidelines (CONTRIBUTING.md)
- Environment variable examples (.env.example)
- Monitoring and logging infrastructure

### Changed
- Updated requirements.txt with better organization
- Improved error messages for better UX
- Enhanced security with password validation
- Reorganized backend code structure

### Security
- Added bcrypt password hashing
- Implemented JWT token expiration
- Added CORS security middleware
- Input sanitization to prevent XSS
- Rate limiting to prevent abuse
- Security headers (CSP, HSTS, X-Frame-Options)

## [1.0.0] - 2024-01-15

### Added
- Initial release of EssentiElles mobile app
- User authentication (register, login, forgot password)
- Product catalog with categories
- Shopping cart functionality
- Monthly subscription system
- Order management and tracking
- User profile management
- Admin dashboard
- French/English internationalization
- Stripe payment integration
- MongoDB database integration
- FastAPI backend
- React Native (Expo) frontend

### Features
- Organic & Pastel design theme
- Responsive mobile UI
- Offline cart persistence
- Push notifications support
- Image optimization
- AsyncStorage for local data

---

## Versions à Venir

### [1.1.0] - Planned
- [ ] WhatsApp customer support integration
- [ ] Product recommendations engine
- [ ] Loyalty points system
- [ ] Referral program
- [ ] Multiple payment methods
- [ ] In-app reviews and ratings

### [1.2.0] - Planned
- [ ] Social media sharing
- [ ] Wishlist functionality
- [ ] Advanced search with filters
- [ ] Product comparison
- [ ] Live chat support
- [ ] Analytics dashboard

### [2.0.0] - Future
- [ ] Web version (React)
- [ ] B2B wholesale portal
- [ ] Inventory management system
- [ ] Supplier integration
- [ ] Multi-warehouse support
- [ ] Advanced reporting
