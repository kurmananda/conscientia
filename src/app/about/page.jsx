import HorizontalAbout from "./components/horizontalAbout";
import AboutBackground from "./components/AboutBackground";

export const metadata = {
  title: "About | Conscientia IIST",
  description: "About Conscientia - Annual Technical Festival of IIST",
};

const stats = [
  {
    number: "3000+",
    title: "Footfall",
  },
  {
    number: "20+",
    title: "Events",
  },
  {
    number: "20+",
    title: "Workshops",
  },
  {
    number:"1000+",
    title: "Participants",
  }
];

const contacts = [
  {
    title: "Email",
    value: "contact@conscientia.in",
  },
  {
    title: "Phone",
    value: "+91 XXXXX XXXXX",
  },
  {
    title: "Instagram",
    value: "@conscientia_iist",
  },
];

export default function AboutPage() {
  return (
    <div className="relative text-white select-none">

      <AboutBackground />

      <div className="relative z-10">

      {/* ================= HERO ================= */}

      <section className="relative h-[90vh] overflow-hidden">

        <div className="relative z-10 h-full flex items-center justify-center">

          <div className="max-w-5xl px-6 text-center">

            <p className="uppercase tracking-[8px] text-cyan-400 text-sm mb-5">
              ABOUT
            </p>

            <h1 className="font-display text-6xl md:text-8xl font-bold mb-6">
              CONSCIENTIA
            </h1>

            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-8">
              Conscientia is the annual technical festival of the Indian Institute
              of Space Science and Technology, celebrating innovation, research,
              engineering excellence and the limitless curiosity that drives
              humanity towards the future.
            </p>

          </div>

        </div>

      </section>



      {/* ================= STATS ================= */}

      <section className="max-w-7xl mx-auto px-6 py-24">

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {stats.map((item) => (

            <div
              key={item.title}
              className="rounded-2xl border border-cyan-500/20 bg-white/5 backdrop-blur-md p-8 hover:border-cyan-400 transition duration-300 hover:-translate-y-2"
            >

              <h2 className="text-5xl font-bold text-cyan-400 mb-4">
                {item.number}
              </h2>

              <p className="uppercase tracking-widest text-gray-400">
                {item.title}
              </p>

            </div>

          ))}

        </div>

      </section>



      <HorizontalAbout />



      {/* ================= CONTACT ================= */}

      <section className="max-w-7xl mx-auto px-6 py-24">

        <div className="text-center mb-16">

          <p className="text-cyan-400 uppercase tracking-[5px]">
            Reach Us
          </p>

          <h2 className="font-display text-5xl font-bold mt-4">
            Contact Information
          </h2>

        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {contacts.map((item) => (

            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:border-cyan-400 transition"
            >

              <h3 className="text-cyan-400 text-lg mb-4">
                {item.title}
              </h3>

              <p className="text-gray-300 text-lg">
                {item.value}
              </p>

            </div>

          ))}

        </div>

      </section>

      </div>

    </div>
  );
}