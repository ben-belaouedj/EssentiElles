import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import ProductCard from '../../../src/components/cards/ProductCard';
import EmptyState from '../../../src/components/ui/EmptyState';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import { Chip, ChipRow } from '../../../src/components/ui/Chip';
import IconButton from '../../../src/components/ui/IconButton';
import { SkeletonGrid } from '../../../src/components/ui/SkeletonCard';
import { useOfflineQuery } from '../../../src/hooks/useOfflineQuery';
import { categoryService, productService } from '../../../src/services/api';
import { Category, Product } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Pertinence' },
  { key: 'price_asc', label: 'Prix croissant' },
  { key: 'price_desc', label: 'Prix décroissant' },
  { key: 'rating', label: 'Mieux notés' },
];

export default function CatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(params.category ?? 'all');
  const [sort, setSort] = useState<SortKey>('relevance');

  const categories = useOfflineQuery<Category[]>(
    () => categoryService.getAll().then((res) => res.data as Category[]),
    { cacheKey: 'categories' }
  );

  const products = useOfflineQuery<Product[]>(
    () =>
      productService
        .getAll({
          limit: 60,
          ...(category !== 'all' ? { category } : {}),
          ...(sort !== 'relevance' ? { sort } : {}),
        })
        .then((res) => (res.data?.products ?? []) as Product[]),
    { cacheKey: `products-${category}-${sort}` }
  );

  // Instant client-side search on top of the loaded catalogue.
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.data ?? [];
    if (!term) return list;
    return list.filter((product) =>
      [product.name, product.brand, product.shortDescription, ...(product.tags ?? [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [products.data, search]);

  const refresh = useCallback(() => {
    void products.refresh();
    void categories.refresh();
  }, [products, categories]);

  const openProduct = (product: Product) =>
    router.push(`/(main)/(catalog)/${product.id}` as never);

  const header = (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Catalogue</Text>
          <Text style={styles.subtitle}>
            {visibleProducts.length} produit{visibleProducts.length > 1 ? 's' : ''} essentiel
            {visibleProducts.length > 1 ? 's' : ''}
          </Text>
        </View>
        <IconButton
          name="heart-outline"
          accessibilityLabel="Favoris"
          onPress={() => router.push('/(main)/favorites' as never)}
        />
        <IconButton
          name="bag-outline"
          accessibilityLabel="Panier"
          onPress={() => router.push('/(main)/cart' as never)}
        />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          testID="catalog-search-input"
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un produit…"
          placeholderTextColor={Colors.textPlaceholder}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={Colors.textTertiary}
            onPress={() => setSearch('')}
          />
        ) : null}
      </View>

      <OfflineBanner cacheOnly onRetry={refresh} style={{ marginTop: Spacing.md }} />
    </View>
  );

  return (
    <Screen padded={false} tabBarSpace>
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={products.refreshing} onRefresh={refresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View>
            {header}
            <View style={styles.chipsWrap}>
              <ChipRow contentStyle={styles.chipRow}>
                <Chip
                  label="Tout"
                  active={category === 'all'}
                  onPress={() => setCategory('all')}
                  testID="catalog-chip-all"
                />
                {(categories.data ?? []).map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={category === cat.slug}
                    onPress={() => setCategory(cat.slug)}
                    testID={`catalog-chip-${cat.slug}`}
                  />
                ))}
              </ChipRow>
            </View>

            <View style={styles.sortRow}>
              {SORTS.map((option) => (
                <Chip
                  key={option.key}
                  label={option.label}
                  tone="ink"
                  active={sort === option.key}
                  onPress={() => setSort(option.key)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          products.loading ? (
            <View style={styles.skeletonWrap}>
              <SkeletonGrid count={4} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyState
                tone="sage"
                icon={search ? 'search-outline' : 'cube-outline'}
                title={search ? 'Aucun résultat' : 'Catalogue vide'}
                description={
                  search
                    ? `Aucun produit ne correspond à « ${search} ». Essayez un autre mot-clé.`
                    : 'Les produits arriveront très vite. Revenez dans un instant.'
                }
                actionLabel={search ? 'Effacer la recherche' : 'Réessayer'}
                onAction={search ? () => setSearch('') : refresh}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard
              product={item}
              onPress={() => openProduct(item)}
              onSubscribe={() => router.push(`/(main)/(subs)/plan?productId=${item.id}` as never)}
            />
          </View>
        )}
        ListFooterComponent={
          products.loading && !visibleProducts.length ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, paddingTop: Spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  titleWrap: { flex: 1 },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.screen,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  chipsWrap: { marginTop: Spacing.md },
  chipRow: { paddingHorizontal: Spacing.screen },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  column: { paddingHorizontal: Spacing.screen, gap: 12 },
  gridItem: { flex: 1, maxWidth: '50%', marginBottom: 12 },
  skeletonWrap: { paddingHorizontal: Spacing.screen },
  emptyWrap: { paddingHorizontal: Spacing.screen },
});
