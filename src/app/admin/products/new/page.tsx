import { requireAdmin } from "@/lib/admin";
import { NewProductForm } from "@/components/admin/NewProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 lg:py-10">
      <h1 className="h-display text-2xl sm:text-3xl mb-2">New product</h1>
      <p className="text-sm text-muted mb-8">
        Add a product manually. Images upload to{" "}
        <code className="bg-[#f5f4f0] px-1">imgbb.com</code> (free) when
        <code className="bg-[#f5f4f0] px-1 mx-1">IMGBB_API_KEY</code> is set,
        otherwise they save locally for development.
      </p>
      <NewProductForm />
    </div>
  );
}
