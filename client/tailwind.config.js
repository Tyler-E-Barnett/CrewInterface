/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
      colors: {
        cardColor: "#141516",
        cardBorder: "#363b3d",
        containerColor: "#000000",
        pageColor: "#eaeaea",
        pageDark: "#2f2f2f",
        backgroundLight: "#ececec",
        backgroundDark: "#2f2f2f",
        primary: "#11a5e9",
        primaryLight: "#81d1f4",
        primaryDark: "#0773b3",
        primaryVar: "#085985",
        secondary: "#d1d5dc",
        secondaryVar: "#384151",
        secondaryVarLight: "#818b9c",
        complimentary: "#e95511",
        surface: "#f0f0f0",
        error: "#dc2726",
        onPrimary: "#ffffff",
        onSecondary: "#000000",
        onSecondaryVar: "#ffffff",
        onBackground: "#000000",
        onSurface: "#000000",
        onError: "#ffffff",
      },
    },
  },
  plugins: [],
};
