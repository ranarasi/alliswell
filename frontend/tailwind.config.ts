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
        primary: "#3B82F6",
        secondary: "#6B7280",
        background: "#F9FAFB",
        text: "#111827",
        green: "#10B981",
        amber: "#F59E0B",
        red: "#EF4444",
      },
    },
  },
  plugins: [],
};
export default config;
