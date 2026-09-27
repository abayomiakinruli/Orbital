import { createNoticePost } from "@/backend/repo";
import {
  postInput,
  rejectUnlessAdmin,
  respond,
  savedImage,
  validationResponse,
} from "@/backend/noticePostRequest";

// POST — add an Important Update post (multipart: tag, title, message,
// buttonText, buttonUrl, optional image).
export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(request);
  if (denied) return denied;
  const form = await request.formData();
  let image: string | null;
  try {
    image = await savedImage(form);
  } catch (e) {
    return validationResponse(e);
  }
  return respond(() => createNoticePost(postInput(form), image), image);
}
