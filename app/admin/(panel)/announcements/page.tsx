import { removeUpdate, saveNoticeVisibility, saveUpdate } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { MAX_NOTICE_POSTS, getNoticeEnabled, listAnnouncements, listNoticePosts } from "@/lib/repo";
import { when } from "@/lib/format";
import { ActionForm, inputClass } from "@/components/admin/ui";
import NoticePostEditor from "@/components/admin/NoticePostEditor";
import { noticeImageUrl } from "@/lib/noticeImages";

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
          Each post is one slide with one image. Posts slide left to right on their own and
          visitors can swipe through them. Newest first; every slide keeps the same card size.
        </p>
        <ActionForm action={saveNoticeVisibility} submit="Save" className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="enabled" defaultChecked={noticeEnabled} />
            Show the Important Update on the website
          </label>
        </ActionForm>
      </div>

      {posts.map((p, i) => (
        <div key={`${p.id}-${p.updated_at}`} className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-ink">
              Post {i + 1}
              {i === 0 && <span className="ml-2 font-normal text-graphite">(newest, shown first)</span>}
            </p>
            <span className="text-xs text-graphite">Last edited {when(p.updated_at)}</span>
          </div>
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
        </div>
      ))}

      {posts.length < MAX_NOTICE_POSTS ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-5">
          <p className="mb-4 font-display text-sm font-semibold text-ink">
            Add a post{" "}
            <span className="font-normal text-graphite">
              ({MAX_NOTICE_POSTS - posts.length} more allowed)
            </span>
          </p>
          <NoticePostEditor />
        </div>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-5 text-sm text-graphite">
          All {MAX_NOTICE_POSTS} posts are in use. Delete one to add another.
        </p>
      )}

      {/* --- Updates ---------------------------------------------------- */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-semibold text-ink">Add an update</p>
        <p className="mb-4 mt-1 text-xs text-graphite">
          The newest 6 updates marked &ldquo;Show&rdquo; appear on the website, newest first.
        </p>
        <ActionForm action={saveUpdate} submit="Add update" className="space-y-3">
          <UpdateFields />
        </ActionForm>
      </div>

      <div className="space-y-3">
        <p className="font-display text-sm font-semibold text-ink">
          Updates{" "}
          <span className="font-normal text-graphite">
            ({liveCount} showing, {updates.length} total)
          </span>
        </p>
        {updates.map((u) => (
          <div key={`${u.id}-${u.updated_at}`} className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  u.published ? "bg-accent text-accent-ink" : "bg-paper-dim text-graphite"
                }`}
              >
                {u.published ? "Showing on website" : "Hidden"}
              </span>
              <span className="text-xs text-graphite">Last edited {when(u.updated_at)}</span>
            </div>
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
          </div>
        ))}
        {updates.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-graphite">
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
