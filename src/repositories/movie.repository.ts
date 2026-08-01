import { FilterQuery } from "mongoose";
import { BaseRepository } from "./base.repository";
import { Movie, IMovie } from "@/models/Movie";

export interface MovieFilters {
  status?: string;
  genre?: string;
  language?: string;
  search?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export class MovieRepository extends BaseRepository<IMovie> {
  constructor() {
    super(Movie);
  }

  async findFiltered(filters: MovieFilters) {
    const {
      status,
      genre,
      language,
      search,
      isFeatured,
      isTrending,
      page = 1,
      limit = 20,
      sort = "-rating",
    } = filters;

    const query: FilterQuery<IMovie> = {};

    if (status) query.status = status;
    if (genre) query.genres = genre;
    if (language) query.languages = language;
    if (typeof isFeatured === "boolean") query.isFeatured = isFeatured;
    if (typeof isTrending === "boolean") query.isTrending = isTrending;
    if (search) query.$text = { $search: search };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      "-rating": { rating: -1 },
      rating: { rating: 1 },
      "-releaseDate": { releaseDate: -1 },
      releaseDate: { releaseDate: 1 },
      "-views": { views: -1 },
      title: { title: 1 },
    };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort(sortMap[sort] || { rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.count(query),
    ]);

    return { items, total, page, limit };
  }

  async findBySlug(slug: string): Promise<IMovie | null> {
    return this.findOne({ slug });
  }

  async incrementViews(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }
}

export const movieRepository = new MovieRepository();
