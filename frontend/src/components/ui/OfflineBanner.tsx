import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius, Spacing } from '../../constants/theme';
import { useConnectivityStore } from '../../store/connectivityStore';

interface Props {
  /** Show the banner only when cached data is being displayed */
  cacheOnly?: boolean;
  /** Per-screen override: force display */
  visible?: boolean;
  onRetry?: () => void;
  style?: ViewStyle;
}

/**
 * "Mode hors connexion" pill — shown when the API is unreachable and the
 * screen is rendering cached data.
 */
export default function OfflineBanner({ cacheOnly = false, visible, onRetry, style }: Props) {
  const online = useConnectivityStore((s) => s.online);
  const usingCache = useConnectivityStore((s) => s.usingCache);

  const show = visible ?? (!online || (cacheOnly && usingCache));
  if (!show) return null;

  return (
    <View style={[styles.banner, style]}>
      <View style={styles.icon}>
        <Ionicons name="cloud-offline-outline" size={15} color={Colors.primaryDark} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Mode hors connexion</Text>
        <Text style={styles.subtitle}>
          Vos données enregistrées s’affichent — tout reste modifiable.
        </Text>
      </View>
      {onRetry ? (
        <PressableScale onPress={onRetry} style={styles.retry}>
          <Ionicons name="refresh" size={14} color={Colors.primaryDark} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    ...Elevation.xs,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontFamily: Font.semibold, fontSize: 12.5, color: Colors.primaryDark },
  subtitle: { fontFamily: Font.regular, fontSize: 11.5, color: Colors.textSecondary },
  retry: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
