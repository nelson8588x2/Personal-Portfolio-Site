import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 掃描 /public/logos 目錄中的所有圖片檔案
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

// 上傳 logo 圖片到 /public/logos
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const logosDir = path.join(process.cwd(), "public/logos");
    fs.mkdirSync(logosDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    // 使用時間戳避免檔名衝突
    const ext = file.name.split(".").pop() || "png";
    const filename = `logo-${Date.now()}.${ext}`;
    const filepath = path.join(logosDir, filename);

    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({ path: `/logos/${filename}` });
  } catch (err) {
    console.error("Logo upload error:", err);
    return NextResponse.json(
      { error: `Failed to upload logo: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 500 }
    );
  }
}
