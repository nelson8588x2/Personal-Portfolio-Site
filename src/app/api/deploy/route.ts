import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// 執行 git add + commit + push，觸發 Render 自動部署
export async function POST() {
  const cwd = process.cwd();

  try {
    // git add 所有變更
    await execAsync("git add .", { cwd });

    // 檢查是否有變更需要 commit
    const { stdout: status } = await execAsync("git status --porcelain", { cwd });
    if (!status.trim()) {
      return NextResponse.json({ success: true, message: "沒有變更需要部署" });
    }

    // git commit
    const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
    await execAsync(
      `git commit -m "透過 Admin 面板更新 — ${timestamp}"`,
      { cwd }
    );

    // git push
    await execAsync("git push origin main", { cwd });

    return NextResponse.json({ success: true, message: "部署成功！Render 將自動重新建置。" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `部署失敗：${errorMessage}` },
      { status: 500 }
    );
  }
}
