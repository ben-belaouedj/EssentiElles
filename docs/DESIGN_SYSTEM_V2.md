# Design System v2 « Modern Premium »

Ce document décrit la couche de design utilisée par tous les écrans depuis la v2.
Objectif : une interface douce, premium et maternelle — jamais criarde — construite
à partir de tokens, jamais de valeurs codées en dur.

## 1. Tokens

Point d'entrée unique : [`frontend/src/constants/theme.ts`](../frontend/src/constants/theme.ts).
Il réexporte `Colors`, `Spacing`, `Radius`, `BorderRadius`, `Typography`, `Shadow`
(anciens tokens, toujours valides) et ajoute :

| Token | Rôle |
| --- | --- |
| `Font` | familles Poppins (`regular`, `medium`, `semibold`, `bold`) |
| `Type` | styles typographiques (`display`, `h1`→`h3`, `body`, `bodyStrong`, `small`, `smallStrong`, `caption`, `button`, `price`) |
| `Gradients` | dégradés nommés : `brand`, `brandDeep`, `blush`, `sage`, `mint`, `warm`, `ink`, `amber`, `info`, `glass` |
| `Elevation` | ombres (`none`, `xs`, `sm`, `md`, `lg`, `brand`) — `boxShadow` sur web, `shadow*` sur natif |
| `Surfaces` | fonds de cartes et de sections |
| `Motion` | ressorts d'animation (`spring`, `press`, `screen`) |
| `Layout` | `screenPadding` (20), `tabBarHeight` (74), `maxContentWidth` (520), `sectionGap` |

Palette de marque : primaire `#B5838D`, fond `#FAF7F4`, surface `#FFFFFF`,
accent sauge `#A8B8A3`, textes `#2B2D42` / `#6D6875`, bordures `#E8E1DB`.
Cartes arrondies à 20–24 dp (`Radius.lg` / `Radius.xl`), icônes outline (Ionicons).

## 2. Primitives

Toutes dans [`frontend/src/components/ui`](../frontend/src/components/ui).

| Composant | Usage |
| --- | --- |
| `Screen` (+ `Atmosphere`) | conteneur d'écran : padding horizontal, fond teinté optionnel, `scroll`, `refreshControl`, espace pour la tab bar |
| `PressableScale` | tout élément cliquable — retour tactile par ressort |
| `IconButton` | bouton icône : variantes `glass`, `soft`, `plain`, `brand`, `ink` |
| `Chip`, `ChipRow` | filtres et catégories ; `ChipRow` = rail horizontal avec compteurs |
| `QuantityStepper` | quantités (panier, abonnement) |
| `GradientCard`, `HeroCard` | cartes héro (prochaine livraison, identité, revenus admin) |
| `Sheet` | feuille modale bas de page (formulaires, filtres, détail conseil) |
| `ListRow`, `ListGroup` | listes de réglages (profil, paramètres) |
| `StatTile` | indicateur chiffré avec icône et tonalité |
| `ProgressSteps` | suivi de commande, étapes d'authentification |
| `OfflineBanner` | pastille « mode hors connexion » pilotée par le store de connectivité |
| `EmptyState`, `SkeletonCard` | états vides et squelettes de chargement |
| `StatusBadge` | statut (commande, abonnement, facture, ticket) → variante d'`AppBadge` |
| `SectionHeader` | titre de section, sous-titre, action « Voir tout » |
| `ProductCard` | produit en `grid`, `rail` (176 px) ou `row`, badges dérivés, favoris |
| `OrderCard` | commande : statut, articles, total, action de suivi |

## 3. Conventions

1. **Aucune valeur en dur** : couleurs, rayons, espacements et typographies passent par les tokens.
2. **Un seul `Screen` par écran** : il gère le padding, le scroll et l'espace tab bar.
3. **Toucher = `PressableScale`** (ou `PrimaryButton` / `IconButton`).
4. **Chargement = squelette** (`SkeletonRows`, `SkeletonGrid`, `SkeletonListItem`) plutôt qu'un spinner plein écran.
5. **Vide = `EmptyState`** avec une action concrète vers le catalogue ou l'abonnement.
6. **Erreur réseau = `OfflineBanner`** + données du cache (`useOfflineQuery`).

## 4. Exemple

```tsx
import Screen from '@/components/ui/Screen';
import SectionHeader from '@/components/layout/SectionHeader';
import { Chip, ChipRow } from '@/components/ui/Chip';
import ProductCard from '@/components/cards/ProductCard';
import { Colors, Spacing } from '@/constants/theme';

<Screen scroll background="blush" tabBarSpace>
  <SectionHeader accent title="Recommandé pour vous" subtitle="D'après votre routine" />
  <ChipRow contentStyle={{ gap: 8 }}>
    {categories.map((c) => <Chip key={c.id} label={c.name} active={active === c.id} onPress={() => setActive(c.id)} />)}
  </ChipRow>
  {products.map((p) => <ProductCard key={p.id} product={p} variant="rail" />)}
</Screen>
```

## 5. Qualité

- `npx tsc --noEmit` sans erreur
- `npx eslint app src` : 0 erreur
- `npx jest` : contrats de tokens (`src/constants/__tests__/theme.test.ts`), i18n, cache, stores, recommandations
- Les tokens sont testés : un dégradé vide, un rayon hors échelle ou une police non‑Poppins fait échouer la CI locale.
