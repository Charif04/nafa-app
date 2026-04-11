import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Currency, OrderStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: Currency = 'FCFA'): string {
  const formatters: Record<Currency, Intl.NumberFormat> = {
    FCFA: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }),
    EUR: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    CEDIS: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }),
  };
  return formatters[currency].format(amount);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    placed: 'Commande passée',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    in_transit_warehouse: 'En route vers l\'entrepôt',
    at_warehouse: 'À l\'entrepôt',
    delivering: 'En cours de livraison',
    delivered: 'Livré',
    cancelled: 'Annulé',
  };
  return labels[status];
}

export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    placed: 'bg-gray-400',
    confirmed: 'bg-blue-500',
    preparing: 'bg-yellow-500',
    in_transit_warehouse: 'bg-orange-500',
    at_warehouse: 'bg-indigo-500',
    delivering: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
  };
  return colors[status];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export const FREE_DELIVERY_THRESHOLD = 15000;

// Prix que le client voit = prix vendeur + commission NAFA (10%)
export function clientPrice(vendorPrice: number): number {
  return Math.round(vendorPrice * 1.1);
}

export function calculateDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 2500;
}

export const NAFA_COMMISSION_RATE = 0.10;

export function calculateCommission(amount: number): number {
  return Math.round(amount * NAFA_COMMISSION_RATE);
}
