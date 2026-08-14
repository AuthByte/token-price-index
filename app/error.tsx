"use client";

export default function ErrorView({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5">
      <h1 className="display text-5xl italic">The tape is jammed</h1>
      <p className="mt-4 text-lg text-ink-soft">
        OpenRouter did not return rankings or prices. {error.message}
      </p>
    </div>
  );
}
