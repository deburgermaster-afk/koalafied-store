import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Admin — Koalafied" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 sm:px-6 py-24">
      <h1 className="h-display text-3xl mb-6">Admin login</h1>
      <LoginForm />
    </div>
  );
}
