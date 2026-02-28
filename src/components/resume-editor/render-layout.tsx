import { ResumeData } from "@/hooks/use-resume-builder"
import { cn } from "@/lib/utils"
import type { CSSProperties, ReactNode } from "react"

export type TemplateCategory =
  | "Eye-Catchers"
  | "No-Nonsense"
  | "Tried & True"
  | "Clean & Simple"
  | "Cool & Quirky"
  | "Story Tellers"

export type TemplateOption = {
  id: string
  name: string
  description: string
  category: TemplateCategory
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "modern", name: "Modern", description: "Strong visual hierarchy with clean panels.", category: "Eye-Catchers" },
  { id: "bold", name: "Bold", description: "High-impact styling for standout applications.", category: "Eye-Catchers" },
  { id: "dynamic", name: "Dynamic", description: "Energetic layout with prominent sections.", category: "Eye-Catchers" },
  { id: "horizon", name: "Horizon", description: "Wide, contemporary composition with clear contrast.", category: "Eye-Catchers" },
  { id: "vibrant", name: "Vibrant", description: "Expressive and color-forward without sacrificing clarity.", category: "Eye-Catchers" },
  { id: "spotlight", name: "Spotlight", description: "Content-first layout that emphasizes readability.", category: "No-Nonsense" },
  { id: "standard", name: "Standard", description: "Straightforward layout that is ATS-friendly.", category: "No-Nonsense" },
  { id: "corporate", name: "Corporate", description: "Conservative structure for enterprise roles.", category: "No-Nonsense" },
  { id: "executive", name: "Executive", description: "Polished hierarchy for senior-level candidates.", category: "No-Nonsense" },
  { id: "functional", name: "Functional", description: "Skills-forward arrangement with practical structure.", category: "No-Nonsense" },
  { id: "simple", name: "Simple", description: "Direct, low-noise structure for concise resumes.", category: "No-Nonsense" },
  { id: "academic", name: "Academic", description: "Extended layout for detail-heavy profiles.", category: "No-Nonsense" },
  { id: "classic", name: "Classic", description: "Traditional resume layout trusted by recruiters.", category: "Tried & True" },
  { id: "minimal", name: "Minimal", description: "Whitespace-driven layout with elegant typography.", category: "Clean & Simple" },
  { id: "air", name: "Air", description: "Open visual rhythm with balanced section spacing.", category: "Clean & Simple" },
  { id: "focus", name: "Focus", description: "Prioritizes key sections with subtle emphasis.", category: "Clean & Simple" },
  { id: "compact", name: "Compact", description: "Densely organized format for one-page targeting.", category: "Clean & Simple" },
  { id: "tech", name: "Tech", description: "Modern technical style with concise sectioning.", category: "Cool & Quirky" },
  { id: "startup", name: "Startup", description: "Fresh layout with modern rhythm and spacing.", category: "Cool & Quirky" },
  { id: "creative", name: "Creative", description: "Expressive styling for design-forward profiles.", category: "Cool & Quirky" },
  { id: "narrative", name: "Narrative", description: "Story-led layout emphasizing career journey.", category: "Story Tellers" },
  { id: "journey", name: "Journey", description: "Sequential flow for progression-focused resumes.", category: "Story Tellers" },
]

export const SAMPLE_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "Alex Johnson",
    functionalTitle: "Senior Product Designer",
    industryTitle: "UX / Product Design",
    email: "alex@example.com",
    phone: "+1 (555) 234-5678",
    linkedin: "linkedin.com/in/alexjohnson",
    portfolio: "alexjohnson.io",
    address: "San Francisco, CA",
    photo: "",
  },
  summary:
    "<p>Dynamic product designer with 6+ years crafting intuitive digital experiences. Proven track record of leading cross-functional teams to deliver products used by millions.</p>",
  coreCompetencies:
    "<ul><li>UX Research & Strategy</li><li>Figma & Prototyping</li><li>Design Systems</li><li>Agile Product Development</li></ul>",
  achievements:
    "<ul><li>Design Leadership Award, Google 2023</li><li>Speaker at Config 2022 design conference</li></ul>",
  workExperienceRich:
    "<p><strong>Senior Product Designer</strong><br>Google — Mountain View, CA<br>March 2021 – Present</p><ul><li>Led redesign of core search experience increasing user satisfaction by 22%</li><li>Managed a team of 4 designers delivering features across 3 product lines</li><li>Established design system adopted by 8 engineering teams</li></ul>",
  educationRich:
    "<p><strong>B.Sc. Computer Science</strong><br>University of California, Berkeley — Berkeley, CA<br>Graduated May 2021</p><ul><li>Relevant coursework: HCI, Web Development, Algorithms</li></ul>",
  skillsRich:
    "<ul><li>Figma, Sketch, Adobe XD</li><li>React, TypeScript, Node.js</li><li>AWS, Firebase, PostgreSQL</li></ul>",
  workExperience: [],
  education: [],
  skills: { technical: "", soft: "" },
  projects: [],
  languages: [],
  certifications: [],
  associations: [],
  customSections: [],
}

const SIDEBAR_TEMPLATES = ["modern", "bold", "dynamic", "spotlight", "tech", "startup"]
const CLASSIC_TEMPLATES = ["classic", "corporate", "executive", "standard", "academic", "functional"]
const CREATIVE_TEMPLATES = ["horizon", "vibrant", "creative", "narrative", "journey"]

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")

const toHtml = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.includes("<")) return trimmed
  return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br />")}</p>`
}

const hasContent = (value: string) => value.trim().length > 0

const ResumeContentStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html:
        ".resume-content ul { list-style-type: disc; padding-left: 1rem; }" +
        ".resume-content ol { list-style-type: decimal; padding-left: 1rem; }" +
        ".resume-content strong { font-weight: 700; }" +
        ".resume-content em { font-style: italic; }",
    }}
  />
)

type HtmlContentProps = {
  html: string
  className?: string
}

const HtmlContent = ({ html, className }: HtmlContentProps) => {
  const normalized = toHtml(html)
  if (!normalized) return null

  return (
    <div
      className={cn("resume-content", className)}
      style={{ fontSize: "inherit", lineHeight: "inherit" }}
      dangerouslySetInnerHTML={{ __html: normalized }}
    />
  )
}

export const formatDate = (dateString: string) => {
  if (!dateString) return ""
  if (dateString === "Present") return "Present"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    } catch {
      return dateString
    }
  }
  return dateString
}

const renderExperienceFallback = (data: ResumeData) => {
  if (hasContent(data.workExperienceRich)) {
    return <HtmlContent html={data.workExperienceRich} className="text-sm" />
  }

  if (!data.workExperience.length) return null

  return (
    <div className="space-y-4">
      {data.workExperience.map((exp) => (
        <div key={exp.id || `${exp.company}-${exp.role}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{exp.role}</p>
            <p className="text-xs text-slate-500">
              {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
            </p>
          </div>
          <p className="text-sm text-slate-600">{exp.company}</p>
          <HtmlContent html={exp.achievements} className="mt-1 text-sm" />
        </div>
      ))}
    </div>
  )
}

const renderEducationFallback = (data: ResumeData) => {
  if (hasContent(data.educationRich)) {
    return <HtmlContent html={data.educationRich} className="text-sm" />
  }

  if (!data.education.length) return null

  return (
    <div className="space-y-4">
      {data.education.map((edu) => (
        <div key={edu.id || `${edu.school}-${edu.degree}`}>
          <p className="font-semibold">{edu.degree}</p>
          <p className="text-sm text-slate-600">{edu.school}</p>
          <p className="text-xs text-slate-500">
            {edu.admissionYear && `${edu.admissionYear} - `}
            {edu.graduationYear}
          </p>
          <HtmlContent html={edu.description} className="mt-1 text-sm" />
        </div>
      ))}
    </div>
  )
}

const renderSkillsFallback = (data: ResumeData) => {
  if (hasContent(data.skillsRich)) {
    return <HtmlContent html={data.skillsRich} className="text-sm" />
  }

  const skillText = [data.skills.technical, data.skills.soft].filter(Boolean).join("\n")
  if (!skillText) return null

  return <HtmlContent html={skillText} className="text-sm" />
}

type SectionProps = {
  title: string
  body: ReactNode
  headingClassName: string
  headingStyle?: CSSProperties
  className?: string
}

const Section = ({ title, body, headingClassName, headingStyle, className }: SectionProps) => {
  if (!body) return null

  return (
    <section className={className}>
      <h3 className={headingClassName} style={headingStyle}>
        {title}
      </h3>
      <div className="mt-2">{body}</div>
    </section>
  )
}

const renderSupplementarySections = (data: ResumeData, headingClassName: string, headingStyle?: CSSProperties) => (
  <>
    {data.projects.length > 0 && (
      <Section
        title="PROJECTS"
        headingClassName={headingClassName}
        headingStyle={headingStyle}
        body={
          <div className="space-y-3 text-sm">
            {data.projects.map((project) => (
              <div key={project.id || `${project.title}-${project.link}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{project.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(project.startDate)}
                    {project.startDate && project.endDate ? " - " : ""}
                    {formatDate(project.endDate)}
                  </p>
                </div>
                {project.link && <p className="text-xs text-slate-500">{project.link}</p>}
                <p className="text-sm">{project.description}</p>
              </div>
            ))}
          </div>
        }
      />
    )}

    {data.achievements.trim() && (
      <Section
        title="ACHIEVEMENTS"
        headingClassName={headingClassName}
        headingStyle={headingStyle}
        body={<HtmlContent html={data.achievements} className="text-sm" />}
      />
    )}

    {data.customSections.map((section) => (
      <Section
        key={section.id}
        title={section.title.toUpperCase()}
        headingClassName={headingClassName}
        headingStyle={headingStyle}
        body={<HtmlContent html={section.content} className="text-sm" />}
      />
    ))}
  </>
)

const SidebarHeader = ({ data, accentColor }: { data: ResumeData; accentColor: string }) => (
  <header className="relative space-y-2 pr-24">
    <h1 className="text-3xl font-bold uppercase tracking-tight" style={{ color: accentColor }}>
      {data.personalInfo.fullName || "Your Name"}
    </h1>
    <p className="text-xl font-semibold" style={{ color: accentColor }}>
      {data.personalInfo.functionalTitle || "Professional Title"}
    </p>
    {data.personalInfo.industryTitle && <p className="text-sm text-slate-500">{data.personalInfo.industryTitle}</p>}
    {data.personalInfo.photo && (
      <img
        src={data.personalInfo.photo}
        alt="Profile"
        className="absolute right-0 top-0 h-20 w-20 rounded-full object-cover"
      />
    )}
  </header>
)

const ContactRow = ({ data }: { data: ResumeData }) => {
  const fields = [
    data.personalInfo.address,
    data.personalInfo.phone,
    data.personalInfo.email,
    data.personalInfo.linkedin,
    data.personalInfo.portfolio,
  ].filter(Boolean)

  if (!fields.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
      {fields.map((field) => (
        <span key={field} className="rounded border border-slate-300 px-2 py-1">
          {field}
        </span>
      ))}
    </div>
  )
}

const renderMainContentSections = (data: ResumeData, headingClassName: string, headingStyle?: CSSProperties) => (
  <>
    <Section
      title="PROFESSIONAL SUMMARY"
      headingClassName={headingClassName}
      headingStyle={headingStyle}
      body={data.summary ? <HtmlContent html={data.summary} className="text-sm" /> : null}
    />
    {data.coreCompetencies.trim() && (
      <Section
        title="CORE COMPETENCIES"
        headingClassName={headingClassName}
        headingStyle={headingStyle}
        body={<HtmlContent html={data.coreCompetencies} className="text-sm" />}
      />
    )}
    <Section
      title="PROFESSIONAL EXPERIENCE"
      headingClassName={headingClassName}
      headingStyle={headingStyle}
      body={renderExperienceFallback(data)}
    />
    <Section
      title="EDUCATION"
      headingClassName={headingClassName}
      headingStyle={headingStyle}
      body={renderEducationFallback(data)}
    />
    <Section
      title="TECHNICAL SKILLS"
      headingClassName={headingClassName}
      headingStyle={headingStyle}
      body={renderSkillsFallback(data)}
    />
    {renderSupplementarySections(data, headingClassName, headingStyle)}
  </>
)

const renderSidebarLayout = (data: ResumeData, accentColor: string) => (
  <div className="flex min-h-[297mm]">
    <ResumeContentStyles />
    <aside className="w-[30%] bg-slate-900 p-6 text-slate-100">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Contact</h3>
      <div className="mt-3 space-y-2 text-sm">
        {data.personalInfo.email && <p>{data.personalInfo.email}</p>}
        {data.personalInfo.phone && <p>{data.personalInfo.phone}</p>}
        {data.personalInfo.address && <p>{data.personalInfo.address}</p>}
        {data.personalInfo.linkedin && <p>{data.personalInfo.linkedin}</p>}
        {data.personalInfo.portfolio && <p>{data.personalInfo.portfolio}</p>}
      </div>

      {data.languages.length > 0 && (
        <section className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Languages</h3>
          <div className="mt-2 space-y-1 text-sm">
            {data.languages.map((language) => (
              <p key={language.id || language.name}>
                {language.name} - <span className="text-slate-300">{language.proficiency}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      {data.certifications.length > 0 && (
        <section className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Certifications</h3>
          <div className="mt-2 space-y-2 text-sm">
            {data.certifications.map((cert) => (
              <p key={cert.id || cert.name}>
                {cert.name}
                <br />
                <span className="text-slate-300">{cert.issuer} ({cert.year})</span>
              </p>
            ))}
          </div>
        </section>
      )}

      {data.associations.length > 0 && (
        <section className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Associations</h3>
          <div className="mt-2 space-y-2 text-sm">
            {data.associations.map((association) => (
              <p key={association.id || association.name}>
                {association.name}
                <br />
                <span className="text-slate-300">{association.role}</span>
              </p>
            ))}
          </div>
        </section>
      )}
    </aside>

    <main className="w-[70%] p-8 text-slate-800">
      <SidebarHeader data={data} accentColor={accentColor} />
      <ContactRow data={data} />
      <div className="mt-8 space-y-6">
        {renderMainContentSections(
          data,
          "text-sm font-bold uppercase tracking-[0.2em] border-b pb-1",
          { color: accentColor, borderColor: accentColor }
        )}
      </div>
    </main>
  </div>
)

const renderClassicLayout = (data: ResumeData, accentColor: string) => (
  <div className="min-h-[297mm] p-10 text-slate-900">
    <ResumeContentStyles />
    <header className="relative border-b pb-6 text-center" style={{ borderColor: accentColor }}>
      <h1 className="text-3xl font-serif font-bold uppercase">{data.personalInfo.fullName || "Your Name"}</h1>
      <p className="mt-2 text-xl font-semibold" style={{ color: accentColor }}>
        {data.personalInfo.functionalTitle || "Professional Title"}
      </p>
      {data.personalInfo.industryTitle && <p className="text-sm text-slate-500">{data.personalInfo.industryTitle}</p>}
      {data.personalInfo.photo && (
        <img
          src={data.personalInfo.photo}
          alt="Profile"
          className="absolute right-0 top-0 h-20 w-20 rounded-full object-cover"
        />
      )}
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-slate-600">
        {[data.personalInfo.address, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.portfolio]
          .filter(Boolean)
          .map((field) => (
            <span key={field}>{field}</span>
          ))}
      </div>
    </header>

    <div className="mt-6 space-y-5">
      {renderMainContentSections(
        data,
        "bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] border-l-4",
        { borderColor: accentColor }
      )}
    </div>
  </div>
)

const renderCreativeLayout = (data: ResumeData, accentColor: string) => (
  <div className="min-h-[297mm] bg-white">
    <ResumeContentStyles />
    <header className="relative p-8 text-white" style={{ backgroundColor: accentColor }}>
      <h1 className="text-4xl font-black tracking-tight">{data.personalInfo.fullName || "Your Name"}</h1>
      <p className="mt-2 text-2xl font-semibold">{data.personalInfo.functionalTitle || "Professional Title"}</p>
      {data.personalInfo.industryTitle && <p className="text-sm text-white/80">{data.personalInfo.industryTitle}</p>}
      <div className="mt-3 space-y-1 text-xs text-white/90">
        {[data.personalInfo.address, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.portfolio]
          .filter(Boolean)
          .map((field) => (
            <p key={field}>{field}</p>
          ))}
      </div>
      {data.personalInfo.photo && (
        <img
          src={data.personalInfo.photo}
          alt="Profile"
          className="absolute right-8 top-8 h-20 w-20 rounded-full object-cover"
        />
      )}
    </header>

    <div className="grid grid-cols-3 gap-8 p-8 text-slate-800">
      <div className="col-span-2 space-y-6">
        {renderMainContentSections(data, "text-base font-bold uppercase tracking-wide", { color: accentColor })}
      </div>
      <div className="space-y-6">
        {data.languages.length > 0 && (
          <Section
            title="LANGUAGES"
            headingClassName="text-base font-bold uppercase tracking-wide"
            headingStyle={{ color: accentColor }}
            body={
              <div className="space-y-1 text-sm">
                {data.languages.map((language) => (
                  <p key={language.id || language.name}>
                    {language.name} - {language.proficiency}
                  </p>
                ))}
              </div>
            }
          />
        )}

        {data.certifications.length > 0 && (
          <Section
            title="CERTIFICATIONS"
            headingClassName="text-base font-bold uppercase tracking-wide"
            headingStyle={{ color: accentColor }}
            body={
              <div className="space-y-2 text-sm">
                {data.certifications.map((cert) => (
                  <p key={cert.id || cert.name}>
                    {cert.name}
                    <br />
                    <span className="text-slate-500">{cert.issuer} ({cert.year})</span>
                  </p>
                ))}
              </div>
            }
          />
        )}

        {data.associations.length > 0 && (
          <Section
            title="ASSOCIATIONS"
            headingClassName="text-base font-bold uppercase tracking-wide"
            headingStyle={{ color: accentColor }}
            body={
              <div className="space-y-2 text-sm">
                {data.associations.map((association) => (
                  <p key={association.id || association.name}>
                    {association.name}
                    <br />
                    <span className="text-slate-500">{association.role}</span>
                  </p>
                ))}
              </div>
            }
          />
        )}
      </div>
    </div>
  </div>
)

const renderMinimalLayout = (data: ResumeData, accentColor: string) => (
  <div className="min-h-[297mm] p-10 text-slate-800">
    <ResumeContentStyles />
    <header className="relative border-b pb-6" style={{ borderColor: accentColor }}>
      <h1 className="text-4xl font-light tracking-tight">{data.personalInfo.fullName || "Your Name"}</h1>
      <p className="mt-1 text-xl font-semibold" style={{ color: accentColor }}>
        {data.personalInfo.functionalTitle || "Professional Title"}
      </p>
      {data.personalInfo.industryTitle && <p className="text-sm text-slate-500">{data.personalInfo.industryTitle}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {[data.personalInfo.address, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.portfolio]
          .filter(Boolean)
          .map((field) => (
            <span key={field}>{field}</span>
          ))}
      </div>
      {data.personalInfo.photo && (
        <img
          src={data.personalInfo.photo}
          alt="Profile"
          className="absolute right-0 top-0 h-20 w-20 rounded-full object-cover"
        />
      )}
    </header>

    <div className="mt-6 grid grid-cols-12 gap-8">
      <aside className="col-span-4 space-y-6">
        <Section
          title="EDUCATION"
          headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
          headingStyle={{ borderColor: accentColor, color: accentColor }}
          body={renderEducationFallback(data)}
        />
        <Section
          title="TECHNICAL SKILLS"
          headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
          headingStyle={{ borderColor: accentColor, color: accentColor }}
          body={renderSkillsFallback(data)}
        />

        {data.languages.length > 0 && (
          <Section
            title="LANGUAGES"
            headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
            headingStyle={{ borderColor: accentColor, color: accentColor }}
            body={
              <div className="space-y-1 text-sm">
                {data.languages.map((language) => (
                  <p key={language.id || language.name}>
                    {language.name} - {language.proficiency}
                  </p>
                ))}
              </div>
            }
          />
        )}

        {data.certifications.length > 0 && (
          <Section
            title="CERTIFICATIONS"
            headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
            headingStyle={{ borderColor: accentColor, color: accentColor }}
            body={
              <div className="space-y-2 text-sm">
                {data.certifications.map((cert) => (
                  <p key={cert.id || cert.name}>
                    {cert.name}
                    <br />
                    <span className="text-slate-500">{cert.year}</span>
                  </p>
                ))}
              </div>
            }
          />
        )}
      </aside>

      <main className="col-span-8 space-y-6">
        <Section
          title="PROFESSIONAL SUMMARY"
          headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
          headingStyle={{ borderColor: accentColor, color: accentColor }}
          body={data.summary ? <HtmlContent html={data.summary} className="text-sm" /> : null}
        />
        {data.coreCompetencies.trim() && (
          <Section
            title="CORE COMPETENCIES"
            headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
            headingStyle={{ borderColor: accentColor, color: accentColor }}
            body={<HtmlContent html={data.coreCompetencies} className="text-sm" />}
          />
        )}
        <Section
          title="PROFESSIONAL EXPERIENCE"
          headingClassName="text-xs font-bold uppercase tracking-[0.2em] border-b pb-1"
          headingStyle={{ borderColor: accentColor, color: accentColor }}
          body={renderExperienceFallback(data)}
        />

        {renderSupplementarySections(
          data,
          "text-xs font-bold uppercase tracking-[0.2em] border-b pb-1",
          { borderColor: accentColor, color: accentColor }
        )}
      </main>
    </div>
  </div>
)

// Maps sidebar section IDs to the resumeData fields they control.
// When a section is hidden we blank its content so layout renderers
// naturally skip it (they already guard on empty strings).
function applyHiddenSections(data: ResumeData, hiddenSections: string[]): ResumeData {
  if (hiddenSections.length === 0) return data

  const hidden = new Set(hiddenSections)
  return {
    ...data,
    summary: hidden.has("summary") ? "" : data.summary,
    coreCompetencies: hidden.has("coreCompetencies") ? "" : data.coreCompetencies,
    achievements: hidden.has("achievements") ? "" : data.achievements,
    workExperienceRich: hidden.has("experience") ? "" : data.workExperienceRich,
    workExperience: hidden.has("experience") ? [] : data.workExperience,
    educationRich: hidden.has("education") ? "" : data.educationRich,
    education: hidden.has("education") ? [] : data.education,
    skillsRich: hidden.has("skills") ? "" : data.skillsRich,
    skills: hidden.has("skills")
      ? { technical: "", soft: "" }
      : data.skills,
    projects: hidden.has("projects") ? [] : data.projects,
    languages: hidden.has("languages") ? [] : data.languages,
    certifications: hidden.has("certifications") ? [] : data.certifications,
    associations: hidden.has("associations") ? [] : data.associations,
    customSections: data.customSections.filter((s) => !hidden.has(s.id)),
  }
}

export function renderLayout(
  templateId: string,
  data: ResumeData,
  accentColor = "#2563eb",
  hiddenSections: string[] = []
) {
  // Filter resumeData so hidden sections have their content blanked out
  // before being passed to any layout renderer. This is simpler and safer
  // than threading hiddenSections through every sub-renderer.
  const filtered = applyHiddenSections(data, hiddenSections)

  if (SIDEBAR_TEMPLATES.includes(templateId)) {
    return renderSidebarLayout(filtered, accentColor)
  }

  if (CLASSIC_TEMPLATES.includes(templateId)) {
    return renderClassicLayout(filtered, accentColor)
  }

  if (CREATIVE_TEMPLATES.includes(templateId)) {
    return renderCreativeLayout(filtered, accentColor)
  }

  return renderMinimalLayout(filtered, accentColor)
}




