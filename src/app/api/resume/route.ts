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
const ALLOWED_TYPES = ["application/pdf", "application/octet...

[truncated 2085 chars]