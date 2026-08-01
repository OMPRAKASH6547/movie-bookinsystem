import { NextRequest } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { Movie } from "@/models/Movie";
import { SEED_MOVIES } from "@/data/movies";
import { slugify } from "@/utils/format";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const q = searchParams.get("q") || "";

    try {
      await connectDB();
      const filter = q ? { title: { $regex: q, $options: "i" } } : {};
      const [items, total] = await Promise.all([
        Movie.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Movie.countDocuments(filter),
      ]);
      if (total > 0) {
        return successResponse(items, "OK", 200, paginate(page, limit, total));
      }
    } catch {
      /* seed */
    }

    let items = [...SEED_MOVIES];
    if (q) items = items.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()));
    return successResponse(items, "OK", 200, paginate(1, items.length, items.length));
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.title || !body.poster) return errorResponse("title and poster required", 422);
      await connectDB();
      const movie = await Movie.create({
        title: body.title,
        slug: body.slug || slugify(body.title),
        description: body.description || "",
        poster: body.poster,
        backdrop: body.backdrop || body.poster,
        genres: body.genres || [],
        languages: body.languages || ["Hindi"],
        duration: body.duration || 120,
        certification: body.certification || "UA",
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : new Date(),
        status: body.status || "upcoming",
        trailerUrl: body.trailerUrl,
        cast: body.cast || [],
        crew: body.crew || [],
        isFeatured: !!body.isFeatured,
        isTrending: !!body.isTrending,
      });
      return successResponse(movie, "Movie created", 201);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Create failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      await connectDB();
      const movie = await Movie.findByIdAndUpdate(body.id, body, { new: true });
      if (!movie) return errorResponse("Not found", 404);
      return successResponse(movie, "Movie updated");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Update failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const DELETE = withAuth(
  async (req: NextRequest) => {
    try {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return errorResponse("id required", 422);
      await connectDB();
      await Movie.findByIdAndDelete(id);
      return successResponse(null, "Movie deleted");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Delete failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);
