import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Scan /public/videos directory for all video files
export async function GET() {
  try {
    const videosDir = path.join(process.cwd(), "public/videos");
    const files = fs.readdirSync(videosDir).filter((f) => {
      const ext = f.toLowerCase().split(".").pop();
      return ["mp4", "mov", "webm", "avi"].includes(ext || "");
    });
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
