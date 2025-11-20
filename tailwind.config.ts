import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B3D15",
        foreground: "#FFFFFF",
        primary: "#C5A028",
        "deep-green": "#0B3D15",
        "dark-gold": "#C5A028",
      },
    },
  },
  plugins: [],
};
export default config;

