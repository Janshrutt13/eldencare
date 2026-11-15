import "server-only";
import { cache } from "react";
// One server-side clock snapshot per request, shared by queries and rendered status.
export const requestTime = cache(() => Date.now());
