import { deleteNoticePost, updateNoticePost } from "@/backend/repo";
import { deleteNoticeImage } from "@/backend/noticeImages";
import {
  postInput,
  rejectUnlessAdmin,
  respond,
  savedImage,
  validationResponse,
} from "@/backend/noticePostRequest";

type Ctx = { params: Promise<{ id: string }> };

// POST — edit a post. A new "image" file replaces the current one;
// removeImage=1 takes it off.
export async function POST(request: Request, { params }: Ctx) {
  const denied = await rejectUnlessAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const form = await request.formData();
  let image: string | null;
  try {
    image = await savedImage(form);
  } catch (e) {
    return validationResponse(e);
  }
  const change = image ?? (form.get("removeImage") === "1" ? null : undefined);
  return respond(() => {
    const { replacedImage } = updateNoticePost(id, postInput(form), change);
    if (replacedImage) deleteNoticeImage(replacedImage);
  }, image);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const denied = await rejectUnlessAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  return respond(() => {
    const { image } = deleteNoticePost(id);
    if (image) deleteNoticeImage(image);
  }, null);
}
