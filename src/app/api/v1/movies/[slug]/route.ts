import { NextRequest } from "next/server";
import { movieService } from "@/services/movie.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const movie = await movieService.getBySlug(slug);
    if (!movie) return errorResponse("Movie not found", 404);
    return successResponse(movie);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch movie",
      500
    );
  }
}
