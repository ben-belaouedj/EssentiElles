/**
 * Design System v2 — token contract.
 *
 * These tests lock the public shape of the tokens so screens can rely on
 * them: gradients must be non-empty colour tuples, radii/scale must stay
 * ordered, and every legacy alias must still resolve.
 */
import { Colors, Gradients, Elevation, Font, Layout, Motion, Radius, Spacing, Surfaces, Type } from '../theme';
import { BorderRadius } from '../spacing';

describe('Design tokens', () => {
  it('keeps the brand palette', () => {
    expect(Colors.primary).toBe('#B5838D');
    expect(Colors.background).toBe('#FAF7F4');
    expect(Colors.surface).toBe('#FFFFFF');
    expect(Colors.accent).toBe('#A8B8A3');
    expect(Colors.border).toBe('#E8E1DB');
  });

  it('exposes every gradient as a non-empty tuple of colours', () => {
    Object.entries(Gradients).forEach(([name, stops]) => {
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBeGreaterThanOrEqual(2);
      stops.forEach((stop) => expect(typeof stop).toBe('string'));
      expect(name).toBeTruthy();
    });
  });

  it('uses Poppins families only', () => {
    Object.values(Font).forEach((family) => expect(family).toMatch(/^Poppins_/));
  });

  it('orders the spacing scale', () => {
    expect(Spacing.xxs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.xxl);
  });

  it('orders the radius scale and keeps rounded cards at 20–24', () => {
    expect(Radius.sm).toBeLessThan(Radius.lg);
    expect(Radius.lg).toBeLessThan(Radius.xxl);
    expect([20, 24]).toContain(Radius.lg);
    expect([20, 24]).toContain(Radius.xl);
    expect(Radius.full).toBeGreaterThanOrEqual(999);
  });

  it('keeps the deprecated BorderRadius alias wired to Radius', () => {
    expect(BorderRadius.md).toBe(Radius.md);
    expect(BorderRadius.pill).toBe(Radius.full);
  });

  it('describes typography with family, size and line height', () => {
    (Object.keys(Type) as Array<keyof typeof Type>).forEach((key) => {
      const style = Type[key];
      expect(style.fontFamily).toBeTruthy();
      expect(style.fontSize).toBeGreaterThan(9);
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
    });
  });

  it('defines elevation levels used by cards and CTAs', () => {
    ['none', 'xs', 'sm', 'md', 'lg', 'brand'].forEach((level) => {
      expect(Elevation).toHaveProperty(level);
      expect(Elevation[level as keyof typeof Elevation]).toBeDefined();
    });
  });

  it('exposes the layout and motion constants used by the shell', () => {
    expect(Layout.screenPadding).toBe(20);
    expect(Layout.tabBarHeight).toBeGreaterThanOrEqual(70);
    expect(Layout.maxContentWidth).toBeGreaterThan(400);
    expect(Motion.spring.damping).toBeGreaterThan(0);
    expect(Surfaces).toBeDefined();
  });
});
