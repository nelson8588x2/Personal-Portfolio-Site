import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PASSWORD_PATH = path.join(process.cwd(), "src/data/site-password.json");

// 預設密碼
const DEFAULT_DATA = { password: "1234", enabled: true };

function getData() {
  try {
    const raw = fs.readFileSync(PASSWORD_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DATA;
  }
}

// 驗證密碼
export async function POST(req: NextRequest) {
  const body = await req.json();

  // 更新密碼（from admin）
  if (body.action === "update") {
    const data = { password: body.newPassword, enabled: body.enabled ?? true };
    fs.writeFileSync(PASSWORD_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  }

  // 驗證密碼
  const data = getData();
  if (!data.enabled) {
    return NextResponse.json({ success: true, unlocked: true });
  }
  if (body.password === data.password) {
    return NextResponse.json({ success: true, unlocked: true });
  }
  return NextResponse.json({ success: false, message: "密碼錯誤" });
}

// 取得密碼設定（給 admin 用）
export async function GET() {
  const data = getData();
  return NextResponse.json(data);
}
