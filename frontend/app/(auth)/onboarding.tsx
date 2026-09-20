import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import { Colors } from '../../src/constants/colors';
import { Font, Radius, Spacing, Type } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'delivery',
    image: require('../../assets/images/illustrations/onboarding-1.png'),
    badge: 'Livraison automatique',
    title: 'Vos essentiels,\nlivrés avant la rupture',
    description:
      'Plus de course de dernière minute : votre box arrive au bon moment, à votre porte.',
    icon: 'cube-outline' as const,
  },
  {
    id: 'custom',
    image: require('../../assets/images/illustrations/onboarding-2.png'),
    badge: '100 % personnalisable',
    title: 'Votre routine,\nvotre rythme',
    description:
      'Choisissez vos produits, ajustez les quantités et la fréquence — chaque semaine, toutes les 2 semaines ou chaque mois.',
    icon: 'options-outline' as const,
  },
  {
    id: 'flexible',
    image: require('../../assets/images/illustrations/onboarding-3.png'),
    badge: 'Sans engagement',
    title: 'Pause, report,\nannulation en 1 geste',
    description:
      'Voyage, budget, imprévu ? Mettez en pause ou reportez la prochaine livraison quand vous voulez.',
    icon: 'pause-circle-outline' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem('livrella_onboarding_seen', 'true');
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      void finish();
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>🌸 Livrella</Text>
        {!isLast ? (
          <Text testID="onboarding-skip-btn" style={styles.skip} onPress={() => void finish()}>
            Passer
          </Text>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.illustrationWrap}>
              <Image source={item.image} style={styles.illustration} resizeMode="cover" />
            </View>
            <View style={styles.textBlock}>
              <View style={styles.badge}>
                <Ionicons name={item.icon} size={13} color={Colors.primaryDark} />
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((slide, dotIndex) => (
            <View key={slide.id} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>

        <PrimaryButton
          testID="onboarding-next-btn"
          label={isLast ? 'Créer mon compte' : 'Suivant'}
          icon={isLast ? 'sparkles' : 'arrow-forward'}
          iconPosition={isLast ? 'left' : 'right'}
          onPress={next}
        />

        <Text style={styles.legal}>
          En continuant, vous acceptez nos conditions et notre politique de confidentialité.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.sm,
  },
  brand: { fontFamily: Font.semibold, fontSize: 15, color: Colors.primaryDark },
  skip: { fontFamily: Font.medium, fontSize: 13.5, color: Colors.textTertiary },
  slide: { flex: 1 },
  illustrationWrap: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.primaryPale,
  },
  illustration: { width: '100%', height: 300 },
  textBlock: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  badgeText: { fontFamily: Font.semibold, fontSize: 11.5, color: Colors.primaryDark },
  title: { ...Type.display, color: Colors.textPrimary, marginTop: Spacing.md },
  description: { ...Type.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  bottom: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.borderMedium },
  dotActive: { width: 26, backgroundColor: Colors.primary },
  legal: {
    ...Type.small,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
