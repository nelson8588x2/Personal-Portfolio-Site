import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Scan /public/avatars directory for all image files
export async function GET() {
  try {
    const avatarsDir = path.join(process.cwd(), "public/avatars");
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }
    const files = fs.readdirSync(avatarsDir).filter((f) => {
      const ext = f.toLowerCase().split(".").pop();
      return ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext || "");
    });
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

// Save cropped avatar image
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const avatarsDir = path.join(process.cwd(), "public/avatars");
    fs.mkdirSync(avatarsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `avatar-cropped-${Date.now()}.png`;
    const filepath = path.join(avatarsDir, filename);
    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({ path: `/avatars/${filename}` });
  } catch {
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
  }
}
