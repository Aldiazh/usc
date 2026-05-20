import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      "colors": {
          "on-tertiary-container": "#ffe2d5",
          "surface-container-highest": "#353436",
          "error-container": "#93000a",
          "surface-container": "#1f1f20",
          "primary": "#d0bcff",
          "on-primary-container": "#eee3ff",
          "error": "#ffb4ab",
          "on-primary-fixed": "#23005c",
          "surface-dim": "#131314",
          "on-surface": "#e5e2e3",
          "on-tertiary-fixed": "#341100",
          "primary-fixed": "#e9ddff",
          "surface-container-high": "#2a2a2b",
          "secondary-container": "#ffc703",
          "primary-fixed-dim": "#d0bcff",
          "secondary-fixed-dim": "#f5bf00",
          "inverse-surface": "#e5e2e3",
          "surface-container-lowest": "#0e0e0f",
          "surface-variant": "#353436",
          "tertiary-container": "#ad4a00",
          "tertiary-fixed-dim": "#ffb691",
          "on-secondary": "#3e2e00",
          "on-primary-fixed-variant": "#5600ca",
          "on-secondary-container": "#6e5400",
          "on-error-container": "#ffdad6",
          "on-tertiary-fixed-variant": "#783100",
          "tertiary-fixed": "#ffdbcb",
          "on-surface-variant": "#ccc3d9",
          "on-tertiary": "#552100",
          "secondary": "#ffe9b9",
          "surface-tint": "#d0bcff",
          "inverse-on-surface": "#303031",
          "on-primary": "#3c0091",
          "on-error": "#690005",
          "on-secondary-fixed": "#251a00",
          "on-background": "#e5e2e3",
          "surface": "#131314",
          "surface-bright": "#39393a",
          "primary-container": "#7a33ff",
          "tertiary": "#ffb691",
          "secondary-fixed": "#ffdf94",
          "surface-container-low": "#1b1b1c",
          "on-secondary-fixed-variant": "#594400",
          "inverse-primary": "#7022f5",
          "outline-variant": "#4a4456",
          "outline": "#958da2",
          "background": "#131314"
      },
      "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
      },
      "spacing": {
          "stack-lg": "32px",
          "stack-md": "16px",
          "stack-sm": "8px",
          "gutter": "16px",
          "container-padding": "24px",
          "unit": "8px"
      },
      "fontFamily": {
          "display-xl": ["Lexend", "sans-serif"],
          "label-mono": ["Space Grotesk", "sans-serif"],
          "display-lg": ["Lexend", "sans-serif"],
          "headline-md": ["Lexend", "sans-serif"],
          "body-md": ["Plus Jakarta Sans", "sans-serif"],
          "body-lg": ["Plus Jakarta Sans", "sans-serif"]
      },
      "fontSize": {
          "display-xl": ["80px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800" }],
          "label-mono": ["14px", { "lineHeight": "1.0", "fontWeight": "600" }],
          "display-lg": ["48px", { "lineHeight": "1.2", "fontWeight": "800" }],
          "headline-md": ["32px", { "lineHeight": "1.3", "fontWeight": "700" }],
          "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
          "body-lg": ["20px", { "lineHeight": "1.6", "fontWeight": "500" }]
      }
    }
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
