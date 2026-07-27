import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'Contact Us | Conscientia IIST',
  description: 'Reach the Conscientia organizing team.',
};

const groups = [
  {
    title: 'Events and Accommodation Queries',
    people: [
      { name: 'Vedendra Vardhan', role: 'Vice Chief Coordinator', phone: '+918317658835' },
    ],
  },
  {
    title: 'Workshop Queries',
    people: [
      { name: 'Sanmitha Sree Vasudevan', role: 'Vice Chief Coordinator', phone: '+919344910089' },
    ],
  },
  {
    title: 'Finance and Merchandise Queries',
    people: [
      { name: 'Chirag Katkar', role: 'Vice Chief Coordinator', phone: '+919867771460' },
      { name: 'Sanandhu Santosh', role: 'Vice Chief Coordinator', phone: '+918848291588' },
    ],
  },
  {
    title: 'General Queries',
    people: [
      { name: 'Poonam Sachdev', role: 'Vice Chief Coordinator', phone: '+917987958121' },
      { name: 'Niranjan Patil', role: 'Chief Coordinator', phone: '+919881416709' },
    ],
  },
];

function formatPhone(e164) {
  const digits = e164.replace('+91', '');
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function ContactCard({ name, role, phone }) {
  const waNumber = phone.replace('+', '');
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 transition-colors hover:border-cyan-500/40 hover:bg-white/[0.05]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative min-w-0">
        <p className="text-base sm:text-lg font-semibold text-white break-words">{name}</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40 mt-1">{role}</p>
        <p className="text-xs sm:text-sm text-cyan-400/90 mt-2 font-mono break-all">{formatPhone(phone)}</p>

        <div className="mt-4 flex gap-3">
          <a
            href={`tel:${phone}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-black hover:bg-white transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3.5a1 1 0 011-1h3.49a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.02z" />
            </svg>
            Call
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-300 hover:bg-emerald-400/20 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98s.73-2.12 1-2.41c.24-.27.53-.34.7-.34.18 0 .35 0 .5.01.16.01.38-.06.6.46.24.57.8 1.98.87 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.3.36-.42.49-.14.14-.29.3-.13.58.17.28.75 1.24 1.62 2.01 1.11.99 2.04 1.3 2.33 1.44.28.14.45.12.62-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.7-.17 1.38z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <SimplePageShell
      title="Contact Us"
      subtitle="for any inquiries, collaborations or queries related to Conscientia, feel free to reach out to us through the following contacts."
    >
      <div className="space-y-10">
        <a
          href="mailto:support@conscientiaiist.org"
          className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent p-4 sm:p-5 hover:border-cyan-400/60 hover:from-cyan-500/15 transition-colors"
        >
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
                <path d="M3 6h18v12H3z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Email</p>
              <p className="text-sm sm:text-lg text-cyan-400/90 font-mono break-all">support@conscientiaiist.org</p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
            Send mail →
          </span>
        </a>

        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-base sm:text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="h-px flex-1 max-w-6 bg-cyan-400/50" />
              {group.title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.people.map((person) => (
                <ContactCard key={person.name} {...person} />
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-white/25 pt-4">
          Website built by Kurmananda, Shaurya
        </p>
      </div>
    </SimplePageShell>
  );
}
