import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CursorTrialWrapper from "./components/CursorTrialWrapper";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-white antialiased">
        <CursorTrialWrapper />
        <Navbar />
        <div className="h-[10vh] shrink-0 bg-transparent" aria-hidden />
        <main className="min-h-0">{children}</main>
        <Footer />
      </body>
    </html>
  )
}