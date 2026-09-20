import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../src/components/ui/Screen';
import ProductCard from '../../src/components/cards/ProductCard';
import EmptyState from '../../src/components/ui/EmptyState';
import SectionHeader from '../../src/components/layout/SectionHeader';
import IconButton from '../../src/components/ui/IconButton';
import { useFavoritesStore } from '../../src/store/favoritesStore';
import { Colors } from '../../src/constants/colors';
import { Spacing, Type } from '../../src/constants/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const { products, ids, hydrate, recentlyViewed, hydrated } = useFavoritesStore();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  const favorites = useMemo(
    () => (products.length ? products : []).filter((product) => ids.includes(product.id)),
    [products, ids]
  );

  return (
    <Screen padded={false} tabBarSpace>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Mes favoris</Text>
              <Text style={styles.subtitle}>
                {favorites.length} produit{favorites.length > 1 ? 's' : ''} sauvegardé
                {favorites.length > 1 ? 's' : ''} sur cet appareil
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="heart-outline"
              title="Aucun favori pour l’instant"
              description="Touchez le cœur sur un produit pour le retrouver ici, même hors connexion."
              actionLabel="Explorer le catalogue"
              onAction={() => router.replace('/(main)/catalog' as never)}
            />
            {recentlyViewed.length ? (
              <Text style={styles.recentHint}>
                {recentlyViewed.length} produit(s) consulté(s) récemment
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/(main)/(catalog)/${item.id}` as never)}
              onSubscribe={() => router.push(`/(main)/(subs)/plan?productId=${item.id}` as never)}
            />
          </View>
        )}
        ListFooterComponent={
          recentlyViewed.length && favorites.length ? (
            <View style={styles.footer}>
              <SectionHeader accent title="Consultés récemment" subtitle="Reprenez où vous en étiez" />
              <View style={{ gap: 12 }}>
                {products
                  .filter((product) => recentlyViewed.includes(product.id) && !ids.includes(product.id))
                  .slice(0, 3)
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      variant="row"
                      product={product}
                      onPress={() => router.push(`/(main)/(catalog)/${product.id}` as never)}
                      onSubscribe={() => router.push(`/(main)/(subs)/plan?productId=${product.id}` as never)}
                    />
                  ))}
              </View>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, paddingTop: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  headerText: { flex: 1 },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  column: { paddingHorizontal: Spacing.screen, gap: 12 },
  gridItem: { flex: 1, maxWidth: '50%', marginBottom: 12 },
  empty: { paddingHorizontal: Spacing.screen },
  recentHint: { ...Type.small, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },
  footer: { paddingHorizontal: Spacing.screen, marginTop: Spacing.xl },
});
