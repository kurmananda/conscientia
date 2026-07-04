import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'Accommodation | Conscientia IIST',
  description: 'Accommodation at Conscientia — the annual technical festival at IIST.',
};

const stays = [
  {
    name: 'Hostel Block',
    tag: 'Participants · Shared',
    price: 'Included with registration',
  },
  {
    name: 'Hostel Block',
    tag: 'Participants · Shared',
    price: 'Included with registration',
  },
];

const facilities = [
  { label: 'Bedding & pillow', detail: 'Provided at check-in, one set per bed.' },
  { label: 'Drinking water', detail: 'Filtered point on the floor.' },
  { label: 'Hospitality desk', detail: 'Stationed at each entrance.' },
  { label: 'Luggage room', detail: 'For early arrivals and late departures.' },
];

const faqs = [
  {
    q: 'Sample Question 1?',
    a: 'Sample Answer 1.',
  },
  {
    q: 'Sample Question 2?',
    a: 'Sample Answer 2.',
  },
  {
    q: 'Sample Question 3?',
    a: 'Sample Answer 3.',
  },
  {
    q: 'Sample Question 4?',
    a: 'Sample Answer 4.',
  },
];

export default function AccommodationPage() {
  return (
    <SimplePageShell
      title="Accommodation"
      subtitle="A berth for every traveller who crosses into Time Fall."
    >
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 text-slate-100">
        <p className="mb-10 max-w-[60ch] text-base leading-relaxed text-slate-400">
          Conscientia runs across 3 days, and every participant, speaker, needs somewhere to land in between. Accommodation is arranged in hostel blocks on the IIST campus, a walk away from all event venues — included with your registration.
        </p>

        <dl className="mb-12 grid grid-cols-1 gap-4 border-y border-slate-800 py-5 sm:grid-cols-3">
          <div>
            <dt className="mb-1 font-mono text-xs uppercase tracking-widest text-teal-400">Dates</dt>
            <dd className="text-sm">October 30,October 31,November 1  </dd>
          </div>
          <div>
            <dt className="mb-1 font-mono text-xs uppercase tracking-widest text-teal-400">Eligibility</dt>
            <dd className="text-sm">Confirmed registrants only</dd>
          </div>
          <div>
            <dt className="mb-1 font-mono text-xs uppercase tracking-widest text-teal-400">Cost</dt>
            <dd className="text-sm">Included with registration</dd>
          </div>
        </dl>

        <section className="mb-12">
          <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-teal-400">
            Where you&apos;ll stay
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stays.map((s) => (
              <article
                key={s.name}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-fuch-400">
                  {s.tag}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{s.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.capacity}</p>
                <p className="text-sm text-slate-400">{s.price}</p>
                <p className="mt-2 text-sm text-slate-200">{s.notes}</p>
              </article>
            ))}
          </div>
        </section>

        

        <section className="mb-12">
          <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-teal-400">
            What&apos;s provided
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <li
                key={f.label}
                className="rounded-lg border border-slate-800 px-4 py-3"
              >
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="mt-1 text-xs text-slate-400">{f.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-teal-400">
            Frequently asked
          </h2>
          <div>
            {faqs.map((f) => (
              <details key={f.q} className="border-b border-slate-800 py-4">
                <summary className="cursor-pointer font-semibold outline-offset-4">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

<section className="mb-12">
  <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-teal-400">
    Find your way
  </h2>
  <h1 className='text-2xl'>Closest to Accommodation:  <a className="text-[#6E2E63] font-bold underline" href="https://maps.app.goo.gl/K85EHuA8wq6HsNpK8">IIST Backgate</a></h1>
  <h1 className='text-2xl'>Closest to Event Venues:   <a className="underline font-bold text-[#6E2E63]" href="https://maps.app.goo.gl/uQpvBDeoWH45nAHJA">IIST Frontgate</a></h1>
</section>
      </div>
    </SimplePageShell>
  );
}
