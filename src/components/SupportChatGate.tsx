"use client";

import { usePathname } from "next/navigation";
import { SupportChat } from "./SupportChat";

type Props = {
  defaultEmail?: string;
  defaultName?: string;
};

export function SupportChatGate({ defaultEmail, defaultName }: Props) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <SupportChat defaultEmail={defaultEmail} defaultName={defaultName} />;
}
