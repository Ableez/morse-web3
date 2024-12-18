import { serve } from "inngest/next";
import { functions, inngest } from "../../../../utils/inngest";

/**
 * Try to automatically choose the edge runtime if `INNGEST_STREAMING` is set.
 *
 * See https://innge.st/streaming.
 */

export const runtime =
  process.env.INNGEST_STREAMING?.toLowerCase() === "force" ? "edge" : "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
