"use client";
import { useState } from "react";
import { Share2, Link2, Mail, Check } from "lucide-react";
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false); const [copied, setCopied] = useState(false);
  const full = typeof window !== "undefined" ? new URL(url, window.location.origin).toString() : url;
  async function share() {
    if (navigator.share) { try { await navigator.share({ title, url: full }); return; } catch { /* cancelled */ } }
    setOpen(!open);
  }
  const enc = encodeURIComponent;
  return (
    <div className="relative">
      <button onClick={share} className="btn h-11 border-2 border-ink px-5 text-[14px] text-ink hover:bg-ink hover:text-white"><Share2 className="h-4 w-4" /> Share</button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-lg border border-rule bg-white py-2 shadow-pop">
          {[["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(full)}`], ["Pinterest", `https://pinterest.com/pin/create/button/?url=${enc(full)}&description=${enc(title)}`], ["X (Twitter)", `https://twitter.com/intent/tweet?url=${enc(full)}&text=${enc(title)}`]].map(([l, h]) => (
            <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-[15px] hover:bg-tint">{l}</a>
          ))}
          <a href={`mailto:?subject=${enc(title)}&body=${enc(full)}`} className="flex items-center gap-2 px-4 py-2 text-[15px] hover:bg-tint"><Mail className="h-4 w-4" />Email</a>
          <button onClick={async () => { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[15px] hover:bg-tint">
            {copied ? <Check className="h-4 w-4 text-green-700" /> : <Link2 className="h-4 w-4" />}{copied ? "Link copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
