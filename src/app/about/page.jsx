import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'About | Conscientia IIST',
  description: 'About Conscientia — the annual technical festival at IIST.',
};

export default function AboutPage() {
  return (
    <SimplePageShell
      title="About Conscientia"
      subtitle="India’s Institute of Space Science and Technology celebrates ideas that orbit the future — from rocketry to machine intelligence."
    >
      <p>
        This page is a placeholder while we finalize copy and media. Conscientia is the annual
        technical festival of IIST, bringing together students, researchers, and industry for
        workshops, competitions, and talks at the intersection of space and technology.
      </p>
      <p>
        Expect timelines for flagship events, leadership bios, and archival highlights from past
        editions — all coming soon.
      </p>
    </SimplePageShell>
  );
}
