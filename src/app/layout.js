import {
  Space_Grotesk,
  Orbitron,
  JetBrains_Mono,
  Noto_Sans,
  Bebas_Neue,
  Alfa_Slab_One,
  Anton,
  Rubik_Mono_One,
} from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CursorTrialWrapper from "./components/CursorTrialWrapper";
import ProfileCompletionModal from "./components/ProfileCompletionModal";
import NetworkStatusToast from "./components/NetworkStatusToast";
import CartToast from "./components/CartToast";
import FetchTracker from "./components/FetchTracker";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { MusicProvider } from "./context/MusicContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const orbitron = Orbitron({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Events pages typography: Noto Sans / Bebas Neue for descriptions and body
// copy, Alfa Slab One / Anton for headings, Rubik Mono One for the event
// name on the detail page.
const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa",
  display: "swap",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const rubikMonoOne = Rubik_Mono_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rubikmono",
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${orbitron.variable} ${jetbrainsMono.variable} ${notoSans.variable} ${bebasNeue.variable} ${alfaSlabOne.variable} ${anton.variable} ${rubikMonoOne.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.cdnfonts.com/css/black-mustang"
          rel="stylesheet"
        />
        <link
          href="https://fonts.cdnfonts.com/css/bad-coma"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-black text-white antialiased">
        <AuthProvider>
          <CartProvider>
            <MusicProvider>
              <CursorTrialWrapper />
              <ProfileCompletionModal />
              <NetworkStatusToast />
              <CartToast />
              <FetchTracker />
              <Navbar />
              <div className="h-[10vh] shrink-0 bg-transparent" aria-hidden />
              <main className="relative min-h-0">{children}</main>
              <Footer />
            </MusicProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
