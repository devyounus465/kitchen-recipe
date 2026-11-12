"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return <button onClick={() => window.print()} className="btn h-11 border-2 border-ink px-5 text-[14px] text-ink hover:bg-ink hover:text-white"><Printer className="h-4 w-4" /> Print</button>;
}
