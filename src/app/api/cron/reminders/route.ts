import { timingSafeEqual } from "node:crypto";
import { processNotifications } from "@/lib/email/processor";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const suppliedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (
    !secret ||
    secret.length < 32 ||
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await processNotifications());
  } catch {
    return Response.json(
      {
        error:
          "Reminder processing failed. Check server configuration and migrations.",
      },
      { status: 500 },
    );
  }
}
