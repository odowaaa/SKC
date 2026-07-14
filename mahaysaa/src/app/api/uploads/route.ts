import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Local-disk upload for the demo/dev environment. Swap this for a real
 * object store (S3 / Cloudflare R2) before deploying anywhere with
 * ephemeral or multi-instance storage.
 */
export async function POST(req: NextRequest) {
  try {
    await requireSession(["SUPPLIER"]);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError(400, "No file provided.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      return jsonError(400, "File is too large (max 5MB).");
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return jsonError(400, "Only JPEG, PNG, or WebP images are allowed.");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), bytes);

    return NextResponse.json({ url: `/uploads/products/${filename}` }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
