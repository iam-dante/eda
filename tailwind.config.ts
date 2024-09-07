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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
    fontFamily: {
      //sans: ["Poppins", "sans-serif"],
      sans: ["DM Sans", "sans-serif"],
      jet: ["JetBrains Mono", "sans-serif"],
    },
  },
  plugins: [],
};
export default config;
