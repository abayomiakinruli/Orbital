import { readNoticeImage } from "@/backend/noticeImages";

// Serves an Important Update slide uploaded from /admin/announcements
// (stored under data/uploads, see backend/noticeImages.ts). File names are
// random and never reused, so each one can be cached for good.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const image = readNoticeImage(file);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "content-type": image.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
