import { riskColors, webPalette, mobilePalette } from './colors';
import { typography } from './typography';
import { radii, spacing } from './spacing';

export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        risk: riskColors,
        web: webPalette,
        mobile: mobilePalette,
      },
      borderRadius: radii,
      spacing: spacing,
      fontFamily: {
        sans: [typography.fontFamilies.sans],
        heading: [typography.fontFamilies.heading],
      },
      fontSize: typography.fontSizes,
      fontWeight: typography.fontWeights,
    },
  },
};
