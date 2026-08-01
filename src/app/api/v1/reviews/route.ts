import { NextRequest } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { Review } from "@/models/Review";
import { Movie } from "@/models/Movie";
import { cache } from "@/lib/redis/client";
import { z } from "zod";

const reviewSchema = z.object({
  movieId: z.string(),
  rating: z.number().min(1).max(10),
  title: z.string().min(2).max(100),
  content: z.string().min(10).max(2000),
});

export async function GET(req: NextRequest) {
  const movieId = req.nextUrl.searchParams.get("movieId");
  if (!movieId) return errorResponse("movieId required", 422);

  try {
    await connectDB();
    const reviews = await Review.find({ movieId, isApproved: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return successResponse(reviews);
  } catch {
    const raw = await cache.get(`demo_reviews:${movieId}`);
    return successResponse(raw ? JSON.parse(raw) : []);
  }
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return errorResponse("Validation failed", 422);

    try {
      await connectDB();
      const review = await Review.create({
        ...parsed.data,
        userId: req.user.sub,
        userName: req.user.email.split("@")[0],
      });

      const stats = await Review.aggregate([
        { $match: { movieId: review.movieId } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      if (stats[0]) {
        await Movie.findByIdAndUpdate(review.movieId, {
          rating: Math.round(stats[0].avg * 10) / 10,
          ratingCount: stats[0].count,
        });
      }

      return successResponse(review, "Review submitted", 201);
    } catch {
      const review = {
        _id: `rev_${Date.now()}`,
        ...parsed.data,
        userId: req.user.sub,
        userName: req.user.email.split("@")[0],
        likes: 0,
        createdAt: new Date().toISOString(),
      };
      const key = `demo_reviews:${parsed.data.movieId}`;
      const raw = await cache.get(key);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(review);
      await cache.set(key, JSON.stringify(list), 60 * 60 * 24 * 30);
      return successResponse(review, "Review submitted", 201);
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Review failed",
      400
    );
  }
});
