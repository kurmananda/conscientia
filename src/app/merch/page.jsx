import SimplePageShell from '../components/SimplePageShell';
import MerchSection from '../accommodation/MerchSection';

export const metadata = {
  title: 'Merch | Conscientia IIST',
  description: 'Grab official Conscientia merch — the annual technical festival at IIST.',
};

export default function MerchPage() {
  return (
    <SimplePageShell
      title="Merch"
      subtitle="Gear up with official Conscientia merchandise."
    >
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 text-slate-100">
        <MerchSection />
      </div>
    </SimplePageShell>
  );
}
