import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Scan /public/images directory for all image files
export async function GET() {
  try {
    const imagesDir = path.join(process.cwd(), "public/images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }
    const files = fs.readdirSync(imagesDir).filter((f) => {
      const ext = f.toLowerCase().split(".").pop();
      return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext || "");
    });
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
