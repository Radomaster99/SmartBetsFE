export const BONUS_CODES_STORAGE_KEY = 'smartbets:bonus-codes';
export const BONUS_CODES_UPDATED_EVENT = 'smartbets:bonus-codes-updated';

export type BonusCodeToneId = 'emerald' | 'amber' | 'sky' | 'violet' | 'rose' | 'slate';

export type BonusCodesPageCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  featuredLabel: string;
  allLabel: string;
};

export type BonusCodeEntry = {
  id: string;
  bookmaker: string;
  badge?: string;
  offer: string;
  code: string;
  description: string;
  terms?: string;
  ctaLabel: string;
  href?: string;
  isActive: boolean;
  isFeatured: boolean;
  toneId: BonusCodeToneId;
  updatedAtUtc?: string;
};

export type BonusCodesPageConfig = {
  copy: BonusCodesPageCopy;
  entries: BonusCodeEntry[];
};

export const BONUS_CODE_TONES: Record<
  BonusCodeToneId,
  {
    label: string;
    glow: string;
    backgroundFrom: string;
    backgroundTo: string;
    borderColor: string;
    accentColor: string;
    chipBackground: string;
    chipColor: string;
    codeBackground: string;
    codeBorder: string;
    buttonBackground: string;
    buttonColor: string;
  }
> = {
  emerald: {
    label: 'Emerald',
    glow: 'rgba(0, 230, 118, 0.24)',
    backgroundFrom: '#06261b',
    backgroundTo: '#0c4434',
    borderColor: '#1a7659',
    accentColor: '#67ffba',
    chipBackground: 'rgba(0, 230, 118, 0.12)',
    chipColor: '#8dffd0',
    codeBackground: 'rgba(4, 19, 14, 0.65)',
    codeBorder: 'rgba(103, 255, 186, 0.18)',
    buttonBackground: '#b9ffd9',
    buttonColor: '#093122',
  },
  amber: {
    label: 'Amber',
    glow: 'rgba(251, 191, 36, 0.24)',
    backgroundFrom: '#31200a',
    backgroundTo: '#5d340b',
    borderColor: '#b86f1f',
    accentColor: '#ffd58a',
    chipBackground: 'rgba(251, 191, 36, 0.14)',
    chipColor: '#ffe3a6',
    codeBackground: 'rgba(31, 19, 6, 0.7)',
    codeBorder: 'rgba(255, 213, 138, 0.18)',
    buttonBackground: '#ffe7b7',
    buttonColor: '#4a2907',
  },
  sky: {
    label: 'Sky',
    glow: 'rgba(56, 189, 248, 0.22)',
    backgroundFrom: '#0b2138',
    backgroundTo: '#153f65',
    borderColor: '#3475ad',
    accentColor: '#a6e9ff',
    chipBackground: 'rgba(56, 189, 248, 0.14)',
    chipColor: '#c9f4ff',
    codeBackground: 'rgba(7, 18, 31, 0.7)',
    codeBorder: 'rgba(166, 233, 255, 0.18)',
    buttonBackground: '#d7f6ff',
    buttonColor: '#10314d',
  },
  violet: {
    label: 'Violet',
    glow: 'rgba(168, 85, 247, 0.22)',
    backgroundFrom: '#251133',
    backgroundTo: '#47206a',
    borderColor: '#8452b7',
    accentColor: '#e6c1ff',
    chipBackground: 'rgba(168, 85, 247, 0.16)',
    chipColor: '#eed5ff',
    codeBackground: 'rgba(17, 9, 25, 0.72)',
    codeBorder: 'rgba(230, 193, 255, 0.18)',
    buttonBackground: '#f3dcff',
    buttonColor: '#421965',
  },
  rose: {
    label: 'Rose',
    glow: 'rgba(244, 114, 182, 0.22)',
    backgroundFrom: '#36111e',
    backgroundTo: '#6a1f3c',
    borderColor: '#bf5b84',
    accentColor: '#ffc8de',
    chipBackground: 'rgba(244, 114, 182, 0.14)',
    chipColor: '#ffd7e7',
    codeBackground: 'rgba(27, 10, 16, 0.72)',
    codeBorder: 'rgba(255, 200, 222, 0.18)',
    buttonBackground: '#ffe0ec',
    buttonColor: '#671c3b',
  },
  slate: {
    label: 'Slate',
    glow: 'rgba(148, 163, 184, 0.18)',
    backgroundFrom: '#182231',
    backgroundTo: '#2c3f57',
    borderColor: '#5d7697',
    accentColor: '#e2edf9',
    chipBackground: 'rgba(148, 163, 184, 0.14)',
    chipColor: '#e4edf7',
    codeBackground: 'rgba(14, 20, 29, 0.72)',
    codeBorder: 'rgba(226, 237, 249, 0.18)',
    buttonBackground: '#eef5fc',
    buttonColor: '#223247',
  },
};

export const DEFAULT_BONUS_CODES_PAGE_CONFIG: BonusCodesPageConfig = {
  copy: {
    eyebrow: 'Bonus Vault',
    title: 'Casino bonus codes in one clean hub',
    subtitle:
      'Keep the latest welcome codes, claim links, and offer notes in one place. Update everything from the admin panel before sending traffic live.',
    featuredLabel: 'Featured codes',
    allLabel: 'All bonus codes',
  },
  entries: [
    {
      id: 'betano-bonus',
      bookmaker: 'Betano',
      badge: 'Ready to edit',
      offer: 'Pin your current Betano welcome code here',
      code: 'EDIT-ME',
      description: 'Swap this placeholder with the live bonus copy, code, and destination URL from the admin panel.',
      terms: 'Example slot. Update terms before pushing live.',
      ctaLabel: 'Set offer',
      href: '/go/betano?source=bonus-codes',
      isActive: true,
      isFeatured: true,
      toneId: 'amber',
    },
    {
      id: 'bet365-bonus',
      bookmaker: 'Bet365',
      badge: 'Ready to edit',
      offer: 'Use this card for your football-first sign-up code',
      code: 'EDIT-ME',
      description: 'Perfect for a flagship football offer with a short headline and one clear CTA.',
      terms: 'Example slot. Update terms before pushing live.',
      ctaLabel: 'Set offer',
      href: '/go/bet365?source=bonus-codes',
      isActive: true,
      isFeatured: true,
      toneId: 'emerald',
    },
    {
      id: 'unibet-bonus',
      bookmaker: 'Unibet',
      badge: 'Ready to edit',
      offer: 'Use this area for a second-wave code or niche campaign',
      code: 'EDIT-ME',
      description: 'Good for testing a secondary bookmaker, an exclusive code, or a short-term promo burst.',
      terms: 'Example slot. Update terms before pushing live.',
      ctaLabel: 'Set offer',
      href: '/go/unibet?source=bonus-codes',
      isActive: true,
      isFeatured: false,
      toneId: 'sky',
    },
  ],
};

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeOptionalString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeToneId(value: unknown, fallback: BonusCodeToneId): BonusCodeToneId {
  if (typeof value === 'string' && value in BONUS_CODE_TONES) {
    return value as BonusCodeToneId;
  }

  return fallback;
}

function normalizeCopy(value: unknown): BonusCodesPageCopy {
  if (!value || typeof value !== 'object') {
    return DEFAULT_BONUS_CODES_PAGE_CONFIG.copy;
  }

  const candidate = value as Record<string, unknown>;

  return {
    eyebrow: normalizeString(candidate.eyebrow, DEFAULT_BONUS_CODES_PAGE_CONFIG.copy.eyebrow),
    title: normalizeString(candidate.title, DEFAULT_BONUS_CODES_PAGE_CONFIG.copy.title),
    subtitle: normalizeString(candidate.subtitle, DEFAULT_BONUS_CODES_PAGE_CONFIG.copy.subtitle),
    featuredLabel: normalizeString(candidate.featuredLabel, DEFAULT_BONUS_CODES_PAGE_CONFIG.copy.featuredLabel),
    allLabel: normalizeString(candidate.allLabel, DEFAULT_BONUS_CODES_PAGE_CONFIG.copy.allLabel),
  };
}

function normalizeEntry(value: unknown, fallback: BonusCodeEntry): BonusCodeEntry {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const candidate = value as Record<string, unknown>;

  return {
    id: normalizeString(candidate.id, fallback.id),
    bookmaker: normalizeString(candidate.bookmaker, fallback.bookmaker),
    badge: normalizeOptionalString(candidate.badge, fallback.badge ?? ''),
    offer: normalizeString(candidate.offer, fallback.offer),
    code: normalizeString(candidate.code, fallback.code),
    description: normalizeString(candidate.description, fallback.description),
    terms: normalizeOptionalString(candidate.terms, fallback.terms ?? ''),
    ctaLabel: normalizeString(candidate.ctaLabel, fallback.ctaLabel),
    href: normalizeOptionalString(candidate.href, fallback.href ?? ''),
    isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : fallback.isActive,
    isFeatured: typeof candidate.isFeatured === 'boolean' ? candidate.isFeatured : fallback.isFeatured,
    toneId: normalizeToneId(candidate.toneId, fallback.toneId),
    updatedAtUtc:
      typeof candidate.updatedAtUtc === 'string' && candidate.updatedAtUtc.trim()
        ? candidate.updatedAtUtc
        : fallback.updatedAtUtc,
  };
}

export function readBonusCodesPageConfig(): BonusCodesPageConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_BONUS_CODES_PAGE_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(BONUS_CODES_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_BONUS_CODES_PAGE_CONFIG;
    }

    const parsed = JSON.parse(raw) as {
      copy?: unknown;
      entries?: unknown;
    };

    const parsedEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const fallbackEntries = DEFAULT_BONUS_CODES_PAGE_CONFIG.entries;
    const normalizedEntries = parsedEntries.length
      ? parsedEntries.map((entry, index) =>
          normalizeEntry(entry, fallbackEntries[index] ?? createEmptyBonusCodeEntry()),
        )
      : fallbackEntries;

    return {
      copy: normalizeCopy(parsed.copy),
      entries: normalizedEntries,
    };
  } catch {
    return DEFAULT_BONUS_CODES_PAGE_CONFIG;
  }
}

export function writeBonusCodesPageConfig(config: BonusCodesPageConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(BONUS_CODES_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(BONUS_CODES_UPDATED_EVENT));
}

function createBonusCodeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `bonus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyBonusCodeEntry(): BonusCodeEntry {
  return {
    id: createBonusCodeId(),
    bookmaker: 'New bookmaker',
    badge: 'Draft',
    offer: 'Add the current casino offer headline',
    code: 'NEWCODE',
    description: 'Describe the bonus clearly so visitors know what they are claiming.',
    terms: 'Short eligibility or wagering note.',
    ctaLabel: 'Claim offer',
    href: '',
    isActive: true,
    isFeatured: false,
    toneId: 'emerald',
    updatedAtUtc: new Date().toISOString(),
  };
}

export function sortBonusCodeEntries(entries: BonusCodeEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    return left.bookmaker.localeCompare(right.bookmaker);
  });
}
