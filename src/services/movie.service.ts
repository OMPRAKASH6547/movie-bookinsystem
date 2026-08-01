import { movieRepository, type MovieFilters } from "@/repositories/movie.repository";
import { SEED_MOVIES } from "@/data/movies";
import { cache } from "@/lib/redis/client";
import { slugify } from "@/utils/format";
import { connectDB } from "@/lib/db/mongodb";
import { logger } from "@/lib/logger";

export class MovieService {
  private async tryDb() {
    try {
      await connectDB();
      return true;
    } catch (error) {
      logger.warn("DB unavailable, using seed data", {
        error: error instanceof Error ? error.message : "Unknown",
      });
      return false;
    }
  }

  async list(filters: MovieFilters) {
    const cacheKey = `movies:${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const dbOk = await this.tryDb();

    if (dbOk) {
      try {
        const count = await movieRepository.count();
        if (count > 0) {
          const result = await movieRepository.findFiltered(filters);
          await cache.set(cacheKey, JSON.stringify(result), 60);
          return result;
        }
      } catch {
        /* fall through to seed */
      }
    }

    let items = [...SEED_MOVIES];
    if (filters.status) items = items.filter((m) => m.status === filters.status);
    if (filters.genre) items = items.filter((m) => m.genres.includes(filters.genre!));
    if (filters.language)
      items = items.filter((m) => m.languages.includes(filters.language!));
    if (filters.isFeatured) items = items.filter((m) => m.isFeatured);
    if (filters.isTrending) items = items.filter((m) => m.isTrending);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    const sort = filters.sort || "-rating";
    items.sort((a, b) => {
      if (sort === "-rating") return b.rating - a.rating;
      if (sort === "rating") return a.rating - b.rating;
      if (sort === "-views") return b.views - a.views;
      return a.title.localeCompare(b.title);
    });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = items.length;
    const sliced = items.slice((page - 1) * limit, page * limit);

    const result = { items: sliced, total, page, limit };
    await cache.set(cacheKey, JSON.stringify(result), 60);
    return result;
  }

  async getBySlug(slug: string) {
    const dbOk = await this.tryDb();
    if (dbOk) {
      try {
        const movie = await movieRepository.findBySlug(slug);
        if (movie) {
          await movieRepository.incrementViews(movie._id.toString());
          return movie;
        }
      } catch {
        /* seed fallback */
      }
    }
    return SEED_MOVIES.find((m) => m.slug === slug) || null;
  }

  async getById(id: string) {
    const dbOk = await this.tryDb();
    if (dbOk) {
      try {
        const movie = await movieRepository.findById(id);
        if (movie) return movie;
      } catch {
        /* seed */
      }
    }
    return SEED_MOVIES.find((m) => m._id === id) || null;
  }

  async create(data: Record<string, unknown>) {
    await connectDB();
    const title = data.title as string;
    return movieRepository.create({
      ...data,
      slug: (data.slug as string) || slugify(title),
    } as never);
  }

  async update(id: string, data: Record<string, unknown>) {
    await connectDB();
    await cache.del(`movies:*`);
    return movieRepository.updateById(id, data);
  }

  async delete(id: string) {
    await connectDB();
    return movieRepository.deleteById(id);
  }

  async search(q: string, limit = 10) {
    return this.list({ search: q, limit, page: 1 });
  }
}

export const movieService = new MovieService();
