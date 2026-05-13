import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "src/data/site-config.json");

// Read config
export async function GET() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ projects: [], availableVideos: [] });
  }
}

// Write config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
