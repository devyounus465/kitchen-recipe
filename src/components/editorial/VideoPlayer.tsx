"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import { Img } from "@/components/ui/Img";
function embed(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/); if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/); if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return null;
}
export function VideoPlayer({ url, poster, title }: { url: string | null; poster: string | null; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (!url) return (
    <div className="relative aspect-video bg-ink"><Img src={poster} alt={title} w={1400} eager className="h-full w-full opacity-70" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/90"><Play className="h-7 w-7 fill-white" /></span><p className="mt-3 text-[16px] font-semibold">Video file not yet uploaded</p><p className="text-[14px] text-white/75">Editors can add an MP4, YouTube or Vimeo link in the CMS.</p></div></div>
  );
  const e = embed(url);
  if (!playing) return (
    <button onClick={() => setPlaying(true)} className="group relative block aspect-video w-full bg-ink" aria-label={`Play ${title}`}>
      <Img src={poster} alt={title} w={1400} eager className="h-full w-full" />
      <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-pop transition group-hover:scale-110"><Play className="h-9 w-9 fill-white text-white" /></span></span>
    </button>
  );
  return e ? <iframe src={e} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="aspect-video w-full" />
    : <video src={url} poster={poster || undefined} controls autoPlay className="aspect-video w-full bg-black" />;
}
