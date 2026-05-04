"use client";
import { useCurrency } from "./CurrencyProvider";
import { Currency } from "@/lib/currency";

export function Price({
  cents,
  from = "AUD",
  className,
}: {
  cents: number;
  from?: Currency;
  className?: string;
}) {
  const { format } = useCurrency();
  return <span className={className}>{format(cents, from)}</span>;
}
