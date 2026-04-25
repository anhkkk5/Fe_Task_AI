/**
 * Frontend Color System
 *
 * This file re-exports the shared color configuration and provides CSS variables
 * for use in React components and global styles.
 *
 * The color system follows a 60-30-10 rule:
 * - 60% Neutral: Clean white and light gray backgrounds
 * - 30% Soft Blue: Professional blue accents inspired by MongoDB
 * - 10% Accent: Success, warning, error, and info states
 */

export const colorPalette = {
  white: "#FFFFFF",
  offWhite: "#FBFBFC",
  lightGray: "#F6F7F9",
  primaryBlue: "#1AA0B0",
  secondaryBlue: "#148F9F",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

export const designTokens = {
  backgroundPrimary: colorPalette.white,
  backgroundSecondary: colorPalette.offWhite,
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  borderLight: "#E5E7EB",
};

/**
 * CSS Variables String
 *
 * Defines all CSS custom properties for the color system.
 * These variables can be injected into global styles and used throughout
 * React components via var(--color-*) syntax.
 *
 * This approach provides:
 * - Single source of truth for colors
 * - Easy theme switching capability
 * - Dynamic color updates without code changes
 * - Better maintainability and scalability
 */
export const cssVariables = `
  :root {
    /* Neutral Colors (60%) */
    --color-white: #FFFFFF;
    --color-off-white: #FBFBFC;
    --color-light-gray: #F6F7F9;
    --color-medium-light-gray: #EEF0F3;
    --color-light-border-gray: #E5E7EB;

    /* Primary Teal (30%) - legacy names kept */
    --color-primary-blue: #1AA0B0;
    --color-secondary-blue: #148F9F;
    --color-light-blue: #5FC1CD;
    --color-lighter-blue: #B5E0E6;
    --color-very-light-blue: #E8F4F6;

    /* Accent Colors (10%) */
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-error: #EF4444;
    --color-info: #3B82F6;

    /* Text Colors */
    --color-text-primary: #0F172A;
    --color-text-secondary: #475569;
    --color-text-tertiary: #64748B;
    --color-text-inverse: #FFFFFF;

    /* Component Tokens - Backgrounds */
    --background-primary: #FFFFFF;
    --background-secondary: #FBFBFC;
    --background-tertiary: #F6F7F9;

    /* Component Tokens - Buttons */
    --button-primary-bg: #1AA0B0;
    --button-primary-bg-hover: #148F9F;
    --button-primary-text: #FFFFFF;
    --button-secondary-bg: #F6F7F9;
    --button-secondary-bg-hover: #EEF0F3;
    --button-secondary-text: #0F7985;
    --button-disabled-bg: #EEF0F3;
    --button-disabled-text: #94A3B8;

    /* Component Tokens - Cards */
    --card-bg: #FFFFFF;
    --card-border: #E5E7EB;
    --card-shadow: rgba(15, 23, 42, 0.04);

    /* Component Tokens - Borders */
    --border-light: #E5E7EB;
    --border-medium: #EEF0F3;

    /* Component Tokens - States */
    --state-success: #10B981;
    --state-warning: #F59E0B;
    --state-error: #EF4444;
    --state-info: #3B82F6;
  }
`;
