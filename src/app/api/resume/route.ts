import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import {
  deletePublicUpload,
  getPortfolio,
  savePortfolio,
  uploadsDir,
} from "@/lib/json-db";

// Resume upload API (multipart forms can't go through server actions as
// cleanly, so this one lives as a Route Handler; dashboard fetches it).
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "application/octet-stream"];

function unauthorized() {
  return NextResponse.json({ error: "Not logged in." }, { status: 401 });
}

// POST /api/resume — upload a PDF resume for the logged-in owner's portfolio.
// Validates size + mime + .pdf extension + %PDF magic bytes, stores with a
// uuid filename under public/uploads/, deletes the previous file.
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) return unauthorized();
  const portfolio = getPortfolio(session.slug);
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get("resume");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Choose a PDF file first." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Resume must be under 5MB." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Resume must be a PDF file." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Resume must have a .pdf extension." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  // Magic-byte check: real PDFs start with "%PDF", so a renamed .exe can't pass.
  if (bytes.subarray(0, 4).toString("utf-8") !== "%PDF") {
    return NextResponse.json({ error: "Not a valid PDF file." }, { status: 400 });
  }

  const filename = `resume-${randomUUID()}.pdf`;
  try {
    const dir = uploadsDir();
    fs.writeFileSync(path.join(dir, filename), bytes);
  } catch {
    return NextResponse.json({ error: "Could not save file." }, { status: 500 });
  }

  // Replace: delete the old upload first so disk doesn't fill with orphans.
  deletePublicUpload(portfolio.profile.resume);
  portfolio.profile.resume = `/uploads/${filename}`;
  savePortfolio(session.slug, portfolio);
  revalidatePath("/dashboard/media");
  revalidatePath(`/${session.slug}`);

  return NextResponse.json({ url: portfolio.profile.resume });
}

// DELETE /api/resume — remove the current resume (if any).
export async function DELETE() {
  const session = await verifySession();
  if (!session) return unauthorized();
  const portfolio = getPortfolio(session.slug);
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });

  deletePublicUpload(portfolio.profile.resume);
  portfolio.profile.resume = "";
  savePortfolio(session.slug, portfolio);
  revalidatePath("/dashboard/media");
  revalidatePath(`/${session.slug}`);

  return NextResponse.json({ ok: true });
}
