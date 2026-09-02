// Simple cn utility
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getTrendIcon(trend: string): string {
  if (trend === 'INCREASING') return '↑';
  if (trend === 'DECREASING') return '↓';
  if (trend === 'VOLATILE') return '⚡';
  return '→';
}

export function getTrendColor(trend: string): string {
  if (trend === 'INCREASING') return 'text-green-600';
  if (trend === 'DECREASING') return 'text-red-500';
  if (trend === 'VOLATILE') return 'text-yellow-600';
  return 'text-gray-600';
}

export function getDecisionColor(decision: string): string {
  switch (decision) {
    case 'SELL_NOW': return 'text-green-600 bg-green-50';
    case 'STORE': return 'text-blue-600 bg-blue-50';
    case 'SELL_PARTIALLY': return 'text-yellow-700 bg-yellow-50';
    case 'WAIT_AND_MONITOR': return 'text-purple-600 bg-purple-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getDecisionLabel(decision: string): string {
  switch (decision) {
    case 'SELL_NOW': return 'Sell Now';
    case 'STORE': return 'Consider Storing';
    case 'SELL_PARTIALLY': return 'Sell Partially';
    case 'WAIT_AND_MONITOR': return 'Wait & Monitor';
    default: return decision;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-700';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
    case 'ACCEPTED': case 'CONFIRMED': return 'bg-teal-100 text-teal-700';
    case 'OFFER_SENT': case 'OFFER_CREATED': return 'bg-yellow-100 text-yellow-700';
    case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-700';
    case 'DISPUTED': return 'bg-orange-100 text-orange-700';
    case 'EXPIRED': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
}
