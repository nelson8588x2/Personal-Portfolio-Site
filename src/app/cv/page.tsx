"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Download } from "lucide-react";

// ============ 型別定義 ============

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
  image?: string;
  link?: string;
}

interface AboutMe {
  name: string;
  title: string;
  motto: string;
  avatar?: string;
  introductions: string[];
  experiences: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
  contactEmail: string;
  phone: string;
  behanceUrl?: string;
  linkedinUrl?: string;
  awards: Award[];
}

interface SiteConfig {
  aboutMe: AboutMe;
}

export default function CVPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    document.title = "HSU CHIA YANG CV";
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const about = config.aboutMe;

  return (
    <>
      {/* 列印按鈕（列印時隱藏） */}
      <div className="print:hidden fixed top-6 right-6 z-50">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* A4 頁面容器 */}
      <div className="print:m-0 print:p-0 bg-gray-200 print:bg-white min-h-screen flex justify-center py-10 print:py-0">
        <div
          className="bg-white shadow-2xl print:shadow-none"
          style={{
            width: "210mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            overflow: "hidden",
            padding: "19.5mm 22mm",
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            color: "#1f2937",
            fontSize: "10pt",
            lineHeight: 1.49,
          }}
        >
          {/* ======== Header ======== */}
          <header className="mb-8 pb-6" style={{ borderBottom: "2px solid #111827" }}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-5">
                {about.avatar && (
                  <img
                    src={about.avatar}
                    alt={about.name}
                    className="rounded-full object-cover border border-gray-200 shrink-0"
                    style={{ width: 88, height: 88 }}
                  />
                )}
                <div>
                  <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#111827", marginBottom: "4px" }}>
                    {about.name}
                  </h1>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500 font-medium">
                    {about.title}
                  </p>
                  {about.motto && (
                    <p className="text-xs text-gray-400 italic mt-2" style={{ fontFamily: "'Georgia', serif" }}>
                      {about.motto}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 space-y-1 mt-1">
                {about.contactEmail && (
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{about.contactEmail}</span>
                    <Mail className="w-3 h-3 text-gray-400" />
                  </div>
                )}
                {about.phone && (
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{about.phone}</span>
                    <Phone className="w-3 h-3 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ======== Profile ======== */}
          {about.introductions.length > 0 && (
            <section className="mb-6">
              <SectionTitle>Profile</SectionTitle>
              <div className="text-gray-600 text-xs leading-relaxed space-y-1.5">
                {about.introductions.map((text, i) => (
                  <p key={i} className="whitespace-pre-line">{text}</p>
                ))}
              </div>
            </section>
          )}

          {/* ======== Experience ======== */}
          {about.experiences.length > 0 && (
            <section className="mb-6">
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-3.5">
                {about.experiences.map((exp) => (
                  <div key={exp.id} className="flex gap-4">
                    {/* 左側時間軸 */}
                    <div className="w-[100px] shrink-0 text-right">
                      <p className="text-xs text-gray-400 leading-snug whitespace-nowrap">{exp.period}</p>
                    </div>
                    {/* 分隔線 */}
                    <div className="flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    {/* 右側內容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {exp.logo && (
                          <img
                            src={exp.logo}
                            alt={exp.company}
                            className="object-contain shrink-0"
                            style={{ height: 20 }}
                          />
                        )}
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight">{exp.role}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{exp.company}</p>
                      <p className="text-xs text-gray-600 leading-snug">{exp.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ======== Education ======== */}
          {about.education.length > 0 && (
            <section className="mb-6">
              <SectionTitle>Education</SectionTitle>
              <div className="space-y-2.5">
                {about.education.map((edu) => (
                  <div key={edu.id} className="flex gap-4">
                    {/* 左側時間 */}
                    <div className="w-[100px] shrink-0 text-right">
                      <p className="text-xs text-gray-400 leading-snug whitespace-nowrap">{edu.period}</p>
                    </div>
                    {/* 分隔線 */}
                    <div className="flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    {/* 右側內容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {edu.logo && (
                          <img
                            src={edu.logo}
                            alt={edu.school}
                            className="object-contain shrink-0"
                            style={{ height: 20 }}
                          />
                        )}
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight">{edu.school}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{edu.degree}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ======== Skills ======== */}
          {about.skillGroups.length > 0 && (
            <section className="mb-6">
              <SectionTitle>Skills</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                {about.skillGroups.map((group) => (
                  <div key={group.id}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pb-1"
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      {group.category}
                    </h4>
                    <ul className="space-y-1">
                      {group.items.map((item, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ======== Awards ======== */}
          {about.awards && about.awards.length > 0 && (
            <section className="mb-5">
              <SectionTitle>Awards</SectionTitle>
              <div className="space-y-1.5">
                {about.awards.map((award) => (
                  <div key={award.id} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-800 shrink-0" />
                    <span className="text-xs text-gray-800 font-medium">{award.title}</span>
                    {award.link && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                    {award.link && (
                      <span className="text-xs text-gray-400 truncate max-w-[300px]">{award.link}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 列印專用樣式 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 210mm;
            height: 297mm;
          }
        }
      `}</style>
    </>
  );
}

// 區塊標題元件
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900 mb-3 pb-1"
      style={{ borderBottom: "1px solid #d1d5db" }}
    >
      {children}
    </h2>
  );
}
