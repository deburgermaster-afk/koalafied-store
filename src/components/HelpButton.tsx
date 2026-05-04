"use client";

type Props = {
  orderId?: number;
  topic?: "general" | "order" | "refund" | "shipping" | "product";
  className?: string;
  children?: React.ReactNode;
};

export function HelpButton({
  orderId,
  topic = "order",
  className = "",
  children,
}: Props) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("koalafied:open-chat", {
            detail: {
              orderId: orderId ? String(orderId) : "",
              topic,
              prefill: orderId
                ? `Hi, I need help with order #${orderId}: `
                : "Hi, I need help: ",
            },
          })
        )
      }
      className={
        className ||
        "inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8 border border-line bg-white hover:bg-[#f5f4f0]"
      }
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      {children ?? "Help with this order"}
    </button>
  );
}
