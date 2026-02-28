"use client"

import type { CSSProperties } from "react"

// ---- Types ----

export interface CoverLetterContact {
  fullName: string
  functionalTitle: string
  industryTitle: string
  city: string
  phone: string
  email: string
  linkedin: string
  [key: string]: string
}

export interface CoverLetterRecipient {
  fullName: string
  position: string
  addressLine1: string
  addressLine2: string
  city: string
  [key: string]: string
}

export type CoverLetterTemplateCategory =
  | "Eye-Catchers"
  | "No-Nonsense"
  | "Tried & True"
  | "Clean & Simple"
  | "Cool & Quirky"
  | "Story Tellers"

export interface CoverLetterTemplate {
  id: string
  name: string
  description: string
  category: CoverLetterTemplateCategory
}

// ---- Template Options ----

export const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "bold",
    name: "Bold Template",
    description: "Strong, confident header with high contrast and clean typography.",
    category: "Eye-Catchers",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Classic corporate layout with clean lines and traditional structure.",
    category: "No-Nonsense",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium look for senior-level applications with refined styling.",
    category: "Tried & True",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean and simple design that lets your words do the talking.",
    category: "Clean & Simple",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Unique layout with modern touches for creative industries.",
    category: "Cool & Quirky",
  },
  {
    id: "narrative",
    name: "Narrative",
    description: "Story-driven format emphasizing personal connection and passion.",
    category: "Story Tellers",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with a sleek header and accent colors.",
    category: "Eye-Catchers",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless design suitable for any industry.",
    category: "Tried & True",
  },
]

// ---- Font Options ----

export const COVER_LETTER_FONTS = [
  "Bitter",
  "Inter",
  "Roboto",
  "Merriweather",
  "Montserrat",
  "Georgia",
  "PT Sans",
  "Raleway",
  "DM Sans",
  "EB Garamond",
] as const

export type CoverLetterFont = (typeof COVER_LETTER_FONTS)[number]

export const FONT_FAMILY_MAP: Record<string, string> = {
  Bitter: "'Bitter', serif",
  Inter: "'Inter', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Merriweather: "'Merriweather', serif",
  Montserrat: "'Montserrat', sans-serif",
  Georgia: "'Georgia', serif",
  "PT Sans": "'PT Sans', sans-serif",
  Raleway: "'Raleway', sans-serif",
  "DM Sans": "'DM Sans', sans-serif",
  "EB Garamond": "'EB Garamond', serif",
}

// ---- Render Functions ----

interface RenderOptions {
  contact: CoverLetterContact
  recipient: CoverLetterRecipient
  content: string
  templateId: string
  accentColor: string
  fontSize: number
  fontFamily: string
}

export function renderCoverLetter(options: RenderOptions): string {
  const { contact, recipient, content, templateId, accentColor, fontSize, fontFamily } = options
  const fontFamilyCss = FONT_FAMILY_MAP[fontFamily] || fontFamily

  switch (templateId) {
    case "bold":
      return renderBoldTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
    case "professional":
      return renderProfessionalTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
    case "executive":
      return renderExecutiveTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
    case "minimalist":
      return renderMinimalistTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
    case "creative":
      return renderCreativeTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
    case "modern":
      return renderModernTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
    default:
      return renderBoldTemplate({ contact, recipient, content, accentColor, fontSize, fontFamilyCss })
  }
}

interface TemplateArgs {
  contact: CoverLetterContact
  recipient: CoverLetterRecipient
  content: string
  accentColor: string
  fontSize: number
  fontFamilyCss: string
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function contactRow(contact: CoverLetterContact, separator = " | ", color = "#888"): string {
  const parts = [contact.city, contact.phone, contact.email, contact.linkedin].filter(Boolean)
  return parts.map((p) => `<span style="color:${color}">${esc(p)}</span>`).join(separator)
}

function recipientBlock(recipient: CoverLetterRecipient): string {
  const lines = [
    recipient.fullName,
    recipient.position,
    recipient.addressLine1,
    recipient.addressLine2,
    recipient.city,
  ].filter(Boolean)
  return lines.map((l) => `<div>${esc(l)}</div>`).join("")
}

function renderBoldTemplate(args: TemplateArgs): string {
  const { contact, recipient, content, accentColor, fontSize, fontFamilyCss } = args
  return `
    <div style="font-family:${fontFamilyCss};font-size:${fontSize}pt;color:#1a1a2e;min-height:100%;">
      <div style="background:${accentColor};color:#fff;padding:32px 40px;">
        <div style="font-size:${fontSize * 2.4}pt;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;">${esc(contact.fullName)}</div>
        <div style="font-size:${fontSize * 1.1}pt;font-weight:600;opacity:0.9;margin-top:2px;">${esc(contact.functionalTitle)}</div>
        <div style="font-size:${fontSize * 0.9}pt;font-weight:500;opacity:0.8;">${esc(contact.industryTitle)}</div>
        <div style="margin-top:14px;font-size:${fontSize * 0.8}pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">
          ${contactRow(contact, " &nbsp;&nbsp;&nbsp; ", "#ffffffcc")}
        </div>
      </div>
      <div style="padding:28px 40px;">
        <div style="font-size:${fontSize * 0.9}pt;color:#555;line-height:1.4;margin-bottom:20px;">
          ${recipientBlock(recipient)}
        </div>
        <div style="line-height:1.7;white-space:pre-wrap;">${content}</div>
      </div>
    </div>
  `
}

function renderProfessionalTemplate(args: TemplateArgs): string {
  const { contact, recipient, content, accentColor, fontSize, fontFamilyCss } = args
  return `
    <div style="font-family:${fontFamilyCss};font-size:${fontSize}pt;color:#333;min-height:100%;">
      <div style="padding:36px 40px;border-bottom:3px solid ${accentColor};">
        <div style="font-size:${fontSize * 1.8}pt;font-weight:700;color:#222;">${esc(contact.fullName)}</div>
        <div style="font-size:${fontSize * 1}pt;color:#666;margin-top:4px;">${esc(contact.functionalTitle)} &bull; ${esc(contact.industryTitle)}</div>
        <div style="margin-top:10px;font-size:${fontSize * 0.85}pt;color:#888;">
          ${contactRow(contact)}
        </div>
      </div>
      <div style="padding:28px 40px;">
        <div style="font-size:${fontSize * 0.9}pt;color:#555;line-height:1.4;margin-bottom:20px;">
          ${recipientBlock(recipient)}
        </div>
        <div style="line-height:1.7;white-space:pre-wrap;">${content}</div>
      </div>
    </div>
  `
}

function renderExecutiveTemplate(args: TemplateArgs): string {
  const { contact, recipient, content, accentColor, fontSize, fontFamilyCss } = args
  return `
    <div style="font-family:${fontFamilyCss};font-size:${fontSize}pt;color:#2c2c2c;min-height:100%;">
      <div style="padding:40px 48px;text-align:center;border-bottom:2px solid ${accentColor};">
        <div style="font-size:${fontSize * 2}pt;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${accentColor};">${esc(contact.fullName)}</div>
        <div style="font-size:${fontSize * 1}pt;color:#555;margin-top:6px;">${esc(contact.functionalTitle)}</div>
        <div style="margin-top:12px;font-size:${fontSize * 0.8}pt;color:#888;">
          ${contactRow(contact, " &nbsp;•&nbsp; ")}
        </div>
      </div>
      <div style="padding:32px 48px;">
        <div style="font-size:${fontSize * 0.9}pt;color:#555;line-height:1.4;margin-bottom:24px;">
          ${recipientBlock(recipient)}
        </div>
        <div style="line-height:1.75;white-space:pre-wrap;">${content}</div>
      </div>
    </div>
  `
}

function renderMinimalistTemplate(args: TemplateArgs): string {
  const { contact, recipient, content, accentColor, fontSize, fontFamilyCss } = args
  return `
    <div style="font-family:${fontFamilyCss};font-size:${fontSize}pt;color:#444;min-height:100%;padding:48px 44px;">
      <div style="margin-bottom:28px;">
        <div style="font-size:${fontSize * 1.6}pt;font-weight:600;color:#222;">${esc(contact.fullName)}</div>
        <div style="font-size:${fontSize * 0.85}pt;color:#999;margin-top:4px;">
          ${contactRow(contact, " &middot; ", "#999")}
        </div>
      </div>
      <div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-bottom:20px;">
        <div style="font-size:${fontSize * 0.9}pt;color:#666;line-height:1.4;">
          ${recipientBlock(recipient)}
        </div>
      </div>
      <div style="line-height:1.75;white-space:pre-wrap;">${content}</div>
    </div>
  `
}

function renderCreativeTemplate(args: TemplateArgs): string {
  const { contact, recipient, content, accentColor, fontSize, fontFamilyCss } = args
  return `
    <div style="font-family:${fontFamilyCss};font-size:${fontSize}pt;color:#2d2d2d;min-height:100%;">
      <div style="display:flex;">
        <div style="width:6px;background:${accentColor};"></div>
        <div style="flex:1;padding:32px 36px;">
          <div style="font-size:${fontSize * 2}pt;font-weight:800;color:${accentColor};">${esc(contact.fullName)}</div>
          <div style="font-size:${fontSize}pt;color:#777;margin-top:2px;">${esc(contact.functionalTitle)} — ${esc(contact.industryTitle)}</div>
          <div style="margin-top:10px;font-size:${fontSize * 0.8}pt;color:#999;">
            ${contactRow(contact, " / ", "#999")}
          </div>
        </div>
      </div>
      <div style="padding:24px 42px;">
        <div style="font-size:${fontSize * 0.9}pt;color:#666;line-height:1.4;margin-bottom:20px;">
          ${recipientBlock(recipient)}
        </div>
        <div style="line-height:1.7;white-space:pre-wrap;">${content}</div>
      </div>
    </div>
  `
}

function renderModernTemplate(args: TemplateArgs): string {
  const { contact, recipient, content, accentColor, fontSize, fontFamilyCss } = args
  return `
    <div style="font-family:${fontFamilyCss};font-size:${fontSize}pt;color:#1e293b;min-height:100%;">
      <div style="background:linear-gradient(135deg,${accentColor},${accentColor}dd);color:#fff;padding:28px 40px;border-radius:0 0 16px 16px;">
        <div style="font-size:${fontSize * 2}pt;font-weight:800;">${esc(contact.fullName)}</div>
        <div style="font-size:${fontSize * 1}pt;opacity:0.9;margin-top:4px;">${esc(contact.functionalTitle)}</div>
        <div style="margin-top:12px;font-size:${fontSize * 0.8}pt;opacity:0.8;">
          ${contactRow(contact, " &nbsp;|&nbsp; ", "#ffffffbb")}
        </div>
      </div>
      <div style="padding:28px 40px;">
        <div style="font-size:${fontSize * 0.9}pt;color:#64748b;line-height:1.4;margin-bottom:20px;">
          ${recipientBlock(recipient)}
        </div>
        <div style="line-height:1.7;white-space:pre-wrap;">${content}</div>
      </div>
    </div>
  `
}
