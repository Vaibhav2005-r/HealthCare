import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { riskColors } from '@smarthealth/design-tokens';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskTier(score: number): { tier: 'GREEN' | 'AMBER' | 'RED'; color: string } {
  if (score < 0.35) {
    return { tier: 'GREEN', color: riskColors.green };
  } else if (score < 0.70) {
    return { tier: 'AMBER', color: riskColors.amber };
  } else {
    return { tier: 'RED', color: riskColors.red };
  }
}

