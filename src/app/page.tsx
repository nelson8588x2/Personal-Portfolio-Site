"use client";

import { motion } from "framer-motion";
import { Mail, Linkedin, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

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

const defaultTheme: ThemeConfig = {
  font: "Plus Jakarta Sans",
  headingWeight: "700",
  accentColor: "#1a1a1a",
};

// ============ Animation Settings ============

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ============ PDF FlipBook Component ============
// Front cover = cover-1.jpg → displayed on RIGHT side of spread
// Back cover = cover-2.jpg → displayed on LEFT side of spread
// Content pages are shown as two-page spreads (left + right)
// 翻頁動畫：右頁以 3D rotateY 往左翻，背面顯示下一頁的左頁

function FlipBook({ portfolio }: { portfolio: PortfolioConfig }) {
  const contentPages = portfolio.contentPages;
  const totalSpreads = 1 + Math.ceil(contentPages.length / 2) + 1;
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev" | null>(null);
  const [pageInput, setPageInput] = useState("");
  const [isEditingPage, setIsEditingPage] = useState(false);
  const flipRef = useRef<HTMLDivElement>(null);

  const goToSpread = (target: number) => {
    const clamped = Math.max(0, Math.min(target, totalSpreads - 1));
    if (clamped === spread) return;
    if (clamped > spread) {
      triggerFlip("next", clamped);
    } else {
      triggerFlip("prev", clamped);
    }
  };

  const triggerFlip = (dir: "next" | "prev", target?: number) => {
    if (flipping) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setSpread(target !== undefined ? target : (s) => dir === "next" ? s + 1 : s - 1);
      setFlipping(false);
      setFlipDir(null);
    }, 600);
  };

  const nextSpread = () => {
    if (spread < totalSpreads - 1 && !flipping) triggerFlip("next", spread + 1);
  };

  const prevSpread = () => {
    if (spread > 0 && !flipping) triggerFlip("prev", spread - 1);
  };

  // Get left/right image sources for a given spread index
  const getSpreadImages = (s: number): { left: string | null; right: string | null } => {
    if (s === 0) return { left: null, right: portfolio.coverPage };
    if (s === totalSpreads - 1) return { left: portfolio.backCoverPage, right: null };
    const leftIdx = (s - 1) * 2;
    const rightIdx = leftIdx + 1;
    return {
      left: contentPages[leftIdx] || null,
      right: rightIdx < contentPages.length ? contentPages[rightIdx] : null,
    };
  };

  const current = getSpreadImages(spread);
  const nextData = spread < totalSpreads - 1 ? getSpreadImages(spread + 1) : null;
  const prevData = spread > 0 ? getSpreadImages(spread - 1) : null;

  const renderPageImg = (src: string | null, alt: string) =>
    src ? (
      <img src={src} alt={alt} className="w-full h-full object-contain bg-white" draggable={false} />
    ) : (
      <div className="w-full h-full bg-gray-100" />
    );

  const getPageLabel = () => {
    if (spread === 0) return "Cover";
    if (spread === totalSpreads - 1) return "Back Cover";
    const left = (spread - 1) * 2 + 1;
    const right = Math.min((spread - 1) * 2 + 2, contentPages.length);
    return `${left}–${right} / ${contentPages.length}`;
  };

  const handlePageSubmit = () => {
    setIsEditingPage(false);
    const val = parseInt(pageInput, 10);
    if (isNaN(val)) return;
    if (val <= 0) goToSpread(0);
    else if (val > contentPages.length) goToSpread(totalSpreads - 1);
    else goToSpread(Math.ceil(val / 2));
  };

  // 計算翻頁動畫 style
  const getFlipStyle = (): React.CSSProperties => {
    if (!flipping || !flipDir) return { transform: "rotateY(0deg)" };
    if (flipDir === "next") {
      return { transform: "rotateY(-180deg)", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" };
    }
    return { transform: "rotateY(0deg)", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" };
  };

  const getFlipInitialStyle = (): React.CSSProperties => {
    if (flipDir === "prev") {
      return { transform: "rotateY(-180deg)" };
    }
    return { transform: "rotateY(0deg)" };
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Book container */}
      <div
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-lg"
        style={{ aspectRatio: "420/297" }}
      >
        {/* Static left page (stays in place during flip) */}
        <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
          {flipDir === "next"
            ? renderPageImg(current.left, "Left page")
            : flipDir === "prev" && prevData
            ? renderPageImg(prevData.left, "Left page")
            : renderPageImg(current.left, "Left page")
          }
        </div>

        {/* Static right page — shows destination right page underneath during flip */}
        <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden">
          {flipDir === "next" && nextData
            ? renderPageImg(nextData.right, "Right page")
            : flipDir === "prev"
            ? renderPageImg(current.right, "Right page")
            : renderPageImg(current.right, "Right page")
          }
        </div>

        {/* Underneath left page (new left revealed during next flip) */}
        {flipDir === "next" && nextData && (
          <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden" style={{ zIndex: 5 }}>
            {renderPageImg(nextData.left, "New left page")}
          </div>
        )}

        {/* Underneath right page (old right revealed during prev flip) */}
        {flipDir === "prev" && (
          <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden" style={{ zIndex: 5 }}>
            {renderPageImg(current.right, "Old right page")}
          </div>
        )}

        {/* 3D flipping page */}
        {flipping && flipDir === "next" && (
          <div className="flip-container" style={{ left: "50%", transformOrigin: "left center" }}>
            <div
              ref={flipRef}
              className="flip-page"
              style={{
                ...getFlipInitialStyle(),
                ...getFlipStyle(),
                transformOrigin: "left center",
              }}
            >
              {/* Front face = old right page */}
              <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                {renderPageImg(current.right, "Flipping front")}
              </div>
              {/* Back face = new left page */}
              <div className="flip-page-back overflow-hidden">
                {renderPageImg(nextData?.left || null, "Flipping back")}
              </div>
            </div>
          </div>
        )}

        {flipping && flipDir === "prev" && prevData && (
          <div className="flip-container" style={{ left: 0, transformOrigin: "right center" }}>
            <div
              className="flip-page"
              style={{
                ...getFlipInitialStyle(),
                ...getFlipStyle(),
                transformOrigin: "right center",
                right: "auto",
                left: 0,
              }}
            >
              {/* Front face = old left page (currently showing) */}
              <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                {renderPageImg(current.left, "Flipping front")}
              </div>
              {/* Back face = prev right page */}
              <div className="flip-page-back overflow-hidden">
                {renderPageImg(prevData.right, "Flipping back")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevSpread}
          disabled={spread === 0 || flipping}
          aria-label="Previous page"
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {isEditingPage ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handlePageSubmit(); }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              autoFocus
              className="w-16 text-center text-sm bg-gray-50 border border-gray-300 rounded-md px-2 py-1 text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Page"
            />
            <span className="text-sm text-gray-500">/ {contentPages.length}</span>
          </form>
        ) : (
          <button
            onClick={() => {
              setIsEditingPage(true);
              if (spread === 0) setPageInput("0");
              else if (spread === totalSpreads - 1) setPageInput(String(contentPages.length));
              else setPageInput(String((spread - 1) * 2 + 1));
            }}
            className="text-sm text-gray-500 min-w-[120px] text-center hover:text-gray-800 transition-colors cursor-text"
            title="Click to jump to a page"
          >
            {getPageLabel()}
          </button>
        )}

        <button
          onClick={nextSpread}
          disabled={spread === totalSpreads - 1 || flipping}
          aria-label="Next page"
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// ============ Main Page ============

const defaultPortfolio: PortfolioConfig = {
  title: "Portfolio",
  subtitle: "",
  coverPage: "",
  backCoverPage: "",
  contentPages: [],
};

const defaultAboutMe: AboutMe = {
  name: "Hsu Chia Yang",
  title: "Industrial Designer",
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

export default function Home() {
  const [videoProjects, setVideoProjects] = useState<Project[]>([]);
  const [about, setAbout] = useState<AboutMe>(defaultAboutMe);
  const [portfolio, setPortfolio] = useState<PortfolioConfig>(defaultPortfolio);
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(true);

  // Load all data from API
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setVideoProjects(data.projects || []);
      if (data.aboutMe) setAbout({ ...defaultAboutMe, ...data.aboutMe });
      if (data.portfolio) setPortfolio({ ...defaultPortfolio, ...data.portfolio });
      if (data.theme) setTheme({ ...defaultTheme, ...data.theme });
    } catch {
      setVideoProjects([]);
    }
  }, []);

  // 檢查密碼是否啟用
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/password");
        const data = await res.json();
        if (!data.enabled) {
          setUnlocked(true);
        }
      } catch {
        setUnlocked(true);
      }
      setCheckingPassword(false);
    })();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    const res = await fetch("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput }),
    });
    const data = await res.json();
    if (data.unlocked) {
      setUnlocked(true);
    } else {
      setPasswordError(data.message || "密碼錯誤");
    }
  };

  // 密碼鎖定畫面
  if (checkingPassword) {
    return <div className="min-h-screen bg-gray-100" />;
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-100/80 backdrop-blur-md flex items-center justify-center px-6" style={{ fontFamily: `'${theme.font}', sans-serif` }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Password</h2>
          <p className="text-gray-500 text-sm mb-6">This site is password protected.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-gray-800 outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
              placeholder="Password"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Unlock
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ fontFamily: `'${theme.font}', sans-serif` }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="#" className="text-xl font-bold gradient-text">
            {about.name}
          </a>
          <div className="flex gap-6 text-sm">
            <a
              href="#about"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              About
            </a>
            <a
              href="#works"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Works
            </a>
            <a
              href="#contact"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-100 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center z-10 px-6"
        >
          {/* Avatar */}
          {about.avatar && (
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <img
                src={about.avatar}
                alt={about.name}
                className="w-40 h-40 md:w-52 md:h-52 rounded-full object-cover mx-auto border-2 border-gray-200 shadow-lg shadow-gray-300/50"
              />
            </motion.div>
          )}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-gray-500 text-lg mb-4"
          >
            {about.title}
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl mb-6"
            style={{ fontWeight: Number(theme.headingWeight) }}
          >
            <span className="gradient-text">{about.name}</span>
          </motion.h1>
          {about.subtitle && (
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-gray-500 max-w-xl mx-auto mb-10 whitespace-pre-line"
            >
              {about.subtitle}
            </motion.p>
          )}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="flex gap-4 justify-center"
          >
            <a
              href="#works"
              className="px-6 py-3 text-white rounded-full font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: theme.accentColor }}
            >
              View Works
            </a>
            <a
              href="#contact"
              className="px-6 py-3 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              Contact Me
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10"
        >
          <ArrowDown className="w-6 h-6 text-gray-500" />
        </motion.div>
      </section>

      {/* ============ ABOUT ME Section ============ */}
      <div id="about">
          {/* Introduction */}
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-8"
                >
                  <span className="gradient-text">About Me</span>
                </motion.h2>
                <motion.div
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="glass rounded-2xl p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed"
                >
                  {about.introductions.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Work Experience */}
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-12"
                >
                  <span className="gradient-text">Experience</span>
                </motion.h2>
                <div className="space-y-8">
                  {about.experiences.map((exp) => (
                    <motion.div
                      key={exp.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                      className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-600 to-gray-400" />
                      <p className="text-sm text-gray-500 mb-1">{exp.period}</p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {exp.role}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">{exp.company}</p>
                      <p className="text-gray-500 text-sm">{exp.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Skills */}
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-12"
                >
                  <span className="gradient-text">Skills</span>
                </motion.h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {about.skillGroups.map((skill) => (
                    <motion.div
                      key={skill.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                      className="glass rounded-2xl p-6"
                    >
                      <h3 className="font-semibold text-lg mb-4 text-gray-800">
                        {skill.category}
                      </h3>
                      <ul className="space-y-2">
                        {skill.items.map((item, i) => (
                          <li
                            key={i}
                            className="text-gray-600 text-sm flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Education & Certifications */}
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-12"
                >
                  <span className="gradient-text">Education & Certifications</span>
                </motion.h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {about.education.map((edu) => (
                    <motion.div
                      key={edu.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                      className="glass rounded-2xl p-6"
                    >
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">
                        {edu.school}
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        {edu.degree}
                      </p>
                      <p className="text-gray-500 text-sm">{edu.period}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
      </div>

      {/* ============ WORKS Section ============ */}
      <div id="works">
          {/* PDF FlipBook */}
          <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-4"
                >
                  <span className="gradient-text">{portfolio.title || "Portfolio"}</span>
                </motion.h2>
                {portfolio.subtitle && (
                  <motion.p
                    variants={fadeInUp}
                    transition={{ duration: 0.6 }}
                    className="text-gray-500 mb-10"
                  >
                    {portfolio.subtitle}
                  </motion.p>
                )}
                <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
                  {portfolio.contentPages.length > 0 && <FlipBook portfolio={portfolio} />}
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Projects Section */}
          <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-12"
                >
                  <span className="gradient-text">Interactive Experience Lab</span>
                </motion.h2>

                {videoProjects.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <p>No projects yet. Go to the <a href="/admin" className="text-gray-700 underline">Admin Panel</a> to add projects.</p>
                  </div>
                )}

                <div className="space-y-24">
                  {videoProjects.filter((p) => p.videos.length > 0 || (p.images && p.images.length > 0)).map((project) => (
                    <motion.div
                      key={project.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Project Title */}
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        {project.title}
                      </h3>
                      {/* Description */}
                      <p className="text-gray-500 text-sm mb-8 leading-relaxed whitespace-pre-line">
                        {project.description}
                      </p>

                      {/* Project Images */}
                      {project.images && project.images.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                          {project.images.map((img) => (
                            <div key={img.id} className="space-y-2">
                              <div className="glass rounded-2xl overflow-hidden">
                                <img
                                  src={img.src}
                                  alt={img.caption || project.title}
                                  className="w-full h-auto object-cover"
                                  loading="lazy"
                                />
                              </div>
                              {img.caption && (
                                <p className="text-gray-500 text-sm pl-2 border-l-2 border-gray-400">
                                  {img.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Project Videos */}
                      <div className="space-y-10">
                        {project.videos.map((video) => (
                          <div key={video.id} className="space-y-3">
                            <div className="glass rounded-2xl overflow-hidden aspect-video">
                              {video.src.includes("youtube.com") || video.src.includes("youtu.be") ? (
                                <iframe
                                  src={video.src.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").split("&")[0]}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={video.caption || "Video"}
                                />
                              ) : (
                                <video
                                  src={video.src}
                                  controls
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                            </div>
                            {/* Video Caption */}
                            {video.caption && (
                              <p className="text-gray-500 text-sm pl-2 border-l-2 border-gray-400 whitespace-pre-line">
                                {video.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
      </div>

      {/* Contact & Footer */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              <span className="gradient-text">Contact</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-gray-500 mb-10 max-w-md mx-auto"
            >
              Have an idea or question? Feel free to reach out.
            </motion.p>
            {about.contactEmail && (
              <motion.a
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                href={`mailto:${about.contactEmail}`}
                className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-4 hover:bg-gray-100 transition-colors group mb-8"
              >
                <Mail className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {about.contactEmail}
                </span>
              </motion.a>
            )}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="flex justify-center gap-4"
            >
              {about.behanceUrl && (
                <a
                  href={about.behanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-full px-5 py-3 hover:bg-gray-100 transition-colors group flex items-center gap-2"
                >
                  <span className="text-gray-500 group-hover:text-gray-800 transition-colors font-bold text-sm">
                    Bē
                  </span>
                  <span className="text-gray-500 group-hover:text-gray-800 text-sm">Behance</span>
                </a>
              )}
              {about.linkedinUrl && (
                <a
                  href={about.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-full px-5 py-3 hover:bg-gray-100 transition-colors group flex items-center gap-2"
                >
                  <Linkedin className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                  <span className="text-gray-500 group-hover:text-gray-800 text-sm">LinkedIn</span>
                </a>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 {about.name}. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs">
            Built with Next.js & Tailwind CSS
          </p>
        </div>
      </footer>
    </main>
  );
}
