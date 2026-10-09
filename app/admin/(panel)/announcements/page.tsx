import { removeUpdate, saveNoticeVisibility, saveUpdate } from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import { MAX_NOTICE_POSTS, getNoticeEnabled, listAnnouncements, listNoticePosts } from "@/backend/repo";
import { when } from "@/frontend/lib/format";
import { ActionForm, inputClass } from "@/frontend/components/admin/ui";
import NoticePostEditor from "@/frontend/components/admin/NoticePostEditor";
import Popup from "@/frontend/components/admin/Popup";
import { noticeImageUrl } from "@/backend/noticeImages";

export const dynamic = "force-dynamic";

const labelClass = "mb-1 block text-xs font-medium text-graphite";

export default async function AnnouncementsPage() {
  await requireAdmin();
  const noticeEnabled = getNoticeEnabled();
  const posts = listNoticePosts();
  const updates = listAnnouncements();
  const liveCount = updates.filter((u) => u.published).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Announcements</h1>
        <p className="mt-1 text-sm text-graphite">
          What visitors see in the Important Update slideshow and the Updates section of the
          homepage. Changes go live as soon as you save.
        </p>
      </div>

      {/* --- Important Update ------------------------------------------- */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-sm font-semibold text-ink">
            Important Update{" "}
            <span className="font-normal text-graphite">
              ({posts.length} of {MAX_NOTICE_POSTS} posts)
            </span>
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              noticeEnabled && posts.length > 0 ? "bg-accent text-accent-ink" : "bg-paper-dim text-graphite"
            }`}
          >
            {noticeEnabled && posts.length > 0 ? "Showing on website" : "Hidden"}
          </span>
        </div>
        <p className="mb-4 text-xs text-graphite">
          Each post is one slide with one image, newest first. Click a post to edit it.
        </p>
        <ActionForm action={saveNoticeVisibility} submit="Save" className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="enabled" defaultChecked={noticeEnabled} />
            Show the Important Update on the website
          </label>
        </ActionForm>

        {/* One small tile per post, in a row that scrolls sideways; a tile
            opens the full editor in a pop-up. */}
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {posts.map((p, i) => (
            <Popup
              key={`${p.id}-${p.updated_at}`}
              title={`Post ${i + 1}${i === 0 ? " (newest, shown first)" : ""}`}
              label={`Edit post ${i + 1}: ${p.title}`}
              className="group w-44 shrink-0 overflow-hidden rounded-xl border border-line bg-white text-left transition-colors hover:border-ink"
              trigger={
                <>
                  <span className="flex aspect-video items-center justify-center overflow-hidden bg-paper-dim">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- uploaded file served by /media/notice
                      <img src={noticeImageUrl(p.image)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-graphite">No image</span>
                    )}
                  </span>
                  <span className="block p-3">
                    <span className="block text-xs text-graphite">Post {i + 1}</span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-ink">{p.title}</span>
                  </span>
                </>
              }
            >
              <p className="mb-4 text-xs text-graphite">Last edited {when(p.updated_at)}</p>
              <NoticePostEditor
                post={{
                  id: p.id,
                  imageUrl: p.image ? noticeImageUrl(p.image) : null,
                  tag: p.tag,
                  title: p.title,
                  message: p.message,
                  button_text: p.button_text,
                  button_url: p.button_url,
                }}
              />
            </Popup>
          ))}

          {posts.length < MAX_NOTICE_POSTS ? (
            <Popup
              title="Add a post"
              className="flex w-44 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-white p-3 text-sm text-ink transition-colors hover:border-ink"
              trigger={
                <>
                  <span className="text-2xl leading-none">+</span>
                  <span>Add a post</span>
                  <span className="text-xs text-graphite">{MAX_NOTICE_POSTS - posts.length} more allowed</span>
                </>
              }
            >
              <NoticePostEditor />
            </Popup>
          ) : (
            <p className="flex w-44 shrink-0 items-center rounded-xl border border-line p-3 text-xs text-graphite">
              All {MAX_NOTICE_POSTS} posts are in use. Delete one to add another.
            </p>
          )}
        </div>
      </div>

      {/* --- Updates ---------------------------------------------------- */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-ink">
              Updates{" "}
              <span className="font-normal text-graphite">
                ({liveCount} showing, {updates.length} total)
              </span>
            </p>
            <p className="mt-1 text-xs text-graphite">
              The newest 6 updates marked &ldquo;Show&rdquo; appear on the website, newest first.
            </p>
          </div>
          <Popup
            title="Add an update"
            trigger="Add update"
            className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition-colors hover:text-accent"
          >
            <ActionForm action={saveUpdate} submit="Add update" className="space-y-3">
              <UpdateFields />
            </ActionForm>
          </Popup>
        </div>

        {/* One line per update; a line opens its editor in a pop-up. */}
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {updates.map((u) => (
            <li key={`${u.id}-${u.updated_at}`}>
              <Popup
                title="Edit update"
                label={`Edit update: ${u.title}`}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-ink/5"
                trigger={
                  <>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${u.published ? "bg-accent" : "bg-ink/20"}`}
                      title={u.published ? "Showing on website" : "Hidden"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{u.title}</span>
                      <span className="block truncate text-xs text-graphite">
                        {[u.tag, u.date_label, u.published ? "Showing" : "Hidden"].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-graphite">Edit</span>
                  </>
                }
              >
                <p className="mb-4 text-xs text-graphite">Last edited {when(u.updated_at)}</p>
                <ActionForm action={saveUpdate} submit="Save changes" className="space-y-3">
                  <input type="hidden" name="id" value={u.id} />
                  <UpdateFields
                    tag={u.tag}
                    dateLabel={u.date_label}
                    title={u.title}
                    content={u.content}
                    published={Boolean(u.published)}
                  />
                </ActionForm>
                <form action={removeUpdate} className="mt-3 border-t border-line pt-3">
                  <input type="hidden" name="id" value={u.id} />
                  <button className="text-sm text-red-700 hover:underline">Delete this update</button>
                </form>
              </Popup>
            </li>
          ))}
        </ul>
        {updates.length === 0 && (
          <p className="py-6 text-center text-sm text-graphite">
            No updates yet. The Updates section is hidden on the website until one is shown.
          </p>
        )}
      </div>
    </div>
  );
}

function UpdateFields({
  tag,
  dateLabel,
  title,
  content,
  published = true,
}: {
  tag?: string | null;
  dateLabel?: string | null;
  title?: string;
  content?: string;
  published?: boolean;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
        <div>
          <label className={labelClass}>Label</label>
          <input
            name="tag"
            defaultValue={tag ?? ""}
            placeholder="Announcement"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            name="date_label"
            defaultValue={dateLabel ?? ""}
            placeholder="2026.09"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Title</label>
          <input
            name="title"
            defaultValue={title ?? ""}
            placeholder="ORBITAL is now live."
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="content"
          rows={2}
          defaultValue={content ?? ""}
          placeholder="What customers should know."
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="published" defaultChecked={published} />
        Show on website
      </label>
    </>
  );
}
