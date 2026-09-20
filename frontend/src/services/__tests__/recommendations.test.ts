import { complementaryProducts, recommendProducts } from '../recommendations';
import type { Product } from '../../models/types';

const base: Product = {
  id: 'p-0',
  name: 'Produit',
  description: '',
  categoryId: 'cat-hygiene',
  brand: 'Livrella',
  images: [],
  price: 10,
  subscriptionPrice: 9,
  discountPercentage: 0,
  unit: 'paquet',
  quantity: 1,
  inStock: true,
  stockCount: 50,
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  tags: [],
  availableFrequencies: ['monthly'],
  rating: 4,
  reviewCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function product(overrides: Partial<Product>): Product {
  return { ...base, ...overrides };
}

const catalog: Product[] = [
  product({ id: 'routine-1', categoryId: 'cat-hygiene', name: 'Serviettes' }),
  product({ id: 'sibling', categoryId: 'cat-hygiene', name: 'Protège-slips' }),
  product({ id: 'baby-1', categoryId: 'cat-baby', name: 'Couches' }),
  product({ id: 'other', categoryId: 'cat-wellness', name: 'Infusion' }),
  product({ id: 'inactive', categoryId: 'cat-hygiene', isActive: false }),
];

describe('recommendProducts', () => {
  it('prioritises products in the same category as the routine', () => {
    const [first] = recommendProducts(catalog, { subscribedProductIds: ['routine-1'] });
    expect(first.product.categoryId).toBe('cat-hygiene');
    expect(first.reason).toBe('Complète votre routine');
  });

  it('never recommends the product already in the routine', () => {
    const results = recommendProducts(catalog, {
      subscribedProductIds: ['routine-1'],
      orderedProductIds: ['routine-1'],
    });
    expect(results.map((r) => r.product.id)).not.toContain('routine-1');
  });

  it('ignores inactive or out-of-stock products', () => {
    const ids = recommendProducts(catalog, {}, 10).map((r) => r.product.id);
    expect(ids).not.toContain('inactive');
  });

  it('boosts favourites and recently viewed products', () => {
    const results = recommendProducts(catalog, {
      favoriteProductIds: ['baby-1'],
      recentlyViewedIds: ['other'],
    });
    const byId = Object.fromEntries(results.map((r) => [r.product.id, r]));
    expect(byId['baby-1'].reason).toBe('Dans vos favoris');
    expect(byId['other'].reason).toBe('Déjà repéré');
    expect(byId['baby-1'].score).toBeGreaterThan(byId['other'].score);
  });

  it('caps the number of recommendations', () => {
    expect(recommendProducts(catalog, {}, 2)).toHaveLength(2);
  });

  it('works with no history at all (fallback ranking)', () => {
    const results = recommendProducts(catalog);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.reason).toBeTruthy());
  });
});

describe('complementaryProducts', () => {
  it('excludes the current product and prefers shared tags', () => {
    const target = product({ id: 'target', categoryId: 'cat-baby', tags: ['couches', 'bio'] });
    const babies = [
      target,
      product({ id: 'tagged', categoryId: 'cat-baby', tags: ['bio'] }),
      product({ id: 'cross', categoryId: 'cat-hygiene', tags: ['bio'] }),
      product({ id: 'far', categoryId: 'cat-wellness' }),
    ];

    const results = complementaryProducts(target, babies, 3);
    expect(results.map((p) => p.id)).not.toContain('target');

    // Shared tags win; a complementary product from another category beats an
    // unrelated one.
    const taggedIds = ['tagged', 'cross'];
    expect(taggedIds).toContain(results[0].id);
    expect(results.map((p) => p.id)).toEqual(expect.arrayContaining(taggedIds));
    expect(results[results.length - 1].id).toBe('far');
  });
});
