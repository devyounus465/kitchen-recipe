import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (<><a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2">Skip to content</a><Header /><main id="main">{children}</main><Footer /></>);
}
