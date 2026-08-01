import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Movie } from "@/models/Movie";
import { cache } from "@/lib/redis/client";
import { SEED_MOVIES } from "@/data/movies";

async function getDemoWishlist(userId: string): Promise<string[]> {
  const raw = await cache.get(`demo_wishlist:${userId}`);
  return raw ? JSON.parse(raw) : [];
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    try {
      await connectDB();
      const user = await User.findById(req.user.sub).populate("wishlist");
      return successResponse(user?.wishlist || []);
    } catch {
      const ids = await getDemoWishlist(req.user.sub);
      const movies = SEED_MOVIES.filter((m) => ids.includes(m._id) || ids.includes(m.slug));
      return successResponse(movies.length ? movies : SEED_MOVIES.filter((m) => m.isFeatured).slice(0, 3));
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Wishlist failed",
      500
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { movieId, action = "add" } = await req.json();
    if (!movieId) return errorResponse("movieId required", 422);

    try {
      await connectDB();
      if (action === "remove") {
        await User.findByIdAndUpdate(req.user.sub, { $pull: { wishlist: movieId } });
      } else {
        await User.findByIdAndUpdate(req.user.sub, { $addToSet: { wishlist: movieId } });
        const movie = await Movie.findById(movieId);
        return successResponse({ movieId, movie }, "Added to wishlist");
      }
      return successResponse({ movieId }, action === "remove" ? "Removed" : "Added");
    } catch {
      let ids = await getDemoWishlist(req.user.sub);
      if (action === "remove") ids = ids.filter((id) => id !== movieId);
      else if (!ids.includes(movieId)) ids.push(movieId);
      await cache.set(`demo_wishlist:${req.user.sub}`, JSON.stringify(ids), 60 * 60 * 24 * 30);
      return successResponse({ movieId, ids }, "Wishlist updated");
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Wishlist update failed",
      400
    );
  }
});
