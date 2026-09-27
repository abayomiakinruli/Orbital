"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/admin/ui";

export type EditablePost = {
  id: number;
  imageUrl: string | null;
  tag: string;
  title: string;
  message: string;
  button_text: string;
  button_url: string;
};

const labelClass = "mb-1 block text-xs font-medium text-graphite";

// Create (no `post`) or edit one Important Update post. Sent as multipart
// to /api/admin/notice-posts so images over 1 MB upload fine.
export default function NoticePostEditor({ post }: { post?: EditablePost }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(post?.imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function clearImage() {
    setPreview(null);
    setRemoveImage(true);
    const input = form.current?.elements.namedItem("image") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    if (removeImage) body.set("removeImage", "1");
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(post ? `/api/admin/notice-posts/${post.id}` : "/api/admin/notice-posts", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ text: data.error ?? "Couldn't save. Try again.", error: true });
        return;
      }
      setMessage({ text: post ? "Saved. Live on the website now." : "Post added. Live on the website now." });
      if (!post) {
        form.current?.reset();
        setPreview(null);
      }
      router.refresh();
    } catch {
      setMessage({ text: "Couldn't save. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!post || !confirm("Delete this post from the Important Update?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/notice-posts/${post.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setMessage({ text: "Couldn't delete. Try again.", error: true });
      return;
    }
    router.refresh();
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="grid gap-4 md:grid-cols-[14rem_1fr]">
      <div>
        <span className={labelClass}>Image (one per post)</span>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-paper-dim/60">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen upload
            <img src={preview} alt="Post image preview" className="h-full w-full object-contain" />
          ) : (
            <span className="px-3 text-center text-xs text-graphite">No image</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <label className="cursor-pointer font-medium text-ink hover:underline">
            {preview ? "Replace" : "Choose image"}
            <input
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onFile(e.target.files)}
              className="sr-only"
            />
          </label>
          {preview && (
            <button type="button" onClick={clearImage} className="text-red-700 hover:underline">
              Remove image
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-graphite">PNG, JPG or WebP, up to 5 MB. With no title or message, the whole image links to the button link.</p>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <div>
            <label className={labelClass}>Label</label>
            <input name="tag" defaultValue={post?.tag ?? ""} placeholder="IMPORTANT UPDATE" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input name="title" defaultValue={post?.title ?? ""} placeholder="Scheduled maintenance tonight" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Message</label>
          <textarea
            name="message"
            rows={2}
            defaultValue={post?.message ?? ""}
            placeholder="Optional when the image says it all."
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Button text (optional)</label>
            <input name="buttonText" defaultValue={post?.button_text ?? ""} placeholder="Trade with ORBITAL" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Button link</label>
            <input name="buttonUrl" defaultValue={post?.button_url ?? ""} placeholder="/trade" className={inputClass} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={busy}
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:bg-accent hover:text-accent-ink disabled:opacity-50"
          >
            {busy ? "Saving…" : post ? "Save post" : "Add post"}
          </button>
          {post && (
            <button type="button" onClick={onDelete} disabled={busy} className="text-sm text-red-700 hover:underline">
              Delete post
            </button>
          )}
          {message && (
            <p role="status" className={`text-sm ${message.error ? "text-red-700" : "text-graphite"}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
