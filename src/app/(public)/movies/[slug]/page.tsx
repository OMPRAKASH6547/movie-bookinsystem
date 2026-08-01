import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, Clock, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_MOVIES } from "@/data/movies";
import { formatDuration, formatDate } from "@/utils/format";
import { APP_NAME } from "@/constants";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SEED_MOVIES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movie = SEED_MOVIES.find((m) => m.slug === slug);
  if (!movie) return { title: "Movie not found" };
  return {
    title: movie.title,
    description: movie.description,
    openGraph: {
      title: `${movie.title} | ${APP_NAME}`,
      description: movie.description,
      images: [movie.backdrop],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params;
  const movie = SEED_MOVIES.find((m) => m.slug === slug);
  if (!movie) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description,
    image: movie.poster,
    datePublished: movie.releaseDate,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: movie.rating,
      ratingCount: movie.ratingCount,
      bestRating: 10,
    },
    genre: movie.genres,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative z-10">
        <div className="relative h-[40vh] md:h-[50vh]">
          <Image src={movie.backdrop} alt="" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="container-page -mt-32 md:-mt-40 relative pb-16">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="relative w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shrink-0 mx-auto md:mx-0">
              <Image src={movie.poster} alt={movie.title} fill className="object-cover" sizes="224px" />
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="accent" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {movie.rating.toFixed(1)} ({movie.ratingCount.toLocaleString()})
                </Badge>
                <Badge variant="outline">{movie.certification}</Badge>
                {movie.genres.map((g) => (
                  <Badge key={g} variant="outline">{g}</Badge>
                ))}
              </div>

              <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">{movie.title}</h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mb-6">{movie.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDuration(movie.duration)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(movie.releaseDate)}
                </span>
                <span>{movie.languages.join(", ")}</span>
              </div>

              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" asChild>
                  <Link href={`/book/${movie.slug}`}>Book tickets</Link>
                </Button>
                {movie.trailerUrl && (
                  <Button size="lg" variant="outline" asChild>
                    <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4" />
                      Watch trailer
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h2 className="font-semibold mb-3">Cast</h2>
                  <ul className="space-y-2 text-sm">
                    {movie.cast.map((c) => (
                      <li key={c.name} className="flex justify-between gap-4">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">{c.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="font-semibold mb-3">Crew</h2>
                  <ul className="space-y-2 text-sm">
                    {movie.crew.map((c) => (
                      <li key={c.name} className="flex justify-between gap-4">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">{c.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
