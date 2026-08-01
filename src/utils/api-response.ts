import { NextResponse } from "next/server";
import type { ApiResponse, PaginationMeta, ValidationError } from "@/types";

export function successResponse<T>(
  data: T,
  message = "Success",
  status = 200,
  meta?: PaginationMeta
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data, meta }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  errors?: ValidationError[]
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, message, errors }, { status });
}

export function paginate(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
