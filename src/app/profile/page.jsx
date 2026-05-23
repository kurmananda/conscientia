import Link from 'next/link';
import SimplePageShell from '../components/SimplePageShell';

export const metadata = {
  title: 'Profile | Conscientia IIST',
  description: 'Your Conscientia profile and registrations.',
};

export default function ProfilePage() {
  return (
    <SimplePageShell
      title="Profile"
      subtitle="A single place for tickets, workshop access, and fest credentials — under construction."
    >
      <p>
        This profile area is a placeholder. Workshop purchases and dashboard state currently live
        on the{' '}
        <Link href="/online-workshops" className="text-cyan-400 underline-offset-4 hover:underline">
          online workshops
        </Link>{' '}
        page after you verify your email.
      </p>
      <p>
        Future: SSO with institute email, QR check-in, and downloadable invoices.
      </p>
    </SimplePageShell>
  );
}
