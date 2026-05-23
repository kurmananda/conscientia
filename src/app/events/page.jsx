import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'Events | Conscientia IIST',
  description: 'Flagship events and competitions at Conscientia.',
};

export default function EventsPage() {
  return (
    <SimplePageShell
      title="Events"
      subtitle="Competitions, talks, and flagship experiences — schedule and registration links will live here."
    >
      <p>
        Dummy events hub. We will list track-wise competitions, keynote sessions, and cultural
        programming with TiQR or internal registration where applicable.
      </p>
      <p>
        Check back for filters by day, venue map pins, and clash-free personal schedules.
      </p>
    </SimplePageShell>
  );
}
