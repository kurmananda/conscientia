import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'About | Conscientia IIST',
  description: 'About Conscientia, the annual techno-cultural fest of IIST.',
};

const domains = [
  { title: 'Artificial Intelligence', description: 'ML, deep learning, computer vision, NLP and generative AI.' },
  { title: 'Space Technology', description: 'CubeSats, satellite systems, embedded electronics and aerospace research.' },
  { title: 'Software Development', description: 'Full-stack apps, cloud, APIs and scalable systems.' },
  { title: 'Robotics', description: 'Autonomous systems, control, mechatronics and competitive bots.' },
  { title: 'Research & Innovation', description: 'Turning ideas into real projects through experimentation and collaboration.' },
];

const values = ['Curiosity', 'Collaboration', 'Innovation', 'Impact'];

function Section({ label, title, children }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/80 mb-3">{label}</p>
      <h2 className="font-syncopate text-2xl md:text-3xl font-bold uppercase tracking-tight mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <SimplePageShell
      title="About Us"
      subtitle="Conscientia is the annual techno-cultural fest of the Indian Institute of Space Science and Technology (IIST) — where engineering, research and creativity come together."
    >
      <div className="space-y-14">
        <Section label="Our Mission" title="We build the people who create the future">
          <p className="text-white/60 leading-relaxed max-w-2xl">
            Conscientia is a student-driven event where workshops, hands-on events and
            open competitions turn classroom curiosity into research, collaboration,
            engineering and real-world impact.
          </p>
        </Section>

        <Section label="What We Do" title="Our Domains">
          <div className="grid gap-4 sm:grid-cols-2">
            {domains.map((domain, i) => (
              <div
                key={domain.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 hover:bg-white/[0.05] transition-colors"
              >
                <span className="font-mono text-xs text-cyan-400/60">0{i + 1}</span>
                <h3 className="text-white font-semibold mt-1 mb-1.5">{domain.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{domain.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Our Philosophy" title="The values that define us">
          <div className="flex flex-wrap gap-3">
            {values.map((value) => (
              <span
                key={value}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-2 text-sm text-cyan-300"
              >
                {value}
              </span>
            ))}
          </div>
        </Section>
      </div>
    </SimplePageShell>
  );
}
