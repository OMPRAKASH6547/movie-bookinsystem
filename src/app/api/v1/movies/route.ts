import { NextRequest } from "next/server";
import { movieService } from "@/services/movie.service";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { PERMISSIONS } from "@/constants/roles";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await movieService.list({
      status: searchParams.get("status") || undefined,
      genre: searchParams.get("genre") || undefined,
      language: searchParams.get("language") || undefined,
      search: searchParams.get("search") || undefined,
      isFeatured: searchParams.has("featured") ? true : undefined,
      isTrending: searchParams.has("trending") ? true : undefined,
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 20),
      sort: searchParams.get("sort") || undefined,
    });

    return successResponse(
      result.items,
      "Movies fetched",
      200,
      paginate(result.page, result.limit, result.total)
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch movies",
      500
    );
  }
}

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const movie = await movieService.create(body);
      return successResponse(movie, "Movie created", 201);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Failed to create movie",
        400
      );
    }
  },
  { permission: PERMISSIONS.MANAGE_MOVIES }
);
