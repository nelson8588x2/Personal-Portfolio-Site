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

// 清理檔名：移除特殊字元，保留原始名稱
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-().]/g, "_");
}

// 取得不重複的檔案路徑
function getUniqueFilepath(dir: string, basename: string, ext: string): { filename: string; filepath: string } {
  let filename = `${basename}.${ext}`;
  let filepath = path.join(dir, filename);
  let counter = 2;
  while (fs.existsSync(filepath)) {
    filename = `${basename}_${counter}.${ext}`;
    filepath = path.join(dir, filename);
    counter++;
  }
  return { filename, filepath };
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

    // 保留原始檔名
    const rawName = file.name || "avatar.png";
    const dotIndex = rawName.lastIndexOf(".");
    const ext = dotIndex > 0 ? rawName.slice(dotIndex + 1).toLowerCase() : "png";
    const baseName = sanitizeFilename(dotIndex > 0 ? rawName.slice(0, dotIndex) : rawName);

    const { filename, filepath } = getUniqueFilepath(avatarsDir, baseName, ext);
    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({ path: `/avatars/${filename}` });
  } catch {
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
  }
}
