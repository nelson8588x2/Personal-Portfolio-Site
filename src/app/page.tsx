"use client";

import { motion } from "framer-motion";
import { Mail, Linkedin, ArrowDown, ChevronLeft, ChevronRight, Phone, ExternalLink, Award as AwardIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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
  logo?: string;
  logoSize?: number;
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
  logo?: string;
  logoSize?: number;
}

interface Award {
  id: string;
  title: string;
  image: string;
  link: string;
}

interface AboutMe {
  name: string;
  title: string;
  motto: string;
  avatar: string;
  introductions: string[];
  experiences: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
  contactEmail: string;
  phone: string;
  behanceUrl: string;
  linkedinUrl: string;
  awards: Award[];
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

// ============ Portfolio Pages Component ============
// 書籍風格的左右翻頁瀏覽，帶有頁碼和上/下一頁按鈕

function PortfolioPages({ portfolio }: { portfolio: PortfolioConfig }) {
  const allPages = [
    portfolio.coverPage,
    ...portfolio.contentPages,
    portfolio.backCoverPage,
  ].filter(Boolean);

  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = allPages.length;

  const goToPrev = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  // 鍵盤左右鍵翻頁
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (totalPages === 0) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* 書籍容器 */}
      <div className="relative bg-gray-900 rounded-xl shadow-2xl overflow-hidden aspect-[420/297]">
        {/* 當前頁面 */}
        <motion.img
          key={currentPage}
          src={allPages[currentPage]}
          alt={`Page ${currentPage + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* 左側翻頁按鈕 */}
        {currentPage > 0 && (
          <button
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all backdrop-blur-sm"
            aria-label="上一頁"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* 右側翻頁按鈕 */}
        {currentPage < totalPages - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all backdrop-blur-sm"
            aria-label="下一頁"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 頁碼 */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={goToPrev}
          disabled={currentPage === 0}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 inline" /> Prev
        </button>
        <span className="text-sm text-gray-600">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={goToNext}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="w-4 h-4 inline" />
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
  motto: "",
  avatar: "",
  introductions: [],
  experiences: [],
  skillGroups: [],
  education: [],
  contactEmail: "",
  phone: "",
  behanceUrl: "",
  linkedinUrl: "",
  awards: [],
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
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl mb-4"
            style={{ fontWeight: Number(theme.headingWeight) }}
          >
            <span className="gradient-text">{about.name}</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-gray-500 text-base md:text-lg tracking-wide uppercase mb-6"
          >
            {about.title}
          </motion.p>
          {about.motto && (
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-lg md:text-xl text-gray-400 mb-10 italic tracking-wide"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {about.motto}
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
                  className="text-3xl md:text-4xl font-bold mb-12"
                >
                  <span className="gradient-text">About Me</span>
                </motion.h2>
                <motion.div
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="glass rounded-2xl p-8 md:p-12 space-y-6 text-gray-600 text-base leading-relaxed"
                >
                  {about.introductions.map((text, i) => (
                    <p key={i} className="whitespace-pre-line">{text}</p>
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
                <div className="space-y-6">
                  {about.experiences.map((exp) => (
                    <motion.div
                      key={exp.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                      className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-600 to-gray-400" />
                      <div className="pl-4">
                        <div className="flex items-center gap-4 mb-3">
                          {exp.logo && (
                            <img
                              src={exp.logo}
                              alt={exp.company}
                              style={{ height: exp.logoSize || 48 }}
                              className="object-contain shrink-0"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                              {exp.role}
                            </h3>
                            <p className="text-gray-600 text-sm">{exp.company}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{exp.period}</p>
                        <p className="text-gray-500 text-sm leading-relaxed">{exp.desc}</p>
                      </div>
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
                      className="glass rounded-2xl p-6 md:p-8"
                    >
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-4 pb-3 border-b border-gray-200">
                        {skill.category}
                      </h3>
                      <ul className="space-y-2.5">
                        {skill.items.map((item, i) => (
                          <li
                            key={i}
                            className="text-gray-700 text-sm flex items-center gap-2.5"
                          >
                            <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
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

          {/* Education */}
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
                  <span className="gradient-text">Education</span>
                </motion.h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {about.education.map((edu) => (
                    <motion.div
                      key={edu.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                      className="glass rounded-2xl p-6 md:p-8"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {edu.logo && (
                          <img
                            src={edu.logo}
                            alt={edu.school}
                            style={{ height: edu.logoSize || 48 }}
                            className="object-contain shrink-0"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                            {edu.school}
                          </h3>
                          <p className="text-gray-600 text-sm mt-0.5">
                            {edu.degree}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{edu.period}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Awards */}
          {about.awards && about.awards.length > 0 && (
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
                    <span className="gradient-text">Awards</span>
                  </motion.h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {about.awards.map((award) => (
                      <motion.a
                        key={award.id}
                        href={award.link || "#"}
                        target={award.link ? "_blank" : undefined}
                        rel={award.link ? "noopener noreferrer" : undefined}
                        variants={fadeInUp}
                        transition={{ duration: 0.5 }}
                        className="glass rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow block"
                      >
                        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                          {award.image ? (
                            <img
                              src={award.image}
                              alt={award.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <AwardIcon className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="px-5 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <AwardIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-800 leading-tight">{award.title}</span>
                          </div>
                          {award.link && (
                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-700 transition-colors shrink-0 ml-3" />
                          )}
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}
      </div>

      {/* ============ WORKS Section ============ */}
      <div id="works">
          {/* Portfolio Pages */}
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
                  {portfolio.contentPages.length > 0 && <PortfolioPages portfolio={portfolio} />}
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
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              <span className="gradient-text">Contact</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-gray-500 text-sm mb-10 max-w-md mx-auto"
            >
              Have an idea or question? Feel free to reach out.
            </motion.p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {about.contactEmail && (
                <motion.a
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  href={`mailto:${about.contactEmail}`}
                  className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-4 hover:bg-gray-100 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                    {about.contactEmail}
                  </span>
                </motion.a>
              )}
              {about.phone && (
                <motion.a
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  href={`tel:${about.phone}`}
                  className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-4 hover:bg-gray-100 transition-colors group"
                >
                  <Phone className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                    {about.phone}
                  </span>
                </motion.a>
              )}
            </div>
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
