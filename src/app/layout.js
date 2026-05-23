
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import "./globals.css";



export const metadata = {
  title: "Conscientia IIST",
  description: "Technical Fest 2026 of Indian Institute of Space Science and Technology",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-white antialiased">

        <Navbar />
        <div className="h-[10vh] shrink-0 bg-transparent" aria-hidden />

        <main className="min-h-0">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  )
}