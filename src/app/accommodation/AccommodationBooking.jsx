export default function AccommodationBooking() {
  return (
    <section className="mb-12">
      <div className="glass-card flex flex-col gap-3 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Accommodation and food booking</p>
            <p className="mt-1 text-xs text-slate-400">
              Accommodation and meal bookings are currently closed.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-amber-200">
            Closed
          </span>
        </div>
      </div>
    </section>
  );
}
