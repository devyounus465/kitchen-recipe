import Link from "next/link";
import { Play } from "lucide-react";
import { videoList } from "@/lib/queries";
import { Img } from "@/components/ui/Img";
import { videoUrl } from "@/lib/utils";
export const metadata = { title: "Recipe Videos", description: "Watch step-by-step recipe videos from our test kitchen." };
const dur = (s: number | null) => `${Math.floor((s ?? 0) / 60)}:${String((s ?? 0) % 60).padStart(2, "0")}`;
export default async function Videos() {
  const list = await videoList(60); const [lead, ...rest] = list;
  return (
    <div className="container-site pt-10">
      <h1 className="text-[40px] font-extrabold md:text-[48px]">Videos</h1>
      <p className="mt-2 text-[19px]">Step-by-step recipe videos from our test kitchen.</p>
      {lead && (
        <Link href={videoUrl(lead)} className="group mt-8 grid gap-6 bg-ink text-white md:grid-cols-[2fr_1fr]">
          <div className="relative aspect-video overflow-hidden"><Img src={lead.thumbnailUrl} alt={lead.title} w={1200} className="h-full w-full transition group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand"><Play className="h-9 w-9 fill-white" /></span></span></div>
          <div className="flex flex-col justify-center p-6"><span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/70">Featured Video · {dur(lead.durationSec)}</span><h2 className="mt-2 text-[30px] font-extrabold leading-tight text-white group-hover:underline">{lead.title}</h2><p className="mt-2 text-white/80">{lead.description?.slice(0, 160)}</p></div>
        </Link>
      )}
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {rest.map((v) => (
          <Link key={v.id} href={videoUrl(v)} className="group">
            <div className="relative aspect-video overflow-hidden"><Img src={v.thumbnailUrl} alt={v.title} w={600} className="h-full w-full transition group-hover:scale-105" />
              <span className="absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand"><Play className="h-4 w-4 fill-white text-white" /></span><span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 text-[12px] font-semibold text-white">{dur(v.durationSec)}</span></div>
            <h3 className="mt-2 text-[17px] font-extrabold leading-snug text-ink group-hover:underline">{v.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
