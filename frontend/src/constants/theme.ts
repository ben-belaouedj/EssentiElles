/**
 * EssentiElles — Design System v2 « Modern Premium »
 * ---------------------------------------------------
 * Single entry point for colours, gradients, elevation, typography,
 * spacing, radii, motion and surface tokens.
 *
 * Older screens can keep importing ./colors and ./spacing — everything is
 * re-exported here so new code only needs `import { ... } from '@/constants/theme'`.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';
import { Colors } from './colors';
import {
  BorderRadius,
  Duration,
  IconSize,
  Radius,
  Shadow,
  Shadows,
  Spacing,
  Typography,
} from './spacing';

export { Colors, Spacing, Radius, BorderRadius, Typography, IconSize, Duration, Shadow, Shadows };

// ─── Typography families ───────────────────────────────────────────────────────
export const Font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const Type = {
  display: {
    fontFamily: Font.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.7,
  },
  h1: {
    fontFamily: Font.bold,
    fontSize: 25,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: Font.semibold,
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: -0.35,
  },
  h3: {
    fontFamily: Font.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: 14.5,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: Font.medium,
    fontSize: 14.5,
    lineHeight: 22,
  },
  small: {
    fontFamily: Font.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  smallStrong: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Font.medium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
  },
  button: {
    fontFamily: Font.semibold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  price: {
    fontFamily: Font.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
} satisfies Record<string, TextStyle>;

// ─── Gradients ─────────────────────────────────────────────────────────────────
export const Gradients = {
  /** Brand rose — heroes, primary CTA blocks */
  brand: ['#C6949D', '#B5838D', '#8F5A64'] as const,
  /** Deep rose — dramatic hero cards */
  brandDeep: ['#B5838D', '#96626C', '#6B3A42'] as const,
  /** Soft blush — subtle washes */
  blush: ['#FDF7F8', '#F6E8EA'] as const,
  /** Sage — secondary blocks, wellness */
  sage: ['#BFCDBA', '#A8B8A3', '#8AA189'] as const,
  /** Mint wash */
  mint: ['#F2F7F0', '#E3EDE0'] as const,
  /** Warm ivory page background */
  warm: ['#FDF9F5', '#FAF7F4'] as const,
  /** Ink — dark editorial blocks */
  ink: ['#3C3F5C', '#2B2D42'] as const,
  /** Amber — warnings, low stock */
  amber: ['#E7C392', '#D4A96A'] as const,
  /** Info blue */
  info: ['#A8C3DC', '#7A9DC0'] as const,
  /** Frosted glass bar */
  glass: ['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.72)'] as const,
} as const;

// ─── Elevation (web-safe, no deprecated shadow props) ─────────────────────────
function shadow(web: string, native: ViewStyle): ViewStyle {
  return Platform.OS === 'web' ? { boxShadow: web } : native;
}

export const Elevation: Record<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'brand', ViewStyle> = {
  none: {},
  xs: shadow('0 1px 2px rgba(43,45,66,0.05)', {
    shadowColor: '#2B2D42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }),
  sm: shadow('0 2px 10px rgba(43,45,66,0.06)', {
    shadowColor: '#2B2D42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  }),
  md: shadow('0 8px 24px rgba(43,45,66,0.08)', {
    shadowColor: '#2B2D42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  }),
  lg: shadow('0 16px 40px rgba(43,45,66,0.12)', {
    shadowColor: '#2B2D42',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 8,
  }),
  brand: shadow('0 12px 28px rgba(181,131,141,0.32)', {
    shadowColor: '#B5838D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 6,
  }),
};

// ─── Surfaces ──────────────────────────────────────────────────────────────────
export const Surfaces = {
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xl,
  } satisfies ViewStyle,
  glass: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  } satisfies ViewStyle,
  inset: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
  } satisfies ViewStyle,
};

// ─── Motion ────────────────────────────────────────────────────────────────────
export const Motion = {
  spring: { damping: 18, stiffness: 220, mass: 0.6 },
  duration: Duration,
  pressScale: 0.97,
} as const;

export const Layout = {
  screenPadding: 20,
  cardRadius: Radius.xl,
  tabBarHeight: 74,
  maxContentWidth: 520,
} as const;
