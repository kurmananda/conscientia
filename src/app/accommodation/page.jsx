import SimplePageShell from '../components/SimplePageShell';
import { SiGooglemaps } from "react-icons/si";
import AccommodationBooking from './AccommodationBooking';

export const metadata = {
  title: 'Accommodation | Conscientia IIST',
  description: 'Find accommodation info for Conscientia — the annual technical festival at IIST.',
};

const faqs = [
  {
    q: 'Who is eligible for accommodation during Conscientia 2026?',
    a: 'Accommodation is available only for registered participants of Conscientia 2026 who opt for it during the official registration process on the fest website. Participants below the age of 18 will be provided accommodation only if accompanied by a faculty member or adult guardian. A consent mail & letter may also be required during check-in.',
  },
  {
    q: 'How do I confirm my accommodation booking?',
    a: 'You must complete the accommodation request and online payment during registration. Allotment is confirmed only after successful payment.',
  },
  {
    q: 'Will I get confirmation for my accommodation?',
    a: 'Yes. Once you complete payment, a confirmation email will be sent to your registered email ID. Please bring a copy (digital or printed) when checking in.',
  },
  {
    q: 'What documents do I need to carry during check-in?',
    a: 'Participants are required to carry: a valid college ID card, Aadhaar card, and a (digital or printed) copy of the accommodation confirmation.',
  },
  {
    q: 'Where will the accommodation be provided?',
    a: 'Accommodation will be arranged in IIST hostels (on-campus) or in partnered lodging facilities (off-campus), depending on availability. Buses will be arranged from accommodation to IIST and from IIST to accommodation.',
  },
  {
    q: 'What are the check-in and check-out timings?',
    a: 'Check-in: from October 29th (3pm onwards). Check-out: by 9pm on November 1st. Late arrivals must inform the hospitality team in advance.',
  },
  {
    q: 'What does one "night" of accommodation mean?',
    a: 'A night runs from 4:00 PM on the previous day to 4:00 PM on the next day. So booking the night of October 30th, for example, covers your stay from 4:00 PM on the 30th to 4:00 PM on the 31st.',
  },
  {
    q: 'How is the security deposit handled?',
    a: 'A refundable security deposit is to be paid online at the Hospitality Desk upon arrival. It will be refunded within 1 week after the fest, provided no rules are violated or damages reported.',
  },
  {
    q: 'Will food be provided with accommodation?',
    a: 'Food is not included with accommodation. Mess coupons can be purchased at the Hospitality Desk, and will be valid only for the 29th, 30th, and 31st during the fest. Food stalls will also be available across the venue.',
  },
  {
    q: 'Can I request a specific room or roommate?',
    a: 'Room/roommate preferences may be indicated; however, allotments are subject to availability and logistical constraints, and therefore cannot be guaranteed.',
  },
  {
    q: 'Can I extend my stay beyond fest dates?',
    a: 'Accommodation is only available from 29th October to 1st November. Extensions are not permitted.',
  },
  {
    q: 'Who should I contact in case of issues?',
    a: 'The Hospitality Helpdesk operates round the clock during the fest, near the front gate and hostel gate. Phone: +91 9492934422 (Neehar), +91 7075712926 (Geethika), +91 9778430881 (Fuad). Email: hospitalityconscientia2k26@gmail.com.',
  },
];

const rulesSections = [
  {
    title: 'Eligibility & Registration',
    points: [
      'Accommodation is strictly available only for registered participants of Conscientia 2026.',
      'Accommodation must be booked through the official Conscientia website during the registration process.',
      'Accommodation charges must be paid online at the time of registration.',
      'Accommodation will be confirmed only after successful payment.',
      'During check-in, participants must carry: valid college ID card, Aadhaar card (compulsory), and digital or printed accommodation confirmation.',
    ],
  },
  {
    title: 'Accommodation Type & Allotment',
    points: [
      'Participants may be accommodated on-campus or off-campus, based on availability.',
      'Accommodation will be allotted on a first-come, first-served basis.',
      'Separate accommodation will be provided for male and female participants.',
      'Roommate preferences may be considered but cannot be guaranteed.',
    ],
  },
  {
    title: 'Accommodation Duration',
    points: [
      'Accommodation will be available from October 29th to November 1st.',
      'Participants must strictly adhere to the allotted check-in and check-out timings.',
    ],
  },
  {
    title: 'Material Declaration (For Event Participants)',
    points: [
      'Participants bringing event-related materials (such as robots, circuits, tools, project components, etc.) must declare all such items during registration or at check-in.',
      'Only declared items will be permitted inside the campus.',
      'Personal belongings such as clothes, toiletries, and other daily-use items do not require declaration.',
      'Undeclared materials may be withheld by the security team until verification.',
    ],
  },
  {
    title: 'Security Deposit',
    points: [
      'A refundable security deposit will be collected from all participants opting for accommodation.',
      'The deposit must be paid at the Hospitality Desk during check-in.',
      'The deposit will be refunded during check-out after verification, provided there are no rule violations or damages to institute property.',
    ],
  },
  {
    title: 'Code of Conduct',
    points: [
      'Smoking, consumption of alcohol, narcotics, or any banned substances is strictly prohibited.',
      'Any act of indiscipline, misconduct, or damage to institute property will result in disciplinary action, penalties, or immediate eviction without refund.',
      'Participants are expected to maintain cleanliness and respect fellow participants and institute staff.',
    ],
  },
  {
    title: 'ID Cards',
    points: [
      'Accommodation ID cards will be issued during check-in.',
      'Participants must wear and carry their ID cards at all times while inside the accommodation premises and campus.',
    ],
  },
  {
    title: 'On-Campus Accommodation',
    points: [
      'Participants staying on campus must return to their allotted accommodation by 9:00 PM.',
      'Late entry will not be permitted unless prior approval has been obtained from the Hospitality Team under exceptional circumstances.',
    ],
  },
  {
    title: 'Off-Campus Accommodation',
    points: [
      'Participants staying off campus must leave the institute campus by 9:00 PM each day.',
      'Transportation between the institute and off-campus accommodation will be arranged by the Hospitality Team as per the scheduled timings.',
    ],
  },
  {
    title: 'Participants Below 18 Years of Age',
    points: [
      'Participants below 18 years must be accompanied by a faculty member or legal guardian to be eligible for accommodation.',
      'Groups comprising both male and female participants should be accompanied by both a male and a female faculty member/guardian wherever applicable.',
      'A parental/guardian consent letter may be requested during check-in.',
    ],
  },
  {
    title: 'Food & Mess Facilities',
    points: [
      'Food is not included with the accommodation package unless specifically mentioned.',
      'Mess coupons can be purchased separately at the Hospitality Help Desk.',
      'Mess services will be available on the designated fest days as announced by the Hospitality Team.',
      'Food stalls and refreshments will be available throughout the fest venue.',
    ],
  },
  {
    title: 'General Instructions',
    points: [
      'The Hospitality Team reserves the right to modify accommodation allotments due to operational requirements.',
      'Participants are responsible for safeguarding their personal belongings. The organizing committee and institute shall not be responsible for any loss or theft.',
      'All participants are expected to cooperate with volunteers, hostel authorities, and security personnel throughout the event.',
      'Failure to comply with these rules may result in cancellation of accommodation and other disciplinary action.',
    ],
  },
];

export default function AccommodationPage() {
  return (
    <SimplePageShell
      title="Accommodation"
      subtitle="Find your berth for the nights you'll spend at Time Fall."
    >
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 text-slate-100">
        <p className="section-eyebrow mb-2">
          Accommodation
        </p>
        <p className="mb-3 max-w-[60ch] text-base leading-relaxed text-slate-400">
          Conscientia runs across 3 days, and every participant, speaker, needs somewhere to land in between. Accommodation is arranged in hostel blocks on the IIST campus, a walk away from all event venues.
        </p>
        <p className="mb-10 max-w-[60ch] text-sm leading-relaxed text-slate-500">
          A room (on-campus or off-campus, based on availability) will be provided along with bedding, drinking water, a hospitality desk, and luggage storage for early arrivals and late departures. Food is not included — see the FAQs and Rules &amp; Regulations below for the full details.
        </p>

        <AccommodationBooking />

        <dl className="mb-12 grid grid-cols-1 gap-4 border-y border-white/[0.08] py-5 sm:grid-cols-3">
          <div>
            <dt className="section-eyebrow mb-1">Dates</dt>
            <dd className="text-sm">October 29, October 30, October 31, November 1</dd>
          </div>
          <div>
            <dt className="section-eyebrow mb-1">Eligibility</dt>
            <dd className="text-sm">Confirmed registrants only</dd>
          </div>
          <div>
            <dt className="section-eyebrow mb-1">Cost</dt>
            <dd className="text-sm">Included with registration</dd>
          </div>
        </dl>

        <section className="mb-12">
          <h2 className="section-eyebrow mb-5">
            Rules &amp; Regulations
          </h2>
          <div className="space-y-6">
            {rulesSections.map((section) => (
              <div key={section.title} className="glass-card rounded-xl p-5">
                <h3 className="mb-3 text-sm font-semibold text-cyan-300">{section.title}</h3>
                <ul className="space-y-2">
                  {section.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-cyan-400/70" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

<section className="mb-12">
  <h2 className="section-eyebrow mb-5">
    Find your way
  </h2>
  <h1 className='text-2xl flex items-center'>Closest to Accommodation:  <SiGooglemaps/><a className="text-[#6E2E63] font-bold underline flex items-center" href="https://maps.app.goo.gl/K85EHuA8wq6HsNpK8">IIST Backgate</a></h1>
  <h1 className='text-2xl flex items-center'>Closest to Event Venues:   <SiGooglemaps/> <a className="underline font-bold text-[#6E2E63]" href="https://maps.app.goo.gl/uQpvBDeoWH45nAHJA">IIST Frontgate</a></h1>
</section>

        <section className="mb-12">
          <h2 className="section-eyebrow mb-5">
            Frequently asked
          </h2>
          <div>
            {faqs.map((f) => (
              <details key={f.q} className="border-b border-white/[0.08] py-4">
                <summary className="cursor-pointer font-semibold outline-offset-4">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </SimplePageShell>
  );
}
