"use client";
import { useState } from "react";
export function CopyUrl({ url }: { url: string }) { const [c, setC] = useState(false); return <button type="button" onClick={async () => { await navigator.clipboard.writeText(url); setC(true); setTimeout(() => setC(false), 1500); }} className="text-[12px] font-semibold text-brand hover:underline">{c ? "Copied!" : "Copy URL"}</button>; }
