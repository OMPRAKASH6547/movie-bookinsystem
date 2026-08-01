import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { MovieRow } from "@/components/movies/movie-row";
import { PopularCities } from "@/components/landing/cities";
import { OffersSection } from "@/components/landing/offers";
import { Categories } from "@/components/landing/categories";
import { TheatresNearYou } from "@/components/landing/theatres-near";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQSection } from "@/components/landing/faq";
import { AppDownload } from "@/components/landing/app-download";
import { SEED_MOVIES } from "@/data/movies";
import { APP_NAME, APP_TAGLINE } from "@/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Book Movie Tickets Online`,
  description: APP_TAGLINE,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const featured = SEED_MOVIES.find((m) => m.isFeatured) || SEED_MOVIES[0];
  const trending = SEED_MOVIES.filter((m) => m.isTrending);
  const nowShowing = SEED_MOVIES.filter((m) => m.status === "now_showing");
  const upcoming = SEED_MOVIES.filter((m) => m.status === "upcoming");
  const topRated = [...SEED_MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const recommended = SEED_MOVIES.filter((m) => m.rating >= 8.3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    description: APP_TAGLINE,
    potentialAction: {
      "@type": "SearchAction",
      target: `/movies?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero movie={featured} />
      <MovieRow title="Trending now" subtitle="What everyone's watching" movies={trending} />
      <MovieRow title="Now showing" subtitle="In theatres this week" movies={nowShowing} id="now-showing" />
      <OffersSection />
      <MovieRow title="Recommended for you" movies={recommended} />
      <PopularCities />
      <MovieRow title="Top rated" subtitle="Critics & audiences agree" movies={topRated} />
      <Categories />
      <MovieRow title="Coming soon" subtitle="Mark your calendar" movies={upcoming} id="coming-soon" />
      <TheatresNearYou />
      <Testimonials />
      <FAQSection />
      <AppDownload />
    </>
  );
}
