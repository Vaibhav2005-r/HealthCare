"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailwindPreset = void 0;
const colors_1 = require("./colors");
const typography_1 = require("./typography");
const spacing_1 = require("./spacing");
exports.tailwindPreset = {
    theme: {
        extend: {
            colors: {
                risk: colors_1.riskColors,
                web: colors_1.webPalette,
                mobile: colors_1.mobilePalette,
            },
            borderRadius: spacing_1.radii,
            spacing: spacing_1.spacing,
            fontFamily: {
                sans: [typography_1.typography.fontFamilies.sans],
                heading: [typography_1.typography.fontFamilies.heading],
            },
            fontSize: typography_1.typography.fontSizes,
            fontWeight: typography_1.typography.fontWeights,
        },
    },
};