import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'Contact Us | Conscientia IIST',
  description: 'Reach the Conscientia organizing team.',
};

export default function ContactPage() {
  return (
    <SimplePageShell
      title="Contact Us"
      subtitle="for any inquiries, collaborations or queries related to Conscientia, feel free to reach out to us through the following contacts."
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">Core Organizing Team</h3>
          <ul className="space-y-4 text-white/80">
            <li className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-white/40">Chief Coordinator</span>
              <span className="text-lg text-cyan-400/90">Niranjan Patil</span>
              <a href="tel:+919881416709" className="text-sm hover:text-white transition-colors">
                +91 98814 16709
              </a>
            </li>

            <li className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-white/40">Workshop Head</span>
              <span className="text-lg text-cyan-400/90">Aryan Thakur</span>
              <a href="tel:+917518914396" className="text-sm hover:text-white transition-colors">
                +91 751 891 4396
              </a>
            </li>

            <li className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-white/40">Web Development Head</span>
              <span className="text-lg text-cyan-400/90">Kurmananda</span>
              <a href="tel:+919491978534" className="text-sm hover:text-white transition-colors">
                +91 94919 78534
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-white/60 text-sm">
            General inquiries: <span className="text-cyan-400/90">conscientiateamiist@gmail.com</span>
          </p>
        </div>
      </div>
    </SimplePageShell>
  );
}