import React from 'react';
import AppBadge, { BadgeVariant } from './AppBadge';
import { ViewStyle } from 'react-native';

interface Props {
  status: string;
  small?: boolean;
  style?: ViewStyle;
}

const MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  // Orders
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'info' },
  preparing: { label: 'Préparation', variant: 'warning' },
  shipped: { label: 'Expédiée', variant: 'primary' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
  // Subscriptions
  active: { label: 'Actif', variant: 'success' },
  paused: { label: 'En pause', variant: 'warning' },
  expired: { label: 'Expiré', variant: 'neutral' },
  // Invoices
  paid: { label: 'Payée', variant: 'success' },
  sent: { label: 'Envoyée', variant: 'info' },
  draft: { label: 'Brouillon', variant: 'neutral' },
  overdue: { label: 'En retard', variant: 'error' },
  // Support
  open: { label: 'Ouvert', variant: 'info' },
  in_progress: { label: 'En cours', variant: 'warning' },
  waiting: { label: 'En attente', variant: 'neutral' },
  resolved: { label: 'Résolu', variant: 'success' },
  closed: { label: 'Fermé', variant: 'neutral' },
};

/** Status pill shared by orders, invoices, subscriptions and tickets. */
export default function StatusBadge({ status, small = false, style }: Props) {
  const config = MAP[status] ?? { label: status, variant: 'neutral' as BadgeVariant };
  return <AppBadge label={config.label} variant={config.variant} size={small ? 'sm' : 'md'} style={style} />;
}
