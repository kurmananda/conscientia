import SimplePageShell from '../components/SimplePageShell';
import Link from "next/link";

export const metadata = {
  title: 'Events | Conscientia IIST',
  description: 'Flagship events and competitions at Conscientia.',
};

const events = [
  {
    id: 1,
    title: "CanSat 2026",
    date: "Not Fixed",
    description: "Description here.",
    image: "https://media.istockphoto.com/id/1187641861/photo/delivery-of-coffee-drink-using-a-flying-drone-3d-rendering.jpg",
  },
  {
    id: 2,
    title: "RoboWar",
    date: "Not Fixed",
    description: "Description here.",
    image: "https://media.istockphoto.com/id/454265823/photo/mini-robot-wars.jpg",
  },
  {
    id: 3,
    title: "Line Follower",
    date: "Not Fixed",
    description: "Description here.",
    image: "https://images.unsplash.com/photo-1612338762643-298feee70520",
  },
  {
    id: 4,
    title: "Ardruino Hackathon",
    date: "Not Fixed",
    description: "Description here.",
    image: "https://media.istockphoto.com/id/1297353532/photo/open-source-hardware-and-software-uno-with-external-power-supply-plug-connected-for.jpg",
  },
];

export default function EventsPage() {
  return (
    <SimplePageShell
      title="Events"
      subtitle="Competitions, talks, and flagship experiences — schedule and registration links will live here."
    >
      <div className="grid gap-15
        grid-cols-1
        sm:grid-cols-2 
        lg:grid-cols-3">

        {events.map((event) => (
          <div
            key={event.id}
            className="min-h-[320px] min-w-[250px] group relative rounded-2xl
            border border-cyan-400/80
            bg-black cursor-pointer"
          >
          {/*for glow*/}                
          <div className="absolute -inset-1 rounded-2xl pointer-events-none
          opacity-0 group-hover:opacity-100 transition-[opacity,shadow] duration-300
          shadow-[0_0_20px_5px_rgba(34,211,238,0.8)]
          hover:shadow-[0_0_40px_20px_rgba(34,211,238,1)]" />

            <div className="min-h-[320px] min-w-[250px] relative overflow-hidden rounded-2xl">
              {/* IMAGE */}
              <img
                src={event.image}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover 
                transition duration-300 ease-out 
                group-hover:scale-110"
              />

              {/* DARK OVERLAY */}
              <div className="absolute inset-0 bg-black/40 
                opacity-60 group-hover:opacity-100 
                transition duration-300" />

              {/* CONTENT (BOTTOM → SLIDE UP) */}
              <div className="absolute bottom-0 left-0 right-0 p-6
                translate-y-6 opacity-0 
                group-hover:translate-y-0 group-hover:opacity-100 
                transition-[transform,opacity] duration-300 ease-out">
                
                <h2 className="text-xl font-bold text-white">
                  {event.title}
                </h2>

                <p className="text-s text-cyan-400 mt-1">
                  {event.date}
                </p>

                <p className="text-sm text-white/70 mt-2 ">
                  {event.description}
                </p>

                <Link href="/random-page">
                  <button className="mt-3 px-4 py-2 text-sm rounded-full 
                  bg-white text-black font-medium 
                  hover:bg-gray-200 transition cursor-pointer">
                  Register
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SimplePageShell>
  );
}
