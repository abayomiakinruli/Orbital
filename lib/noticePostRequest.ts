import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { ValidationError, type NoticePostInput } from "@/lib/repo";
import { deleteNoticeImage, saveNoticeImage } from "@/lib/noticeImages";

// Shared by the Important Update post routes (app/api/admin/notice-posts).
// These are route handlers rather than Server Actions because actions cap
// request bodies at 1 MB, too small for a designed flyer.

// Admin session required; the origin check stops another site posting
// with that session.
export async function rejectUnlessAdmin(request: Request): Promise<Response | null> {
  if (!(await isAdmin())) {
    return Response.json({ error: "Session expired. Log in again." }, { status: 401 });
  }
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function postInput(form: FormData): NoticePostInput {
  return {
    tag: form.get("tag"),
    title: form.get("title"),
    message: form.get("message"),
    buttonText: form.get("buttonText"),
    buttonUrl: form.get("buttonUrl"),
  };
}

// Saves the form's "image" file if one was chosen; returns its stored name.
export async function savedImage(form: FormData): Promise<string | null> {
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return saveNoticeImage(Buffer.from(await file.arrayBuffer()));
}

// Runs a change; on a validation error, removes any image it just saved
// and answers with the message. Refreshes the homepage and admin after.
export async function respond(run: () => void, newImage: string | null): Promise<Response> {
  try {
    run();
  } catch (e) {
    if (newImage) deleteNoticeImage(newImage);
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return Response.json({ ok: true });
}

export function validationResponse(e: unknown): Response {
  if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
  throw e;
}
