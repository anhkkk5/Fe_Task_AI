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

// Re-export color palette and design tokens from shared configuration
export {
  colorPalette,
  designTokens,
} from "../../../shared/colors/colors.config";

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
    --color-off-white: #F9FAFB;
    --color-light-gray: #F5F7FA;
    --color-medium-light-gray: #E8ECEF;
    --color-light-border-gray: #D1D5DB;
    
    /* Soft Blue Colors (30%) */
    --color-primary-blue: #0066CC;
    --color-secondary-blue: #1A73E8;
    --color-light-blue: #4D94FF;
    --color-lighter-blue: #B3D9FF;
    --color-very-light-blue: #E6F0FF;
    
    /* Accent Colors (10%) */
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-error: #EF4444;
    --color-info: #3B82F6;
    
    /* Text Colors */
    --color-text-primary: #3C4043;
    --color-text-secondary: #5F6368;
    --color-text-tertiary: #70757A;
    --color-text-inverse: #FFFFFF;
    
    /* Component Tokens - Backgrounds */
    --background-primary: #FFFFFF;
    --background-secondary: #F9FAFB;
    --background-tertiary: #F5F7FA;
    
    /* Component Tokens - Buttons */
    --button-primary-bg: #0066CC;
    --button-primary-bg-hover: #1A73E8;
    --button-primary-text: #FFFFFF;
    --button-secondary-bg: #F5F7FA;
    --button-secondary-bg-hover: #E8ECEF;
    --button-secondary-text: #0066CC;
    --button-disabled-bg: #E8ECEF;
    --button-disabled-text: #D1D5DB;
    
    /* Component Tokens - Cards */
    --card-bg: #FFFFFF;
    --card-border: #D1D5DB;
    --card-shadow: rgba(0, 0, 0, 0.06);
    
    /* Component Tokens - Borders */
    --border-light: #D1D5DB;
    --border-medium: #E8ECEF;
    
    /* Component Tokens - States */
    --state-success: #10B981;
    --state-warning: #F59E0B;
    --state-error: #EF4444;
    --state-info: #3B82F6;
  }
`;
