import mongoose, { Schema, Document, Model } from "mongoose";
import { MOVIE_STATUS } from "@/constants";
import type { MovieStatus } from "@/types";

export interface IMovie extends Document {
  title: string;
  slug: string;
  description: string;
  poster: string;
  backdrop: string;
  trailerUrl?: string;
  genres: string[];
  languages: string[];
  duration: number;
  rating: number;
  ratingCount: number;
  certification: string;
  releaseDate: Date;
  status: MovieStatus;
  cast: { name: string; role: string; image?: string }[];
  crew: { name: string; role: string; image?: string }[];
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  tags: string[];
  /** Owner-scoped catalog entry; null/undefined = platform-wide */
  ownerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    poster: { type: String, required: true },
    backdrop: { type: String, required: true },
    trailerUrl: String,
    genres: [{ type: String, index: true }],
    languages: [{ type: String, index: true }],
    duration: { type: Number, required: true },
    rating: { type: Number, default: 0, min: 0, max: 10 },
    ratingCount: { type: Number, default: 0 },
    certification: { type: String, default: "UA" },
    releaseDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(MOVIE_STATUS),
      default: MOVIE_STATUS.UPCOMING,
      index: true,
    },
    cast: [{ name: String, role: String, image: String }],
    crew: [{ name: String, role: String, image: String }],
    isFeatured: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0 },
    tags: [String],
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

MovieSchema.index({ status: 1, rating: -1 });
MovieSchema.index({ status: 1, releaseDate: -1 });
MovieSchema.index({ genres: 1, status: 1 });
MovieSchema.index({ title: "text", description: "text", tags: "text" });

export const Movie: Model<IMovie> =
  mongoose.models.Movie || mongoose.model<IMovie>("Movie", MovieSchema);
