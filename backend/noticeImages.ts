import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ValidationError } from "@/backend/repo";

// Files behind the Important Update slideshow. Stored under data/uploads
// (git-ignored, next to the database) rather than public/, because Next.js
// only serves public/ files that existed at build time — these are served
// by app/media/notice/[file]/route.ts instead.
const DIR = path.join(process.cwd(), "data", "uploads", "notice");
export const MAX_NOTICE_IMAGE_BYTES = 5 * 1024 * 1024;

// Stored names are generated here, never taken from the upload, so a name
// can't reach outside DIR.
const NAME = /^[a-f0-9]{16}\.(png|jpg|webp)$/;

const TYPES = {
  png: { mime: "image/png", magic: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  jpg: { mime: "image/jpeg", magic: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  webp: { mime: "image/webp", magic: (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
} as const;
type Ext = keyof typeof TYPES;

// Checks the bytes themselves (not the file name or browser-reported type)
// so only real PNG/JPEG/WebP images are stored, then saves under a random
// name and returns it.
export function saveNoticeImage(bytes: Buffer): string {
  if (bytes.length === 0) throw new ValidationError("That file is empty.");
  if (bytes.length > MAX_NOTICE_IMAGE_BYTES) {
    throw new ValidationError("Images must be 5 MB or smaller.");
  }
  const ext = (Object.keys(TYPES) as Ext[]).find((e) => TYPES[e].magic(bytes));
  if (!ext) throw new ValidationError("Upload a PNG, JPG or WebP image.");
  mkdirSync(DIR, { recursive: true });
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  writeFileSync(path.join(DIR, name), bytes);
  return name;
}

export function readNoticeImage(name: string): { bytes: Buffer; mime: string } | null {
  if (!NAME.test(name)) return null;
  try {
    const ext = name.split(".").pop() as Ext;
    return { bytes: readFileSync(path.join(DIR, name)), mime: TYPES[ext].mime };
  } catch {
    return null;
  }
}

export function deleteNoticeImage(name: string) {
  if (!NAME.test(name)) return;
  try {
    unlinkSync(path.join(DIR, name));
  } catch {
    // Already gone — nothing to do.
  }
}

export const noticeImageUrl = (name: string) => `/media/notice/${name}`;
