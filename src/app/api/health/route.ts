import { jsonOk } from "@/lib/api";

export async function GET() {
  return jsonOk({
    status: "ok",
    service: "StockRoom",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
