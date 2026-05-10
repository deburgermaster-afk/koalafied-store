import { CheckoutFlow } from "@/components/CheckoutFlow";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 lg:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Checkout</h1>
        <p className="text-muted">
          Complete your order with your shipping address and payment information.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutFlow />
        </div>
        
        <div className="bg-[#f8f8f6] p-6 h-fit rounded border border-line">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-muted">
            <p>Your cart items will appear here</p>
            <div className="border-t border-line pt-3 mt-3">
              <div className="flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span>$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
