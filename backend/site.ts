import { getNoticeEnabled, listAnnouncements, listNoticePosts } from "@/backend/repo";
import { noticeImageUrl } from "@/backend/noticeImages";
import { instagramImageUrl, listInstagramPosts } from "@/backend/instagram";

// Display-ready data for the public site. Pages in app/ call these and pass
// the results to frontend components as props, so no frontend component
// touches the database. The types are the contract between the two sides.

export type NoticeSlide = {
  id: number;
  imageUrl: string | null;
  tag: string;
  title: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
};

export type PublicUpdate = {
  id: number;
  tag: string | null;
  dateLabel: string | null;
  title: string;
  content: string;
};

// The Important Update slides, or [] when the section is switched off.
export function getNoticeSlides(): NoticeSlide[] {
  if (!getNoticeEnabled()) return [];
  return listNoticePosts().map((p) => ({
    id: p.id,
    imageUrl: p.image ? noticeImageUrl(p.image) : null,
    tag: p.tag,
    title: p.title,
    message: p.message,
    buttonText: p.button_text,
    buttonUrl: p.button_url,
  }));
}

// The newest published Updates cards.
export function getPublicUpdates(max = 6): PublicUpdate[] {
  return listAnnouncements(true)
    .slice(0, max)
    .map((u) => ({ id: u.id, tag: u.tag, dateLabel: u.date_label, title: u.title, content: u.content }));
}

export type InstagramFeedPost = {
  id: string;
  permalink: string;
  caption: string | null;
  imageUrl: string;
  isVideo: boolean;
};

// The latest Instagram posts for the homepage, or [] if not connected.
export function getInstagramFeed(limit = 6): InstagramFeedPost[] {
  return listInstagramPosts(limit).map((p) => ({
    id: p.id,
    permalink: p.permalink,
    caption: p.caption,
    imageUrl: instagramImageUrl(p.image_file),
    isVideo: p.media_type === "VIDEO",
  }));
}
