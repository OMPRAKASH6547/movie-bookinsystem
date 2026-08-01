import { NextRequest } from "next/server";
import { movieService } from "@/services/movie.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q") || "";
    if (q.length < 2) {
      return successResponse([], "Query too short");
    }
    const result = await movieService.search(q, 12);
    return successResponse(result.items, "Search results");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Search failed",
      500
    );
  }
}
