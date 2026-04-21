'use client';

import { useTokenFromUrl } from '../hooks/useTokenFromUrl';

export function TokenExtractor() {
  useTokenFromUrl();
  return null;
}