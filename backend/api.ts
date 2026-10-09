import { isBotRequest } from "@/backend/auth";
import { ValidationError, touchBot } from "@/backend/repo";

// Wraps a bot endpoint: checks the API key, records bot activity and maps
// validation errors to 400 responses.
export async function botHandler(
  request: Request,
  run: (body: Record<string, unknown>) => unknown,
) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  try {
    touchBot();
    return Response.json(run(body));
  } catch (error) {
    const isValidationError = error instanceof ValidationError || (
      typeof error === "object" && error !== null &&
      "name" in error && error.name === "ValidationError"
    );
    if (isValidationError) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Invalid input" },
        { status: 400 },
      );
    }
    throw error;
  }
}
