import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 有效的子分類
const VALID_CATEGORIES = ["experience", "education", "award"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

// 清理檔名：移除特殊字元，保留原始名稱
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-().]/g, "_");
}

// 取得不重複的檔案路徑：若已存在則加上 _2, _3, ...
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

// 掃描 /public/logos 目錄中的所有圖片檔案（含子目錄）
export async function GET() {
  try {
    const logosDir = path.join(process.cwd(), "public/logos");
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }
    const files = fs.readdirSync(logosDir).filter((f) => {
      const ext = f.toLowerCase().split(".").pop();
      return ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext || "");
    });
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

// 上傳圖片到 /public/logos/{category}/
// FormData 欄位：file（圖片）、category（experience | education | award）
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "";
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 決定子資料夾
    const subDir = VALID_CATEGORIES.includes(category as Category) ? category : "misc";
    const targetDir = path.join(process.cwd(), "public/logos", subDir);
    fs.mkdirSync(targetDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 保留原始檔名，清理後避免衝突
    const rawName = file.name || "upload.png";
    const dotIndex = rawName.lastIndexOf(".");
    const ext = dotIndex > 0 ? rawName.slice(dotIndex + 1).toLowerCase() : "png";
    const baseName = sanitizeFilename(dotIndex > 0 ? rawName.slice(0, dotIndex) : rawName);

    const { filename, filepath } = getUniqueFilepath(targetDir, baseName, ext);
    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({ path: `/logos/${subDir}/${filename}` });
  } catch (err) {
    console.error("Logo upload error:", err);
    return NextResponse.json(
      { error: `Failed to upload logo: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 500 }
    );
  }
}
