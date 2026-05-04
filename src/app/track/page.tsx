import { TrackForm } from "@/components/TrackForm";

export const metadata = { title: "Track Order — Koalafied" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-16">
      <h1 className="h-display text-4xl md:text-5xl mb-3">Track your order</h1>
      <p className="text-muted mb-8">
        Enter your Australia Post tracking number to see live delivery updates.
      </p>
      <TrackForm />
    </div>
  );
}
