import { readInstagramImage } from "@/backend/instagram";

// Serves a mirrored Instagram post image (backend/instagram.ts). Names are
// the post's ID, and a post's image never changes, so cache for a long time.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const image = readInstagramImage(file);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "content-type": image.mime,
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
