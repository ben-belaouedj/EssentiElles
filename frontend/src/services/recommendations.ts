/**
 * Personalised recommendations (product brief: « recommandations
 * personnalisées selon l'historique utilisateur »).
 *
 * The engine is intentionally local and deterministic: it scores the catalog
 * against the user's own signals (active subscriptions, orders, favourites,
 * recently viewed items) so it works offline and stays testable.
 */
import { Product } from '../models/types';

export interface RecommendationSignals {
  /** Product ids the user already subscribes to (active or paused). */
  subscribedProductIds?: string[];
  /** Product ids already purchased. */
  orderedProductIds?: string[];
  /** Favourite product ids. */
  favoriteProductIds?: string[];
  /** Recently viewed product ids, most recent first. */
  recentlyViewedIds?: string[];
  /** Categories the user interacts with, ordered by intensity. */
  preferredCategoryIds?: string[];
}

export interface Recommendation {
  product: Product;
  score: number;
  /** Short human-readable justification shown on the card. */
  reason: string;
}

const WEIGHTS = {
  sameCategoryAsRoutine: 26,
  sameCategoryAsOrder: 14,
  sameCategoryAsFavorite: 10,
  sameCategoryAsViewed: 6,
  favorite: 12,
  viewed: 8,
  preferredCategory: 10,
  reorder: 7,
  bestSeller: 6,
  newArrival: 5,
  featured: 4,
  discounted: 5,
  lowStock: 3,
  rating: 4,
  alreadyInRoutine: -30,
} as const;

function categoryOf(product: Product): string {
  return product.categoryId;
}

/**
 * Rank the catalog for a given user.
 *
 * @param products catalog to rank (inactive products are ignored)
 * @param signals  user behaviour collected locally (stores + order history)
 * @param limit    maximum number of recommendations returned
 */
export function recommendProducts(
  products: Product[],
  signals: RecommendationSignals = {},
  limit = 8
): Recommendation[] {
  const subscribed = new Set(signals.subscribedProductIds ?? []);
  const ordered = new Set(signals.orderedProductIds ?? []);
  const favorites = new Set(signals.favoriteProductIds ?? []);
  const viewed = new Set(signals.recentlyViewedIds ?? []);
  const preferred = new Set(signals.preferredCategoryIds ?? []);

  const routineCategories = new Set(
    products.filter((p) => subscribed.has(p.id)).map(categoryOf)
  );
  const orderedCategories = new Set(
    products.filter((p) => ordered.has(p.id)).map(categoryOf)
  );
  const favoriteCategories = new Set(
    products.filter((p) => favorites.has(p.id)).map(categoryOf)
  );
  const viewedCategories = new Set(
    products.filter((p) => viewed.has(p.id)).map(categoryOf)
  );

  const scored = products
    // Already subscribed products live in the « Votre routine » section —
    // recommending them again would be noise.
    .filter(
      (product) =>
        product.isActive !== false && product.inStock !== false && !subscribed.has(product.id)
    )
    .map((product) => {
      const category = categoryOf(product);
      let score = 0;

      if (routineCategories.has(category)) score += WEIGHTS.sameCategoryAsRoutine;
      if (orderedCategories.has(category)) score += WEIGHTS.sameCategoryAsOrder;
      if (favoriteCategories.has(category)) score += WEIGHTS.sameCategoryAsFavorite;
      if (viewedCategories.has(category)) score += WEIGHTS.sameCategoryAsViewed;
      if (preferred.has(category)) score += WEIGHTS.preferredCategory;

      if (favorites.has(product.id)) score += WEIGHTS.favorite;
      if (viewed.has(product.id)) score += WEIGHTS.viewed;
      if (subscribed.has(product.id)) score += WEIGHTS.alreadyInRoutine;
      else if (ordered.has(product.id)) score += WEIGHTS.reorder;

      if (product.isBestSeller) score += WEIGHTS.bestSeller;
      if (product.isNewArrival) score += WEIGHTS.newArrival;
      if (product.isFeatured) score += WEIGHTS.featured;
      if ((product.discountPercentage ?? 0) > 0) score += WEIGHTS.discounted;
      if (typeof product.stockCount === 'number' && product.stockCount > 0 && product.stockCount <= 5) {
        score += WEIGHTS.lowStock;
      }
      score += Math.max(0, Math.min(5, product.rating ?? 0)) * WEIGHTS.rating;

      return { product, score, reason: reasonFor(product, { subscribed, ordered, favorites, viewed, routineCategories }) };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.product.rating ?? 0) - (a.product.rating ?? 0);
    });

  return scored.slice(0, limit);
}

function reasonFor(
  product: Product,
  ctx: {
    subscribed: Set<string>;
    ordered: Set<string>;
    favorites: Set<string>;
    viewed: Set<string>;
    routineCategories: Set<string>;
  }
): string {
  if (ctx.routineCategories.has(product.categoryId)) return 'Complète votre routine';
  if (ctx.favorites.has(product.id)) return 'Dans vos favoris';
  if (ctx.ordered.has(product.id)) return 'À racheter';
  if (ctx.viewed.has(product.id)) return 'Déjà repéré';
  if (product.isNewArrival) return 'Nouveau';
  if (product.isBestSeller) return 'Best-seller';
  if ((product.discountPercentage ?? 0) > 0) return 'En promotion';
  return 'Recommandé pour vous';
}

/**
 * Products frequently bought together — used on the product page
 * (« Souvent associé »).
 */
export function complementaryProducts(
  product: Product,
  products: Product[],
  limit = 4
): Product[] {
  const tags = new Set(product.tags ?? []);
  return products
    .filter((candidate) => candidate.id !== product.id && candidate.isActive !== false)
    .map((candidate) => {
      let score = 0;
      if (candidate.categoryId !== product.categoryId) score += 2;
      else score += 1;
      (candidate.tags ?? []).forEach((tag) => {
        if (tags.has(tag)) score += 3;
      });
      score += (candidate.rating ?? 0) / 5;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
