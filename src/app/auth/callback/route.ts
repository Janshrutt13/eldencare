import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validations/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeNextPath(request.nextUrl.searchParams.get("next")), origin),
      );
  }
  return NextResponse.redirect(new URL("/login?confirmation=failed", origin));
}
