import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import sharp from "sharp";

// Upload PDF and split into page images
// Uses pdf.js (pdfjs-dist) for rendering and sharp for image conversion
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pagesDir = path.join(process.cwd(), "public/book/pages");
    fs.mkdirSync(pagesDir, { recursive: true });

    // Read PDF buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // 使用 file:// URL 以原生 ESM 方式載入 pdfjs，繞過 webpack 打包
    // 避免 webpack 產生的副本與原生模組不同步，導致 workerSrc 設定失效
    const pdfjsUrl = pathToFileURL(
      path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.mjs")
    ).href;
    const workerUrl = pathToFileURL(
      path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
    ).href;

    const pdfjsLib = await import(/* webpackIgnore: true */ pdfjsUrl);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    } as any);
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    // Render each page to JPG at 2x scale for quality
    const SCALE = 2.0;
    const generatedFiles: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: SCALE });
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      // 使用 @napi-rs/canvas 建立畫布（與 pdfjs v5 內部實作一致，避免混用衝突）
      const { createCanvas } = await import("@napi-rs/canvas");
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Render PDF page to canvas
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Convert canvas to PNG buffer, then to JPG with sharp
      const pngBuffer = canvas.toBuffer("image/png");
      const filename = `content-${i}.jpg`;
      const filepath = path.join(pagesDir, filename);

      await sharp(pngBuffer)
        .jpeg({ quality: 90 })
        .toFile(filepath);

      generatedFiles.push(`/book/pages/${filename}`);
    }

    return NextResponse.json({
      totalPages,
      files: generatedFiles,
    });
  } catch (err) {
    console.error("PDF split error:", err);
    return NextResponse.json(
      { error: `Failed to process PDF: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 500 }
    );
  }
}

// Upload a single image as cover or back cover
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "cover" or "back"
    if (!file || !type) {
      return NextResponse.json({ error: "File and type required" }, { status: 400 });
    }

    const pagesDir = path.join(process.cwd(), "public/book/pages");
    fs.mkdirSync(pagesDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = type === "cover" ? "cover-1.jpg" : "cover-2.jpg";
    const filepath = path.join(pagesDir, filename);

    // Convert to JPG with sharp
    await sharp(buffer)
      .jpeg({ quality: 90 })
      .toFile(filepath);

    return NextResponse.json({ path: `/book/pages/${filename}` });
  } catch (err) {
    console.error("Cover upload error:", err);
    return NextResponse.json(
      { error: `Failed to upload cover: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 500 }
    );
  }
}
