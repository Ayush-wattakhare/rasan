import { format, formatDistance as formatDistanceFn, formatRelative } from 'date-fns';

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  return format(new Date(date), formatStr);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceFn(new Date(date), new Date(), { addSuffix: true });
}

/**
 * Format date relative to now (e.g., "Today at 3:00 PM")
 */
export function formatRelativeDate(date: string | Date): string {
  return formatRelative(new Date(date), new Date());
}

/**
 * Format distance to now (e.g., "2 hours ago")
 */
export function formatDistanceToNow(date: string | Date): string {
  return formatDistanceFn(new Date(date), new Date(), { addSuffix: true });
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

/**
 * Format order number
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format rating to one decimal place
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Detect time of day (Morning, Afternoon, Evening, Night) from a time string
 * Supports strings like "02:00 PM", "12:30 PM", "08:00 AM", "12:00 - 12:30 PM", "14:00"
 */
export type TimeOfDayPeriod = 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Late Night';

export interface TimeOfDayInfo {
  period: TimeOfDayPeriod;
  label: string;
  description: string;
  icon: string;
  badgeClass: string;
}

export function getTimeOfDayInfo(timeStr?: string): TimeOfDayInfo {
  if (!timeStr) {
    return {
      period: 'Afternoon',
      label: 'Afternoon',
      description: 'Lunch Break',
      icon: '🌤️',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    };
  }

  const clean = timeStr.trim();
  const hasPM = /\bPM\b/i.test(clean);
  const hasAM = /\bAM\b/i.test(clean);

  const timeMatch = clean.match(/(\d{1,2}):(\d{2})/);
  let hours = 12;

  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    if (hasPM) {
      if (h < 12) h += 12;
    } else if (hasAM) {
      if (h === 12) h = 0;
    }
    hours = h;
  }

  if (hours >= 5 && hours < 12) {
    return {
      period: 'Morning',
      label: 'Morning',
      description: 'Breakfast & Morning Recess',
      icon: '☀️',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      period: 'Afternoon',
      label: 'Afternoon',
      description: 'Lunch & Afternoon Recess',
      icon: '🌤️',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    };
  } else if (hours >= 17 && hours < 21) {
    return {
      period: 'Evening',
      label: 'Evening',
      description: 'Evening Snacks & Dinner Break',
      icon: '🌇',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  } else if (hours >= 21 && hours <= 23) {
    return {
      period: 'Night',
      label: 'Night',
      description: 'Night Dinner',
      icon: '🌙',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    };
  } else {
    return {
      period: 'Late Night',
      label: 'Late Night',
      description: 'Midnight / Late Hours',
      icon: '🌌',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    };
  }
}
