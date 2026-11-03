import { Amiri, Cormorant_Garamond, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri" });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-plex-arabic" });

export const fontVariables = `${cormorant.variable} ${manrope.variable} ${amiri.variable} ${plexArabic.variable}`;
