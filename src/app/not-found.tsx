import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SiteNotFound from "./(site)/not-found";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Global 404 for URLs that match no route at all. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <SiteNotFound />
      </main>
      <Footer />
    </>
  );
}
