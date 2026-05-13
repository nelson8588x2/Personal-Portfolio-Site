"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Film,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Play,
  ImageIcon,
  User,
  BookOpen,
  Upload,
  Palette,
  Rocket,
} from "lucide-react";

// ============ Type Definitions ============

interface MediaItem {
  id: string;
  src: string;
  caption: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  videos: MediaItem[];
  images: MediaItem[];
}

interface Experience {
  id: string;
  period: string;
  role: string;
  company: string;
  desc: string;
}

interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

interface Education {
  id: string;
  school: string;
  degree: string;
  period: string;
}

interface AboutMe {
  name: string;
  title: string;
  motto: string;
  subtitle: string;
  avatar: string;
  introductions: string[];
  experiences: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
  contactEmail: string;
  behanceUrl: string;
  linkedinUrl: string;
}

const defaultAboutMe: AboutMe = {
  name: "",
  title: "",
  motto: "",
  subtitle: "",
  avatar: "",
  introductions: [],
  experiences: [],
  skillGroups: [],
  education: [],
  contactEmail: "",
  behanceUrl: "",
  linkedinUrl: "",
};

interface PortfolioConfig {
  title: string;
  subtitle: string;
  coverPage: string;
  backCoverPage: string;
  contentPages: string[];
}

interface ThemeConfig {
  font: string;
  headingWeight: string;
  accentColor: string;
}

interface SiteConfig {
  aboutMe: AboutMe;
  portfolio: PortfolioConfig;
  theme: ThemeConfig;
  projects: Project[];
  availableVideos: string[];
}

// ============ Admin Page Component ============

export default function AdminPage() {
  const defaultPortfolio: PortfolioConfig = {
    title: "Portfolio",
    subtitle: "",
    coverPage: "",
    backCoverPage: "",
    contentPages: [],
  };
  const defaultTheme: ThemeConfig = { font: "Plus Jakarta Sans", headingWeight: "700", accentColor: "#1a1a1a" };
  const [config, setConfig] = useState<SiteConfig>({
    aboutMe: defaultAboutMe,
    portfolio: { title: "Portfolio", subtitle: "", coverPage: "", backCoverPage: "", contentPages: [] },
    theme: defaultTheme,
    projects: [],
    availableVideos: [],
  });
  const [allVideoFiles, setAllVideoFiles] = useState<string[]>([]);
  const [allImageFiles, setAllImageFiles] = useState<string[]>([]);
  const [allAvatarFiles, setAllAvatarFiles] = useState<string[]>([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "portfolio" | "projects" | "theme" | "settings">("projects");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [portfolioDrag, setPortfolioDrag] = useState<{ from: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState("");
  const [sitePassword, setSitePassword] = useState("1234");
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [videoPickerFor, setVideoPickerFor] = useState<string | null>(null);
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    type: "project" | "video" | "image";
    projectId?: string;
    index: number;
  } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    const [configRes, videosRes, imagesRes, avatarsRes] = await Promise.all([
      fetch("/api/config"),
      fetch("/api/videos"),
      fetch("/api/images"),
      fetch("/api/avatars"),
    ]);
    const configData = await configRes.json();
    const videosData = await videosRes.json();
    const imagesData = await imagesRes.json();
    const avatarsData = await avatarsRes.json();
    // Ensure every project has an images field
    const projects = (configData.projects || []).map((p: Project) => ({
      ...p,
      images: p.images || [],
    }));
    const aboutMe = { ...defaultAboutMe, ...(configData.aboutMe || {}) };
    const portfolio = { ...defaultPortfolio, ...(configData.portfolio || {}) };
    const theme = { ...defaultTheme, ...(configData.theme || {}) };
    setConfig({ ...configData, aboutMe, portfolio, theme, projects });
    setAllVideoFiles(videosData.files || []);
    setAllImageFiles(imagesData.files || []);
    setAllAvatarFiles(avatarsData.files || []);
    // Expand all by default
    setExpandedProjects(new Set(projects.map((p: Project) => p.id)));
    // 載入密碼設定
    try {
      const pwRes = await fetch("/api/password");
      const pwData = await pwRes.json();
      setSitePassword(pwData.password || "1234");
      setPasswordEnabled(pwData.enabled !== false);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save
  const saveConfig = async () => {
    setSaving(true);
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 儲存後部署（git add + commit + push → 觸發 Render 自動重建）
  const deploySite = async () => {
    // 先儲存
    await saveConfig();
    setDeploying(true);
    setDeployMsg("");
    try {
      const res = await fetch("/api/deploy", { method: "POST" });
      const data = await res.json();
      setDeployMsg(data.message);
    } catch {
      setDeployMsg("部署失敗：無法連線到伺服器");
    }
    setDeploying(false);
    setTimeout(() => setDeployMsg(""), 5000);
  };

  // Add project
  const addProject = () => {
    const newId = `project-${Date.now()}`;
    setConfig((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: newId,
          title: "New Project",
          description: "Project description",
          videos: [],
          images: [],
        },
      ],
    }));
    setExpandedProjects((prev) => {
      const next = new Set(Array.from(prev));
      next.add(newId);
      return next;
    });
  };

  // Delete project
  const deleteProject = (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  // Update project field
  const updateProject = (id: string, field: keyof Project, value: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  // Add video to project
  const addVideoToProject = (projectId: string, filename: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              videos: [
                ...p.videos,
                {
                  id: `video-${Date.now()}`,
                  src: `/videos/${filename}`,
                  caption: "",
                },
              ],
            }
          : p
      ),
    }));
    setVideoPickerFor(null);
  };

  // Delete video
  const deleteVideo = (projectId: string, videoId: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, videos: p.videos.filter((v) => v.id !== videoId) }
          : p
      ),
    }));
  };

  // Update video caption
  const updateVideoCaption = (projectId: string, videoId: string, caption: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              videos: p.videos.map((v) =>
                v.id === videoId ? { ...v, caption } : v
              ),
            }
          : p
      ),
    }));
  };

  // Add image to project
  const addImageToProject = (projectId: string, filename: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              images: [
                ...p.images,
                {
                  id: `image-${Date.now()}`,
                  src: `/images/${filename}`,
                  caption: "",
                },
              ],
            }
          : p
      ),
    }));
    setImagePickerFor(null);
  };

  // Delete image
  const deleteImage = (projectId: string, imageId: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, images: p.images.filter((img) => img.id !== imageId) }
          : p
      ),
    }));
  };

  // Update image caption
  const updateImageCaption = (projectId: string, imageId: string, caption: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              images: p.images.map((img) =>
                img.id === imageId ? { ...img, caption } : img
              ),
            }
          : p
      ),
    }));
  };

  // Drag-sort images
  const handleImageDragStart = (projectId: string, index: number) => {
    setDragState({ type: "image", projectId, index });
  };

  const handleImageDragOver = (e: React.DragEvent, projectId: string, index: number) => {
    e.preventDefault();
    if (!dragState || dragState.type !== "image" || dragState.projectId !== projectId) return;
    if (dragState.index === index) return;

    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const images = [...p.images];
        const [moved] = images.splice(dragState.index, 1);
        images.splice(index, 0, moved);
        return { ...p, images };
      }),
    }));
    setDragState({ type: "image", projectId, index });
  };

  // Drag-sort projects
  const handleProjectDragStart = (index: number) => {
    setDragState({ type: "project", index });
  };

  const handleProjectDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragState || dragState.type !== "project") return;
    if (dragState.index === index) return;

    setConfig((prev) => {
      const projects = [...prev.projects];
      const [moved] = projects.splice(dragState.index, 1);
      projects.splice(index, 0, moved);
      return { ...prev, projects };
    });
    setDragState({ type: "project", index });
  };

  // Drag-sort videos
  const handleVideoDragStart = (projectId: string, index: number) => {
    setDragState({ type: "video", projectId, index });
  };

  const handleVideoDragOver = (e: React.DragEvent, projectId: string, index: number) => {
    e.preventDefault();
    if (!dragState || dragState.type !== "video" || dragState.projectId !== projectId) return;
    if (dragState.index === index) return;

    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const videos = [...p.videos];
        const [moved] = videos.splice(dragState.index, 1);
        videos.splice(index, 0, moved);
        return { ...p, videos };
      }),
    }));
    setDragState({ type: "video", projectId, index });
  };

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ============ Avatar crop helpers ============

  const openCropEditor = (src: string) => {
    setCropSrc(src);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const cancelCrop = () => {
    setCropSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const applyCrop = async () => {
    if (!completedCrop || !cropImgRef.current) return;
    const img = cropImgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("file", blob, "avatar-cropped.png");
      const res = await fetch("/api/avatars", { method: "POST", body: formData });
      const data = await res.json();
      if (data.path) {
        updateAbout("avatar", data.path);
      }
      cancelCrop();
    }, "image/png");
  };

  // ============ Portfolio helpers ============

  const updatePortfolio = (field: keyof PortfolioConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      portfolio: { ...prev.portfolio, [field]: value },
    }));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    setPdfProgress("Uploading and splitting PDF pages...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/portfolio", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setPdfProgress(`Error: ${data.error}`);
        return;
      }
      // Set first page as cover, last as back cover, rest as content
      const files = data.files as string[];
      if (files.length >= 2) {
        updatePortfolio("coverPage", files[0]);
        updatePortfolio("backCoverPage", files[files.length - 1]);
        updatePortfolio("contentPages", files.slice(1, -1));
      } else if (files.length === 1) {
        updatePortfolio("coverPage", files[0]);
        updatePortfolio("contentPages", []);
      }
      setPdfProgress(`Done! ${data.totalPages} pages extracted.`);
    } catch {
      setPdfProgress("Upload failed.");
    } finally {
      setPdfUploading(false);
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch("/api/portfolio", { method: "PUT", body: formData });
    const data = await res.json();
    if (data.path) {
      updatePortfolio(type === "cover" ? "coverPage" : "backCoverPage", data.path);
    }
    e.target.value = "";
  };

  const removePortfolioPage = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        contentPages: prev.portfolio.contentPages.filter((_, i) => i !== index),
      },
    }));
  };

  const reorderPortfolioPages = (from: number, to: number) => {
    setConfig((prev) => {
      const pages = [...prev.portfolio.contentPages];
      const [moved] = pages.splice(from, 1);
      pages.splice(to, 0, moved);
      return { ...prev, portfolio: { ...prev.portfolio, contentPages: pages } };
    });
  };

  // ============ About Me helpers ============

  const updateAbout = (field: keyof AboutMe, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      aboutMe: { ...prev.aboutMe, [field]: value },
    }));
  };

  const updateIntro = (index: number, value: string) => {
    setConfig((prev) => {
      const intros = [...prev.aboutMe.introductions];
      intros[index] = value;
      return { ...prev, aboutMe: { ...prev.aboutMe, introductions: intros } };
    });
  };

  const addIntro = () => updateAbout("introductions", [...config.aboutMe.introductions, ""]);

  const removeIntro = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      aboutMe: {
        ...prev.aboutMe,
        introductions: prev.aboutMe.introductions.filter((_, i) => i !== index),
      },
    }));
  };

  const addExperience = () => {
    updateAbout("experiences", [
      ...config.aboutMe.experiences,
      { id: `exp-${Date.now()}`, period: "", role: "", company: "", desc: "" },
    ]);
  };

  const removeExperience = (id: string) => {
    updateAbout("experiences", config.aboutMe.experiences.filter((e) => e.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    updateAbout(
      "experiences",
      config.aboutMe.experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addSkillGroup = () => {
    updateAbout("skillGroups", [
      ...config.aboutMe.skillGroups,
      { id: `skill-${Date.now()}`, category: "", items: [] },
    ]);
  };

  const removeSkillGroup = (id: string) => {
    updateAbout("skillGroups", config.aboutMe.skillGroups.filter((s) => s.id !== id));
  };

  const updateSkillGroup = (id: string, field: string, value: unknown) => {
    updateAbout(
      "skillGroups",
      config.aboutMe.skillGroups.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addEducation = () => {
    updateAbout("education", [
      ...config.aboutMe.education,
      { id: `edu-${Date.now()}`, school: "", degree: "", period: "" },
    ]);
  };

  const removeEducation = (id: string) => {
    updateAbout("education", config.aboutMe.education.filter((e) => e.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    updateAbout(
      "education",
      config.aboutMe.education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Top Toolbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Site Admin Panel
            </h1>
            <p className="text-xs text-gray-500 mt-1">Drag to reorder · Edit inline · Save with one click</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview Site
            </a>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
            <button
              onClick={deploySite}
              disabled={deploying}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 font-medium"
            >
              {deploying ? (
                <>
                  <Rocket className="w-4 h-4 animate-pulse" /> Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Deploy
                </>
              )}
            </button>
          </div>
          {deployMsg && (
            <div className={`max-w-5xl mx-auto px-6 py-2 text-sm ${deployMsg.includes("失敗") ? "text-red-600" : "text-emerald-600"}`}>
              {deployMsg}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === "about"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <User className="w-4 h-4" />
            About Me
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === "portfolio"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === "projects"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Film className="w-4 h-4" />
            Projects
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === "theme"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Palette className="w-4 h-4" />
            Theme
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Settings
          </button>
        </div>

        {/* ============ About Me Tab ============ */}
        {activeTab === "about" && (
          <div className="space-y-8">
            {/* Avatar + Basic Info */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold">Profile</h2>

              {/* Avatar */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Avatar</label>
                <div className="flex items-center gap-4">
                  {config.aboutMe.avatar ? (
                    <img
                      src={config.aboutMe.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-600" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Choose Avatar
                    </button>
                    {config.aboutMe.avatar && (
                      <>
                        <button
                          onClick={() => openCropEditor(config.aboutMe.avatar)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Crop
                        </button>
                        <button
                          onClick={() => updateAbout("avatar", "")}
                          className="px-3 py-1.5 text-xs rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Avatar Picker */}
                {showAvatarPicker && (
                  <div className="mt-3 bg-white border border-gray-200 shadow-sm rounded-xl p-4 max-h-60 overflow-y-auto">
                    <p className="text-xs text-gray-500 mb-3">
                      Place images in /public/avatars/ then select below. You can crop after selecting.
                    </p>
                    {allAvatarFiles.length === 0 ? (
                      <p className="text-xs text-gray-600 py-4 text-center">
                        /public/avatars/ is empty. Please add an image file first.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {allAvatarFiles.map((file) => (
                          <button
                            key={file}
                            onClick={() => {
                              updateAbout("avatar", `/avatars/${file}`);
                              setShowAvatarPicker(false);
                              openCropEditor(`/avatars/${file}`);
                            }}
                            className={`rounded-lg overflow-hidden border-2 transition-all ${
                              config.aboutMe.avatar === `/avatars/${file}`
                                ? "border-gray-900"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={`/avatars/${file}`}
                              alt={file}
                              className="w-full aspect-square object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Crop Editor Modal */}
                {cropSrc && (
                  <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 max-w-lg w-full space-y-4">
                      <h3 className="text-lg font-semibold">Crop Avatar</h3>
                      <p className="text-xs text-gray-500">Drag to select the area, then click Apply.</p>
                      <div className="flex justify-center bg-black/30 rounded-xl overflow-hidden max-h-[60vh]">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          circularCrop
                          aspect={1}
                        >
                          <img
                            ref={cropImgRef}
                            src={cropSrc}
                            alt="Crop source"
                            className="max-h-[55vh] object-contain"
                          />
                        </ReactCrop>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={cancelCrop}
                          className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={applyCrop}
                          disabled={!completedCrop}
                          className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-30 font-medium"
                        >
                          Apply Crop
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input
                  type="text"
                  value={config.aboutMe.name}
                  onChange={(e) => updateAbout("name", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="Your name"
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title / Role</label>
                <input
                  type="text"
                  value={config.aboutMe.title}
                  onChange={(e) => updateAbout("title", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="e.g. Industrial Designer"
                />
              </div>

              {/* Motto */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Motto（座右銘，顯示在名字下方，使用襯線字體）</label>
                <input
                  type="text"
                  value={config.aboutMe.motto}
                  onChange={(e) => updateAbout("motto", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 italic"
                  placeholder="e.g. Play to Explore. Make to Discover."
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subtitle (Hero section)</label>
                <textarea
                  value={config.aboutMe.subtitle}
                  onChange={(e) => updateAbout("subtitle", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-none"
                  rows={3}
                  placeholder="Short introduction shown in the hero section..."
                />
              </div>

              {/* Contact Links */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={config.aboutMe.contactEmail}
                    onChange={(e) => updateAbout("contactEmail", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="hello@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Behance URL</label>
                  <input
                    type="url"
                    value={config.aboutMe.behanceUrl}
                    onChange={(e) => updateAbout("behanceUrl", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="https://behance.net/..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">LinkedIn URL</label>
                  <input
                    type="url"
                    value={config.aboutMe.linkedinUrl}
                    onChange={(e) => updateAbout("linkedinUrl", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Introduction Paragraphs */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Introduction</h2>
                <button
                  onClick={addIntro}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Paragraph
                </button>
              </div>
              {config.aboutMe.introductions.map((text, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => updateIntro(i, e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-vertical"
                    rows={3}
                    placeholder="Paragraph text..."
                  />
                  <button
                    onClick={() => removeIntro(i)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors self-start mt-1"
                    aria-label="Remove paragraph"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Experiences */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Experience</h2>
                <button
                  onClick={addExperience}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Experience
                </button>
              </div>
              {config.aboutMe.experiences.map((exp) => (
                <div key={exp.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 group">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="Period (e.g. 2022/7 — Present)"
                      />
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="Role / Job Title"
                      />
                    </div>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors ml-2"
                      aria-label="Remove experience"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="Company name"
                  />
                  <textarea
                    value={exp.desc}
                    onChange={(e) => updateExperience(exp.id, "desc", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-vertical"
                    rows={2}
                    placeholder="Description..."
                  />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Skills</h2>
                <button
                  onClick={addSkillGroup}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>
              {config.aboutMe.skillGroups.map((group) => (
                <div key={group.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => updateSkillGroup(group.id, "category", e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 font-medium"
                      placeholder="Category name"
                    />
                    <button
                      onClick={() => removeSkillGroup(group.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                      aria-label="Remove skill category"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Skills (comma separated)</label>
                    <input
                      type="text"
                      value={group.items.join(", ")}
                      onChange={(e) =>
                        updateSkillGroup(
                          group.id,
                          "items",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Skill1, Skill2, Skill3"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Education & Certifications</h2>
                <button
                  onClick={addEducation}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Entry
                </button>
              </div>
              {config.aboutMe.education.map((edu) => (
                <div key={edu.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="School / Organization"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="Degree / Certification"
                      />
                      <input
                        type="text"
                        value={edu.period}
                        onChange={(e) => updateEducation(edu.id, "period", e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="Period / Issuer"
                      />
                    </div>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors ml-2"
                      aria-label="Remove education entry"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ Portfolio Tab ============ */}
        {activeTab === "portfolio" && (
          <div className="space-y-8">
            {/* Title & Subtitle */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Portfolio Settings</h2>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input
                  type="text"
                  value={config.portfolio.title}
                  onChange={(e) => updatePortfolio("title", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="Portfolio"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subtitle</label>
                <input
                  type="text"
                  value={config.portfolio.subtitle}
                  onChange={(e) => updatePortfolio("subtitle", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="Description shown below the title"
                />
              </div>
            </div>

            {/* PDF Import */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Import PDF</h2>
              <p className="text-xs text-gray-500">
                Upload a PDF file to automatically split it into page images. The first page becomes the cover, the last page becomes the back cover, and everything in between becomes content pages.
              </p>
              <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                pdfUploading ? "border-gray-400 bg-gray-100 cursor-wait" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}>
                <Upload className="w-5 h-5" />
                <span className="text-sm">{pdfUploading ? "Processing..." : "Choose PDF File"}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={pdfUploading}
                  className="hidden"
                />
              </label>
              {pdfProgress && (
                <p className={`text-xs ${pdfProgress.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                  {pdfProgress}
                </p>
              )}
            </div>

            {/* Cover Pages */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Cover Pages</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Front Cover */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Front Cover</label>
                  {config.portfolio.coverPage ? (
                    <div className="relative group">
                      <img
                        src={config.portfolio.coverPage}
                        alt="Front Cover"
                        className="w-full rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => updatePortfolio("coverPage", "")}
                        className="absolute top-2 right-2 p-1 rounded bg-black/60 text-red-400 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove front cover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-gray-600 mb-2" />
                      <span className="text-xs text-gray-500">Upload front cover</span>
                      <input type="file" accept="image/*" onChange={(e) => handleCoverUpload(e, "cover")} className="hidden" />
                    </label>
                  )}
                </div>
                {/* Back Cover */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Back Cover</label>
                  {config.portfolio.backCoverPage ? (
                    <div className="relative group">
                      <img
                        src={config.portfolio.backCoverPage}
                        alt="Back Cover"
                        className="w-full rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => updatePortfolio("backCoverPage", "")}
                        className="absolute top-2 right-2 p-1 rounded bg-black/60 text-red-400 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove back cover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-gray-600 mb-2" />
                      <span className="text-xs text-gray-500">Upload back cover</span>
                      <input type="file" accept="image/*" onChange={(e) => handleCoverUpload(e, "back")} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Content Pages — Drag to reorder */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Content Pages ({config.portfolio.contentPages.length})</h2>
              </div>
              <p className="text-xs text-gray-500">Drag thumbnails to reorder. Click × to remove a page.</p>
              {config.portfolio.contentPages.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No pages yet. Import a PDF above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {config.portfolio.contentPages.map((page, i) => (
                    <div
                      key={`${page}-${i}`}
                      draggable
                      onDragStart={() => setPortfolioDrag({ from: i })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (portfolioDrag) {
                          reorderPortfolioPages(portfolioDrag.from, i);
                          setPortfolioDrag(null);
                        }
                      }}
                      onDragEnd={() => setPortfolioDrag(null)}
                      className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                        portfolioDrag?.from === i
                          ? "border-gray-900 opacity-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={page}
                        alt={`Page ${i + 1}`}
                        className="w-full aspect-[210/297] object-cover"
                        draggable={false}
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5">
                        <span className="text-[10px] text-gray-300">{i + 1}</span>
                      </div>
                      <button
                        onClick={() => removePortfolioPage(i)}
                        className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-red-400 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ Projects Tab ============ */}
        {activeTab === "projects" && (
          <div>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Project Management</h2>
          <button
            onClick={addProject}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>

        {config.projects.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No projects yet. Click "Add Project" to get started.</p>
          </div>
        )}

        <div className="space-y-4">
          {config.projects.map((project, pIndex) => (
            <div
              key={project.id}
              draggable
              onDragStart={() => handleProjectDragStart(pIndex)}
              onDragOver={(e) => handleProjectDragOver(e, pIndex)}
              onDragEnd={() => setDragState(null)}
              className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden transition-all hover:border-white/20"
            >
              {/* Project Title Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => updateProject(project.id, "title", e.target.value)}
                    className="bg-transparent text-lg font-semibold w-full outline-none focus:ring-1 focus:ring-gray-400 rounded px-2 py-1 -ml-2"
                    placeholder="Project name"
                  />
                </div>

                <span className="text-xs text-gray-500 shrink-0">
                  {project.videos.length} video(s)
                </span>

                <button
                  onClick={() => toggleExpand(project.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
                  aria-label={expandedProjects.has(project.id) ? "Collapse" : "Expand"}
                >
                  {expandedProjects.has(project.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => deleteProject(project.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                  aria-label="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded Content */}
              {expandedProjects.has(project.id) && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
                  {/* Project Description */}
                  <div className="pt-4">
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea
                      value={project.description}
                      onChange={(e) =>
                        updateProject(project.id, "description", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-none"
                      rows={6}
                      placeholder="Project description..."
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Images</label>
                    <div className="space-y-3">
                      {project.images.map((img, iIndex) => (
                        <div
                          key={img.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleImageDragStart(project.id, iIndex);
                          }}
                          onDragOver={(e) => {
                            e.stopPropagation();
                            handleImageDragOver(e, project.id, iIndex);
                          }}
                          onDragEnd={() => setDragState(null)}
                          className="flex gap-3 items-start bg-white/[0.03] border border-white/5 rounded-lg p-3 group"
                        >
                          <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 mt-1">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div
                            className="w-32 h-20 shrink-0 bg-black/30 rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => setPreviewImage(img.src)}
                          >
                            <img
                              src={img.src}
                              alt={img.caption}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {img.src.split("/").pop()}
                            </p>
                            <textarea
                              value={img.caption}
                              onChange={(e) =>
                                updateImageCaption(project.id, img.id, e.target.value)
                              }
                              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-vertical"
                              rows={2}
                              placeholder="Image caption..."
                            />
                          </div>

                          <button
                            onClick={() => deleteImage(project.id, img.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        setImagePickerFor(
                          imagePickerFor === project.id ? null : project.id
                        )
                      }
                      className="mt-3 flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-gray-50 border border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors text-gray-500 w-full justify-center"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Add Image
                    </button>

                    {imagePickerFor === project.id && (
                      <div className="mt-3 bg-white border border-gray-200 shadow-sm rounded-xl p-4 max-h-80 overflow-y-auto">
                        <p className="text-xs text-gray-500 mb-3">
                          Select image files (click to add) — Place images in /public/images/
                        </p>
                        {allImageFiles.length === 0 ? (
                          <p className="text-xs text-gray-600 py-4 text-center">
                            /public/images/ is empty. Please add image files first.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {allImageFiles.map((file) => {
                              const alreadyAdded = project.images.some(
                                (img) => img.src === `/images/${file}`
                              );
                              return (
                                <button
                                  key={file}
                                  onClick={() => !alreadyAdded && addImageToProject(project.id, file)}
                                  disabled={alreadyAdded}
                                  className={`relative rounded-lg overflow-hidden border transition-all text-left ${
                                    alreadyAdded
                                      ? "border-gray-900/30 opacity-50 cursor-not-allowed"
                                      : "border-gray-200 hover:border-gray-400 hover:scale-[1.02] cursor-pointer"
                                  }`}
                                >
                                  <div className="aspect-video bg-black/30">
                                    <img
                                      src={`/images/${file}`}
                                      alt={file}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="p-2">
                                    <p className="text-[10px] text-gray-400 truncate">{file}</p>
                                  </div>
                                  {alreadyAdded && (
                                    <div className="absolute top-1 right-1 bg-gray-800 rounded-full p-0.5">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Videos */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Videos</label>
                    <div className="space-y-3">
                      {project.videos.map((video, vIndex) => (
                        <div
                          key={video.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleVideoDragStart(project.id, vIndex);
                          }}
                          onDragOver={(e) => {
                            e.stopPropagation();
                            handleVideoDragOver(e, project.id, vIndex);
                          }}
                          onDragEnd={() => setDragState(null)}
                          className="flex gap-3 items-start bg-white/[0.03] border border-white/5 rounded-lg p-3 group"
                        >
                          <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 mt-1">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Video Thumbnail / Preview */}
                          <div
                            className="w-32 h-20 shrink-0 bg-black/30 rounded-lg overflow-hidden cursor-pointer relative group/thumb"
                            onClick={() => setPreviewVideo(video.src)}
                          >
                            {video.src.includes("youtube.com") || video.src.includes("youtu.be") ? (
                              <img
                                src={`https://img.youtube.com/vi/${video.src.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]}/mqdefault.jpg`}
                                alt="YouTube thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={video.src}
                                className="w-full h-full object-cover"
                                preload="metadata"
                                muted
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={video.src}
                              onChange={(e) => {
                                const newVideos = project.videos.map((v) =>
                                  v.id === video.id ? { ...v, src: e.target.value } : v
                                );
                                setConfig((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((p) =>
                                    p.id === project.id ? { ...p, videos: newVideos } : p
                                  ),
                                }));
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-gray-400 mb-1"
                              placeholder="YouTube URL 或本地路徑 /videos/xxx.mp4"
                            />
                            <textarea
                              value={video.caption}
                              onChange={(e) =>
                                updateVideoCaption(project.id, video.id, e.target.value)
                              }
                              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-vertical"
                              rows={3}
                              placeholder="Video caption..."
                            />
                          </div>

                          <button
                            onClick={() => deleteVideo(project.id, video.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Remove video"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 新增影片按鈕 — 直接加一個空白影片項目，使用者在 URL 欄位貼上 YouTube 連結 */}
                    <button
                      onClick={() => {
                        const newVideo = { id: `video-${Date.now()}`, src: "", caption: "" };
                        setConfig((prev) => ({
                          ...prev,
                          projects: prev.projects.map((p) =>
                            p.id === project.id ? { ...p, videos: [...p.videos, newVideo] } : p
                          ),
                        }));
                      }}
                      className="mt-3 flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-gray-50 border border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors text-gray-500 w-full justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Video (paste YouTube URL)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
          </div>
        )}

        {/* ============ Theme Tab ============ */}
        {activeTab === "theme" && (
          <div className="space-y-8">
            {/* 字型設定 — 每個選項就是 preview */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Font</h2>
              <p className="text-xs text-gray-500">選擇網站使用的字型，每個卡片即為該字型預覽</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Plus Jakarta Sans", "Inter", "DM Sans", "Space Grotesk"].map((font) => (
                  <button
                    key={font}
                    onClick={() => setConfig((prev) => ({ ...prev, theme: { ...prev.theme, font } }))}
                    className={`text-left px-5 py-4 rounded-xl border-2 transition-all ${
                      config.theme.font === font
                        ? "border-gray-900 bg-gray-900/[0.03] shadow-sm"
                        : "border-gray-200 hover:border-gray-400 hover:shadow-sm"
                    }`}
                    style={{ fontFamily: `'${font}', sans-serif` }}
                  >
                    <p className="text-xs text-gray-400 mb-1">{font}</p>
                    <p className="text-xl font-bold text-gray-900">The quick brown fox</p>
                    <p className="text-sm text-gray-500 mt-0.5">jumps over the lazy dog — 0123456789</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 標題粗細 — 帶即時 preview */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Heading Weight</h2>
              <p className="text-xs text-gray-500">控制標題文字的粗細程度</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Medium", value: "500" },
                  { label: "Semibold", value: "600" },
                  { label: "Bold", value: "700" },
                  { label: "Extra Bold", value: "800" },
                ].map((w) => (
                  <button
                    key={w.value}
                    onClick={() => setConfig((prev) => ({ ...prev, theme: { ...prev.theme, headingWeight: w.value } }))}
                    className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      config.theme.headingWeight === w.value
                        ? "border-gray-900 bg-gray-900/[0.03] shadow-sm"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ fontFamily: `'${config.theme.font}', sans-serif` }}
                  >
                    <p className="text-[10px] text-gray-400 mb-1">{w.label} ({w.value})</p>
                    <p className="text-lg text-gray-900" style={{ fontWeight: Number(w.value) }}>Heading</p>
                  </button>
                ))}
              </div>
              {/* 大預覽 */}
              <div className="mt-3 p-4 bg-gray-100 rounded-lg" style={{ fontFamily: `'${config.theme.font}', sans-serif` }}>
                <p className="text-3xl text-gray-900" style={{ fontWeight: Number(config.theme.headingWeight) }}>
                  Portfolio Showcase
                </p>
                <p className="text-sm text-gray-500 mt-1 font-normal">目前選擇的標題粗細效果</p>
              </div>
            </div>

            {/* 強調色 — 帶按鈕 preview */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Accent Color</h2>
              <p className="text-xs text-gray-500">按鈕、連結等元素的強調色</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Black", value: "#1a1a1a" },
                  { label: "Slate", value: "#475569" },
                  { label: "Stone", value: "#57534e" },
                  { label: "Blue", value: "#2563eb" },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setConfig((prev) => ({ ...prev, theme: { ...prev.theme, accentColor: c.value } }))}
                    className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                      config.theme.accentColor === c.value
                        ? "border-gray-900 bg-gray-900/[0.03] shadow-sm"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: c.value }} />
                    <span className="text-xs text-gray-600">{c.label}</span>
                  </button>
                ))}
              </div>
              {/* 按鈕預覽 */}
              <div className="mt-3 p-4 bg-gray-100 rounded-lg flex items-center gap-4">
                <span className="px-5 py-2.5 text-white text-sm rounded-full font-medium" style={{ backgroundColor: config.theme.accentColor }}>
                  View Works
                </span>
                <span className="px-5 py-2.5 text-sm rounded-full font-medium border" style={{ borderColor: config.theme.accentColor, color: config.theme.accentColor }}>
                  Contact Me
                </span>
                <span className="text-xs text-gray-400 ml-auto">按鈕預覽</span>
              </div>
            </div>
          </div>
        )}

        {/* ============ Settings Tab ============ */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold">Site Password Protection</h2>
              <p className="text-sm text-gray-500">
                啟用後，訪客必須輸入密碼才能看到網站內容。
              </p>

              {/* 啟用/停用 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">啟用密碼保護</span>
                <button
                  onClick={() => setPasswordEnabled(!passwordEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    passwordEnabled ? "bg-gray-900" : "bg-gray-300"
                  }`}
                  title="Toggle password protection"
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      passwordEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* 密碼輸入 */}
              {passwordEnabled && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">網站密碼</label>
                  <input
                    type="text"
                    value={sitePassword}
                    onChange={(e) => setSitePassword(e.target.value)}
                    className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-800 outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="輸入新密碼"
                  />
                </div>
              )}

              {/* 儲存按鈕 */}
              <button
                onClick={async () => {
                  await fetch("/api/password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "update",
                      newPassword: sitePassword,
                      enabled: passwordEnabled,
                    }),
                  });
                  setPasswordSaved(true);
                  setTimeout(() => setPasswordSaved(false), 2000);
                }}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                {passwordSaved ? "✓ Saved" : "Save Password Settings"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="max-w-4xl w-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {previewVideo.includes("youtube.com") || previewVideo.includes("youtu.be") ? (
              <iframe
                src={previewVideo.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").split("&")[0] + "?autoplay=1"}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video preview"
              />
            ) : (
              <video
                src={previewVideo}
                controls
                autoPlay
                className="w-full aspect-video"
              />
            )}
            <div className="p-4 flex justify-between items-center">
              <p className="text-sm text-gray-400 truncate">
                {previewVideo.includes("youtube") ? "YouTube" : previewVideo.split("/").pop()}
              </p>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-4xl w-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain"
            />
            <div className="p-4 flex justify-between items-center">
              <p className="text-sm text-gray-400 truncate">
                {previewImage.split("/").pop()}
              </p>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
