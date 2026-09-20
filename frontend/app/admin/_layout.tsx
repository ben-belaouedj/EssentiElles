import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Radius, Spacing } from '../../src/constants/spacing';
import { Elevation, Font, Type } from '../../src/constants/theme';

const NAV_ITEMS = [
  { label: 'Tableau de bord', icon: 'grid-outline', path: '/admin' },
  { label: 'Produits', icon: 'cube-outline', path: '/admin/products' },
  { label: 'Commandes', icon: 'bag-outline', path: '/admin/orders' },
  { label: 'Abonnés', icon: 'repeat-outline', path: '/admin/subscriptions' },
  { label: 'Utilisateurs', icon: 'people-outline', path: '/admin/users' },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading, isAuthenticated } = useAuthStore();
  const initialized = !isLoading;

  useEffect(() => {
    if (initialized && (!user || !isAuthenticated || user.role !== 'admin')) {
      router.replace('/(auth)/login' as any);
    }
  }, [initialized, user, isAuthenticated]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex: 1 }}>
            {/* Logo */}
            <View style={styles.logo}>
              <Image source={require('../../assets/images/brand/logo.png')} style={styles.logoImg} />
              <View>
                <Text style={styles.logoText}>Livrella</Text>
                <Text style={styles.logoSub}>Panel Admin</Text>
              </View>
            </View>

            {/* Nav */}
            <View style={styles.nav}>
              {NAV_ITEMS.map(item => {
                const active = pathname === item.path ||
                  (item.path !== '/admin' && pathname.startsWith(item.path));
                return (
                  <TouchableOpacity
                    key={item.path}
                    testID={`admin-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    style={[styles.navItem, active && styles.navItemActive]}
                    onPress={() => router.push(item.path as any)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={active ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <View style={styles.adminInfo}>
              <View style={styles.adminAvatar}>
                <Text style={styles.adminAvatarText}>
                  {(user.firstName?.[0] || 'A').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminName} numberOfLines={1}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.adminEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={15} color={Colors.error} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.main}>
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 230, backgroundColor: Colors.surface,
    borderRightWidth: 1, borderRightColor: Colors.borderLight,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg,
    ...Elevation.xs,
    justifyContent: 'space-between',
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xl },
  logoImg: { width: 34, height: 34, borderRadius: 12 },
  logoText: { fontSize: 18, fontFamily: Font.bold, color: Colors.primaryDark },
  logoSub: { ...Type.caption, color: Colors.textTertiary },
  nav: {},
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: Radius.full, marginBottom: 6,
    borderWidth: 1, borderColor: 'transparent',
  },
  navItemActive: { backgroundColor: Colors.primaryPale, borderColor: Colors.primaryMuted, ...Elevation.xs },
  navLabel: { ...Type.bodyStrong, color: Colors.textSecondary },
  navLabelActive: { color: Colors.primaryDark, fontFamily: Font.semibold },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  adminInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  adminAvatar: {
    width: 34, height: 34, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  adminAvatarText: { fontSize: 14, color: Colors.textInverse, fontFamily: 'Poppins_700Bold' },
  adminName: { ...Type.smallStrong, color: Colors.textPrimary },
  adminEmail: { fontSize: 11, color: Colors.textTertiary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  logoutText: { ...Type.smallStrong, color: Colors.error },
  main: { flex: 1 },
});
