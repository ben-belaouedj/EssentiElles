import React from 'react';
import { Tabs } from 'expo-router';
import TabBar from '../../src/components/navigation/TabBar';
import { useLang } from '../../src/hooks/useLang';

export default function MainLayout() {
  const { t } = useLang();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // The custom floating tab bar handles its own safe-area spacing.
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen name="(home)/home" options={{ title: t('home') }} />
      <Tabs.Screen name="(subs)/subscriptions" options={{ title: t('subscriptionTab') }} />
      <Tabs.Screen name="(catalog)/catalog" options={{ title: t('catalog') }} />
      <Tabs.Screen name="guides" options={{ title: t('guides') }} />
      <Tabs.Screen name="(profile)/profile" options={{ title: t('profile') }} />

      {/* Hidden routes (reachable through navigation) */}
      <Tabs.Screen name="(orders)/orders" options={{ href: null }} />
      <Tabs.Screen name="(orders)/tracking" options={{ href: null }} />
      <Tabs.Screen name="(orders)/invoices" options={{ href: null }} />
      <Tabs.Screen name="(orders)/history" options={{ href: null }} />
      <Tabs.Screen name="(catalog)/[id]" options={{ href: null }} />
      <Tabs.Screen name="(subs)/plan" options={{ href: null }} />
      <Tabs.Screen name="(profile)/settings" options={{ href: null }} />
      <Tabs.Screen name="(profile)/addresses" options={{ href: null }} />
      <Tabs.Screen name="(profile)/support" options={{ href: null }} />
      <Tabs.Screen name="(profile)/ticket" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="offers" options={{ href: null }} />
    </Tabs>
  );
}
