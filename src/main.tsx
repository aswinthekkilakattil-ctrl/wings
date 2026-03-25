import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createPortal } from 'react-dom'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles.css'
import './alert.css'

import logoSrc from './assets/logo2.png'
import boySrc from './assets/man2.webp'
import offerSrc from './assets/offer.webp'
import tabSrc from './assets/tab.webp'
import footer1Src from './assets/footer1.webp'
import ad1Src from './assets/Ad1.webp'
import ad2Src from './assets/Ad2.webp'
import ad3Src from './assets/Ad3.webp'

type LeadForm = {
  studentName: string
  guardianName: string
  phone: string
  school: string
  standard: string
  place: string
  consent: boolean
}

type LeadRecord = LeadForm & {
  id: string
  submittedAt: string
}

type LeadApiPayload = {
  id: string
  submittedAt: string
  studentName: string
  guardianName: string
  phone: string
  school: string
  standard: string
  place: string
  consent: boolean
}

type MongoHealthPayload = {
  connected?: boolean
  error?: string
}

type SiteConfig = {
  meta: {
    title: string
    description: string
    keywords: string
    ogTitle: string
    ogDescription: string
    ogImage: string
  }
  hero: {
    badge: string
    titleMain: string
    titleHighlight: string
    intro1: string
    intro2: string
    ctaText: string
  }
  features: [string, string, string, string]
  giveaway: {
    title: string
    text: string
    english: string
  }
  campaignTitle: string
  registrationCloseDate: string
  form: {
    urgencyText: string
    eyebrow: string
    title: string
    subtitle: string
    studentLabel: string
    studentPlaceholder: string
    guardianLabel: string
    guardianPlaceholder: string
    phoneLabel: string
    phonePlaceholder: string
    standardLabel: string
    standardPlaceholder: string
    standardOptions: [string, string]
    schoolLabel: string
    schoolPlaceholder: string
    placeLabel: string
    placePlaceholder: string
    consentText: string
    submitText: string
    submittingText: string
  }
  infoCards: [
    { icon: string; title: string; text: string },
    { icon: string; title: string; text: string },
    { icon: string; title: string; text: string },
    { icon: string; title: string; text: string }
  ]
  footerText: string
  images: {
    logo: string
    boy: string
    offer: string
    tab: string
    footer: string
    ads: [string, string, string]
  }
}

const STORAGE_KEY = 'wingscampus-leads'
const FAKE_COUNTER_KEY = 'wingscampus-fake-giveaway-count'
const LIVE_COUNTER_KEY = 'wingscampus-live-counter'
const ADMIN_AUTH_KEY = 'wingscampus-admin-auth'
const SITE_CONFIG_KEY = 'wingscampus-site-config'
const CP_AUTH_KEY = 'wingscampus-cp-auth'
const GIVEAWAY_LIMIT = 100
const FAKE_COUNTER_MAX = 86
const LIVE_COUNTER_MIN = 20
const LIVE_COUNTER_MAX = 80
const ADMIN_USER_ID = (import.meta.env.VITE_ADMIN_USER_ID ?? '').trim()
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD ?? '').trim()
const CP_USER_ID = (import.meta.env.VITE_CP_USER_ID ?? '').trim()
const CP_PASSWORD = (import.meta.env.VITE_CP_PASSWORD ?? '').trim()

const MONGO_DATA_API_URL = (import.meta.env.VITE_MONGO_DATA_API_URL ?? '').trim()
const MONGO_DATA_API_KEY = (import.meta.env.VITE_MONGO_DATA_API_KEY ?? '').trim()
const MONGO_DATA_SOURCE = (import.meta.env.VITE_MONGO_DATA_SOURCE ?? '').trim()
const MONGO_DB = (import.meta.env.VITE_MONGO_DB ?? '').trim()
const MONGO_LEADS_COLLECTION = (import.meta.env.VITE_MONGO_LEADS_COLLECTION ?? 'leads').trim()
const MONGO_CONFIG_COLLECTION = (import.meta.env.VITE_MONGO_CONFIG_COLLECTION ?? 'siteConfig').trim()
const MONGO_ENABLED = Boolean(MONGO_DATA_API_URL && MONGO_DATA_API_KEY && MONGO_DATA_SOURCE && MONGO_DB)
const MONGO_CONFIG_ENABLED = Boolean(MONGO_ENABLED && MONGO_CONFIG_COLLECTION)
const SITE_CONFIG_DOC_ID = 'site-config'
const LOCAL_FALLBACK_ENABLED = import.meta.env.DEV

const DEFAULT_SITE_CONFIG: SiteConfig = {
  meta: {
    title: 'Wings Campus - NEET/JEE Foundation Course',
    description: 'Wings Campus Kodungallur: NEET/JEE foundation for Classes 7 and 8. Register now.',
    keywords: 'Wings Campus, NEET, JEE, foundation course, Kodungallur',
    ogTitle: 'Wings Campus Kodungallur',
    ogDescription: 'Strong early preparation for NEET/JEE starts from Classes 7 and 8.',
    ogImage: offerSrc,
  },
  hero: {
    badge: 'WINGS OLYMPIAD',
    titleMain: 'WINGS',
    titleHighlight: 'OLYMPIAD',
    intro1: 'A talent search for young minds',
    intro2: 'Register now! One lucky user from the first 100 registrations will win a Tablet.',
    ctaText: 'Register Now',
  },
  features: ['📚 Expert Faculty', '🎯 Exam-Oriented Training', '🏫 STATE & CBSE', '📝 Class 7 & 8'],
  giveaway: {
    title: 'Win a Brand-New Tablet',
    text: 'First 100 registrations will enter the lucky draw for a Tablet.',
    english: 'Register among the first 100 students and enter the giveaway.',
  },
  campaignTitle: 'Our Campaigns',
  registrationCloseDate: '',
  form: {
    urgencyText: 'Only {spotsLeft} spots left for the Tablet Giveaway',
    eyebrow: 'Registration / രജിസ്ട്രേഷൻ',
    title: 'ഇപ്പോൾ രജിസ്റ്റർ ചെയ്യൂ',
    subtitle: "Complete this short form to reserve your child's seat in Wings Campus Foundation Course.",
    studentLabel: 'Student Name / വിദ്യാർത്ഥിയുടെ പേര് *',
    studentPlaceholder: "Enter student's full name",
    guardianLabel: 'Guardian Name / രക്ഷിതാവിന്റെ പേര് *',
    guardianPlaceholder: "Enter guardian's name",
    phoneLabel: 'Phone / ഫോൺ *',
    phonePlaceholder: '10-digit number',
    standardLabel: 'Standard / ക്ലാസ് *',
    standardPlaceholder: 'Select',
    standardOptions: ['6th Standard', '7th Standard'],
    schoolLabel: 'School Name / സ്കൂളിന്റെ പേര് *',
    schoolPlaceholder: 'Enter school name',
    placeLabel: 'Place / സ്ഥലം *',
    placePlaceholder: 'Enter your place / town',
    consentText: 'I authorize Wings Campus to contact me regarding the Foundation Course and Tablet Giveaway.',
    submitText: 'Register Now / ഇപ്പോൾ രജിസ്റ്റർ ചെയ്യൂ',
    submittingText: 'Submitting...',
  },
  infoCards: [
    { icon: '🎁', title: 'Tablet Giveaway', text: 'ആദ്യത്തെ 100 രജിസ്ട്രേഷനുകളിൽ നിന്ന് ഒരു lucky winner ന് ഒരു tablet.' },
    { icon: '🎓', title: 'Why Foundation Course?', text: 'Early preparation during school years builds stronger basics for NEET and JEE.' },
    { icon: '🏆', title: 'Wings Campus Advantage', text: 'Expert faculty, structured curriculum, and exam-focused methods in Kodungallur.' },
    { icon: '📍', title: 'Limited Seats', text: 'Batch size is limited for personal attention. Complete registration early to reserve your seat.' },
  ],
  footerText: '© 2026 Wings Campus - Kodungallur. All rights reserved.',
  images: {
    logo: logoSrc,
    boy: boySrc,
    offer: offerSrc,
    tab: tabSrc,
    footer: footer1Src,
    ads: [ad1Src, ad2Src, ad3Src],
  },
}

class DuplicatePhoneError extends Error {
  constructor() {
    super('PHONE_ALREADY_REGISTERED')
  }
}

const initialForm: LeadForm = {
  studentName: '',
  guardianName: '',
  phone: '',
  school: '',
  standard: '',
  place: '',
  consent: false,
}

function loadLeads(): LeadRecord[] {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) return []
  try {
    return JSON.parse(saved) as LeadRecord[]
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function saveLeads(records: LeadRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

async function mongoRequest<T>(action: string, body: Record<string, unknown>): Promise<T> {
  if (!MONGO_ENABLED) {
    throw new Error('MONGO_NOT_CONFIGURED')
  }
  const baseUrl = MONGO_DATA_API_URL.replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGO_DATA_API_KEY,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let payload: unknown = {}
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { error: text }
    }
  }
  if (!res.ok) {
    const message = typeof (payload as { error?: string })?.error === 'string' ? (payload as { error?: string }).error : res.statusText
    throw new Error(message || 'MONGO_REQUEST_FAILED')
  }
  if (typeof (payload as { error?: string })?.error === 'string') {
    throw new Error((payload as { error?: string }).error as string)
  }
  return payload as T
}

async function fetchLeadsRemote(): Promise<LeadRecord[]> {
  const result = await mongoRequest<{ documents?: Array<LeadRecord & { _id?: unknown }> }>('find', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_LEADS_COLLECTION,
    filter: {},
    sort: { submittedAt: -1 },
  })
  return (result.documents ?? []).map((doc) => {
    const { _id, ...rest } = doc
    return rest
  })
}

async function leadExistsRemote(phone: string): Promise<boolean> {
  const result = await mongoRequest<{ document?: LeadRecord }>('findOne', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_LEADS_COLLECTION,
    filter: { phone },
  })
  return Boolean(result.document)
}

async function insertLeadRemote(record: LeadRecord): Promise<void> {
  await mongoRequest('insertOne', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_LEADS_COLLECTION,
    document: record,
  })
}

async function fetchLeadsServerless(): Promise<LeadRecord[]> {
  const res = await fetch('/api/leads', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  const text = await res.text()
  let payload: unknown = {}
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { error: text }
    }
  }
  if (!res.ok) {
    const message = typeof (payload as { error?: string })?.error === 'string'
      ? (payload as { error?: string }).error
      : res.statusText
    throw new Error(message || 'LEADS_FETCH_FAILED')
  }
  const docs = (payload as { documents?: LeadRecord[] })?.documents
  return Array.isArray(docs) ? docs : []
}

async function deleteLeadServerless(id: string): Promise<void> {
  const res = await fetch(`/api/leads?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  const text = await res.text()
  let payload: unknown = {}
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { error: text }
    }
  }
  if (!res.ok) {
    const message = typeof (payload as { error?: string })?.error === 'string'
      ? (payload as { error?: string }).error
      : res.statusText
    throw new Error(message || 'LEAD_DELETE_FAILED')
  }
}

async function clearLeadsServerless(): Promise<void> {
  const res = await fetch('/api/leads', {
    method: 'DELETE',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  const text = await res.text()
  let payload: unknown = {}
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { error: text }
    }
  }
  if (!res.ok) {
    const message = typeof (payload as { error?: string })?.error === 'string'
      ? (payload as { error?: string }).error
      : res.statusText
    throw new Error(message || 'LEADS_CLEAR_FAILED')
  }
}

async function checkMongoServerlessHealth(): Promise<void> {
  const res = await fetch('/api/leads?health=1', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  const text = await res.text()
  if (/^\s*</.test(text)) {
    throw new Error('API route is not being reached. Check Vercel root directory and routing.')
  }
  let payload: MongoHealthPayload = {}
  if (text) {
    try {
      payload = JSON.parse(text) as MongoHealthPayload
    } catch {
      payload = { error: text }
    }
  }
  if (!res.ok || payload.connected !== true) {
    const message = typeof payload.error === 'string' ? payload.error : 'MongoDB connection failed.'
    throw new Error(message)
  }
}

function buildLeadApiPayload(record: LeadRecord): LeadApiPayload {
  return {
    id: record.id,
    submittedAt: record.submittedAt,
    studentName: record.studentName,
    guardianName: record.guardianName,
    phone: record.phone,
    school: record.school,
    standard: record.standard,
    place: record.place,
    consent: record.consent,
  }
}

async function insertLeadServerless(payload: LeadApiPayload): Promise<void> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let responsePayload: unknown = {}
  if (text) {
    try {
      responsePayload = JSON.parse(text)
    } catch {
      responsePayload = { error: text }
    }
  }

  if (!res.ok) {
    const message = typeof (responsePayload as { error?: string })?.error === 'string'
      ? (responsePayload as { error?: string }).error
      : res.statusText
    if (message === 'DUPLICATE_PHONE') {
      throw new DuplicatePhoneError()
    }
    throw new Error(message || 'LEAD_INSERT_FAILED')
  }

  if ((responsePayload as { success?: boolean })?.success !== true) {
    throw new Error('LEAD_INSERT_FAILED')
  }
}

async function clearLeadsRemote(): Promise<void> {
  await mongoRequest('deleteMany', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_LEADS_COLLECTION,
    filter: {},
  })
}

async function deleteLeadRemote(id: string): Promise<void> {
  await mongoRequest('deleteOne', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_LEADS_COLLECTION,
    filter: { id },
  })
}

async function fetchSiteConfigRemote(): Promise<SiteConfig | null> {
  if (!MONGO_CONFIG_ENABLED) return null
  const result = await mongoRequest<{ document?: Partial<SiteConfig> }>('findOne', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_CONFIG_COLLECTION,
    filter: { _id: SITE_CONFIG_DOC_ID },
  })
  if (!result.document) return null
  return buildSiteConfig(result.document)
}

async function saveSiteConfigRemote(config: SiteConfig): Promise<void> {
  if (!MONGO_CONFIG_ENABLED) return
  await mongoRequest('updateOne', {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DB,
    collection: MONGO_CONFIG_COLLECTION,
    filter: { _id: SITE_CONFIG_DOC_ID },
    update: { $set: { ...config, updatedAt: new Date().toISOString() } },
    upsert: true,
  })
}

function loadFakeCounter(): number {
  const saved = window.localStorage.getItem(FAKE_COUNTER_KEY)
  if (!saved) return 0
  const parsed = Number.parseInt(saved, 10)
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.min(FAKE_COUNTER_MAX, parsed))
}

function saveFakeCounter(value: number) {
  const safe = Math.max(0, Math.min(FAKE_COUNTER_MAX, value))
  window.localStorage.setItem(FAKE_COUNTER_KEY, String(safe))
}

function randomIntegerBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function loadLiveCounter(): number {
  const saved = window.localStorage.getItem(LIVE_COUNTER_KEY)
  if (saved) {
    const parsed = Number.parseInt(saved, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  const generated = randomIntegerBetween(LIVE_COUNTER_MIN, LIVE_COUNTER_MAX)
  window.localStorage.setItem(LIVE_COUNTER_KEY, String(generated))
  return generated
}

function saveLiveCounter(value: number) {
  const safe = Math.max(0, Math.round(value))
  window.localStorage.setItem(LIVE_COUNTER_KEY, String(safe))
}

function loadAdminAuth(): boolean {
  return window.localStorage.getItem(ADMIN_AUTH_KEY) === '1'
}

function saveAdminAuth(value: boolean) {
  window.localStorage.setItem(ADMIN_AUTH_KEY, value ? '1' : '0')
}

function loadCpAuth(): boolean {
  return window.localStorage.getItem(CP_AUTH_KEY) === '1'
}

function saveCpAuth(value: boolean) {
  window.localStorage.setItem(CP_AUTH_KEY, value ? '1' : '0')
}

function textOr(value: string | undefined | null, fallback: string): string {
  return value && value.trim() ? value : fallback
}

function decodeEntities(input: string): string {
  return input
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function sanitizeClassText(input: string): string {
  return input
    .replace(/classes?\s*6\s*,\s*7\s*(?:,?\s*and)?\s*8/gi, 'Classes 6 and 7')
    .replace(/class\s*6\s*,\s*7\s*&\s*8/gi, 'Class 6 & 7')
    .replace(/class\s*8/gi, 'Class 7')
    .replace(/8th\s*standard/gi, '7th Standard')
}

function buildSiteConfig(parsed: Partial<SiteConfig> = {}): SiteConfig {
  return {
    meta: {
      title: parsed.meta?.title ?? DEFAULT_SITE_CONFIG.meta.title,
      description: sanitizeClassText(parsed.meta?.description ?? DEFAULT_SITE_CONFIG.meta.description),
      keywords: parsed.meta?.keywords ?? DEFAULT_SITE_CONFIG.meta.keywords,
      ogTitle: parsed.meta?.ogTitle ?? DEFAULT_SITE_CONFIG.meta.ogTitle,
      ogDescription: sanitizeClassText(parsed.meta?.ogDescription ?? DEFAULT_SITE_CONFIG.meta.ogDescription),
      ogImage: parsed.meta?.ogImage ?? DEFAULT_SITE_CONFIG.meta.ogImage,
    },
    hero: {
      badge: parsed.hero?.badge ?? DEFAULT_SITE_CONFIG.hero.badge,
      titleMain: parsed.hero?.titleMain ?? DEFAULT_SITE_CONFIG.hero.titleMain,
      titleHighlight: parsed.hero?.titleHighlight ?? DEFAULT_SITE_CONFIG.hero.titleHighlight,
      intro1: sanitizeClassText(parsed.hero?.intro1 ?? DEFAULT_SITE_CONFIG.hero.intro1).replace(/Classes 6 and 7/gi, 'Classes 7 and 8'),
      intro2: parsed.hero?.intro2 ?? DEFAULT_SITE_CONFIG.hero.intro2,
      ctaText: parsed.hero?.ctaText ?? DEFAULT_SITE_CONFIG.hero.ctaText,
    },
    features: [
      sanitizeClassText(parsed.features?.[0] ?? DEFAULT_SITE_CONFIG.features[0]),
      sanitizeClassText(parsed.features?.[1] ?? DEFAULT_SITE_CONFIG.features[1]),
      sanitizeClassText(parsed.features?.[2] ?? DEFAULT_SITE_CONFIG.features[2]).replace(/Kodungallur Campus/gi, 'STATE & CBSE'),
      sanitizeClassText(parsed.features?.[3] ?? DEFAULT_SITE_CONFIG.features[3]).replace(/Class 6\s*&\s*7/gi, 'Class 7 & 8'),
    ],
    giveaway: {
      title: parsed.giveaway?.title ?? DEFAULT_SITE_CONFIG.giveaway.title,
      text: parsed.giveaway?.text ?? DEFAULT_SITE_CONFIG.giveaway.text,
      english: parsed.giveaway?.english ?? DEFAULT_SITE_CONFIG.giveaway.english,
    },
    campaignTitle: parsed.campaignTitle ?? DEFAULT_SITE_CONFIG.campaignTitle,
    registrationCloseDate: normalizedCloseDate || DEFAULT_SITE_CONFIG.registrationCloseDate,
    form: {
      urgencyText: parsed.form?.urgencyText ?? DEFAULT_SITE_CONFIG.form.urgencyText,
      eyebrow: parsed.form?.eyebrow ?? DEFAULT_SITE_CONFIG.form.eyebrow,
      title: parsed.form?.title ?? DEFAULT_SITE_CONFIG.form.title,
      subtitle: decodeEntities(parsed.form?.subtitle ?? DEFAULT_SITE_CONFIG.form.subtitle),
      studentLabel: parsed.form?.studentLabel ?? DEFAULT_SITE_CONFIG.form.studentLabel,
      studentPlaceholder: parsed.form?.studentPlaceholder ?? DEFAULT_SITE_CONFIG.form.studentPlaceholder,
      guardianLabel: parsed.form?.guardianLabel ?? DEFAULT_SITE_CONFIG.form.guardianLabel,
      guardianPlaceholder: parsed.form?.guardianPlaceholder ?? DEFAULT_SITE_CONFIG.form.guardianPlaceholder,
      phoneLabel: parsed.form?.phoneLabel ?? DEFAULT_SITE_CONFIG.form.phoneLabel,
      phonePlaceholder: parsed.form?.phonePlaceholder ?? DEFAULT_SITE_CONFIG.form.phonePlaceholder,
      standardLabel: parsed.form?.standardLabel ?? DEFAULT_SITE_CONFIG.form.standardLabel,
      standardPlaceholder: parsed.form?.standardPlaceholder ?? DEFAULT_SITE_CONFIG.form.standardPlaceholder,
      standardOptions: [
        sanitizeClassText(parsed.form?.standardOptions?.[0] ?? DEFAULT_SITE_CONFIG.form.standardOptions[0]),
        sanitizeClassText(parsed.form?.standardOptions?.[1] ?? DEFAULT_SITE_CONFIG.form.standardOptions[1]),
      ],
      schoolLabel: parsed.form?.schoolLabel ?? DEFAULT_SITE_CONFIG.form.schoolLabel,
      schoolPlaceholder: parsed.form?.schoolPlaceholder ?? DEFAULT_SITE_CONFIG.form.schoolPlaceholder,
      placeLabel: parsed.form?.placeLabel ?? DEFAULT_SITE_CONFIG.form.placeLabel,
      placePlaceholder: parsed.form?.placePlaceholder ?? DEFAULT_SITE_CONFIG.form.placePlaceholder,
      consentText: parsed.form?.consentText ?? DEFAULT_SITE_CONFIG.form.consentText,
      submitText: parsed.form?.submitText ?? DEFAULT_SITE_CONFIG.form.submitText,
      submittingText: parsed.form?.submittingText ?? DEFAULT_SITE_CONFIG.form.submittingText,
    },
    infoCards: [
      {
        icon: parsed.infoCards?.[0]?.icon ?? DEFAULT_SITE_CONFIG.infoCards[0].icon,
        title: parsed.infoCards?.[0]?.title ?? DEFAULT_SITE_CONFIG.infoCards[0].title,
        text: parsed.infoCards?.[0]?.text ?? DEFAULT_SITE_CONFIG.infoCards[0].text,
      },
      {
        icon: parsed.infoCards?.[1]?.icon ?? DEFAULT_SITE_CONFIG.infoCards[1].icon,
        title: parsed.infoCards?.[1]?.title ?? DEFAULT_SITE_CONFIG.infoCards[1].title,
        text: parsed.infoCards?.[1]?.text ?? DEFAULT_SITE_CONFIG.infoCards[1].text,
      },
      {
        icon: parsed.infoCards?.[2]?.icon ?? DEFAULT_SITE_CONFIG.infoCards[2].icon,
        title: parsed.infoCards?.[2]?.title ?? DEFAULT_SITE_CONFIG.infoCards[2].title,
        text: parsed.infoCards?.[2]?.text ?? DEFAULT_SITE_CONFIG.infoCards[2].text,
      },
      {
        icon: parsed.infoCards?.[3]?.icon ?? DEFAULT_SITE_CONFIG.infoCards[3].icon,
        title: parsed.infoCards?.[3]?.title ?? DEFAULT_SITE_CONFIG.infoCards[3].title,
        text: parsed.infoCards?.[3]?.text ?? DEFAULT_SITE_CONFIG.infoCards[3].text,
      },
    ],
    footerText: parsed.footerText ?? DEFAULT_SITE_CONFIG.footerText,
    images: {
      logo: parsed.images?.logo ?? DEFAULT_SITE_CONFIG.images.logo,
      boy: parsed.images?.boy ?? DEFAULT_SITE_CONFIG.images.boy,
      offer: parsed.images?.offer ?? DEFAULT_SITE_CONFIG.images.offer,
      tab: parsed.images?.tab ?? DEFAULT_SITE_CONFIG.images.tab,
      footer: parsed.images?.footer ?? DEFAULT_SITE_CONFIG.images.footer,
      ads: [
        parsed.images?.ads?.[0] ?? DEFAULT_SITE_CONFIG.images.ads[0],
        parsed.images?.ads?.[1] ?? DEFAULT_SITE_CONFIG.images.ads[1],
        parsed.images?.ads?.[2] ?? DEFAULT_SITE_CONFIG.images.ads[2],
      ],
    },
  }
}

function loadSiteConfig(): SiteConfig {
  const saved = window.localStorage.getItem(SITE_CONFIG_KEY)
  if (!saved) return DEFAULT_SITE_CONFIG
  try {
    const parsed = JSON.parse(saved) as Partial<SiteConfig>
    return buildSiteConfig(parsed)
  } catch {
    window.localStorage.removeItem(SITE_CONFIG_KEY)
    return DEFAULT_SITE_CONFIG
  }
}

function saveSiteConfig(config: SiteConfig) {
  window.localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(config))
}

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function applyMeta(config: SiteConfig) {
  document.title = textOr(config.meta.title, DEFAULT_SITE_CONFIG.meta.title)
  upsertMetaTag('name', 'description', textOr(config.meta.description, DEFAULT_SITE_CONFIG.meta.description))
  upsertMetaTag('name', 'keywords', textOr(config.meta.keywords, DEFAULT_SITE_CONFIG.meta.keywords))
  upsertMetaTag('property', 'og:title', textOr(config.meta.ogTitle, DEFAULT_SITE_CONFIG.meta.ogTitle))
  upsertMetaTag('property', 'og:description', textOr(config.meta.ogDescription, DEFAULT_SITE_CONFIG.meta.ogDescription))
  upsertMetaTag('property', 'og:image', textOr(config.meta.ogImage, DEFAULT_SITE_CONFIG.meta.ogImage))
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2)
  }
  return digits
}

function formatSubmittedAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function parseCloseDate(value: string): Date | null {
  if (!value) return null
  const parts = value.split('-').map((part) => Number.parseInt(part, 10))
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

function normalizeCloseDateValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '0001-01-01') return ''
  return trimmed
}

function isRegistrationClosed(closeDate: string): boolean {
  const parsed = parseCloseDate(closeDate)
  if (!parsed) return false
  return new Date() >= parsed
}

function exportLeadsAsExcel(records: LeadRecord[]) {
  if (!records.length) return false

  const header = ['ID', 'Student Name', 'Guardian Name', 'Phone', 'School', 'Standard', 'Place', 'Consent', 'Submitted At']
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const rows = records.map((r) => [r.id, r.studentName, r.guardianName, r.phone, r.school, r.standard, r.place, r.consent ? 'Yes' : 'No', formatSubmittedAt(r.submittedAt)])

  let xml = '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n'
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
  xml += '<Worksheet ss:Name="Student Leads"><Table>\n'
  xml += '<Row>' + header.map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('') + '</Row>\n'
  for (const row of rows) {
    xml += '<Row>' + row.map((c) => `<Cell><Data ss:Type="String">${esc(String(c))}</Data></Cell>`).join('') + '</Row>\n'
  }
  xml += '</Table></Worksheet></Workbook>'

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'student-leads.xls'
  a.click()
  URL.revokeObjectURL(url)
  return true
}

function AlertPopup({
  onSubmitLead,
  config,
  onClose,
}: {
  onSubmitLead: (form: LeadForm) => Promise<void>
  config: SiteConfig
  onClose: () => void
}) {
  const [form, setForm] = useState<LeadForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState<'' | 'success' | 'error'>('')
  const registrationClosed = isRegistrationClosed(config.registrationCloseDate)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false
    if (type !== 'checkbox' && name === 'phone') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10)
      setForm((cur) => ({ ...cur, phone: sanitized }))
      return
    }
    setForm((cur) => ({ ...cur, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (registrationClosed) {
      setStatusMsg('Registrations are closed.')
      setStatusType('error')
      return
    }
    setSubmitting(true)
    setStatusMsg('')
    setStatusType('')
    try {
      await onSubmitLead(form)
      setForm(initialForm)
      setStatusMsg('Details submitted successfully')
      setStatusType('success')
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      if (err instanceof DuplicatePhoneError) {
        setStatusMsg('This phone number is already registered.')
      } else if (err instanceof Error && err.message === 'INVALID_PHONE') {
        setStatusMsg('Enter a valid 10-digit phone number.')
      } else {
        setStatusMsg('Submission failed. Please try again.')
      }
      setStatusType('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="alert-popup-overlay animate-in" role="dialog" aria-modal="true">
      <div className="alert-popup-card">
        <button className="alert-popup-close" onClick={onClose} aria-label="Close">×</button>
        <div className="alert-popup-split">
          <div className="alert-img-wrap">
            <img src="/alert.png" alt="Important Alert" className="alert-img" />
            <img src="/gift.png" alt="Special Gift" className="alert-overlay-img" />
          </div>
          <div className="alert-popup-body">
            <p className="form-subtitle" style={{ marginBottom: '0.75rem', fontSize: '0.85rem', textAlign: 'center' }}>{config.form.subtitle}</p>
            <form className="lead-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onSubmit={handleSubmit}>
              <div className="form-row" style={{ gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input id="popupStudentName" name="studentName" value={form.studentName} onChange={handleChange} placeholder={config.form.studentLabel.split(' /')[0]} disabled={submitting || registrationClosed} required className="form-input" style={{ padding: '0.6rem 0.8rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input id="popupGuardianName" name="guardianName" value={form.guardianName} onChange={handleChange} placeholder={config.form.guardianLabel.split(' /')[0]} disabled={submitting || registrationClosed} required className="form-input" style={{ padding: '0.6rem 0.8rem' }} />
                </div>
              </div>
              <div className="form-row" style={{ gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input id="popupPhone" name="phone" value={form.phone} onChange={handleChange} placeholder={config.form.phoneLabel.split(' /')[0]} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} disabled={submitting || registrationClosed} required className="form-input" style={{ padding: '0.6rem 0.8rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select id="popupStandard" name="standard" value={form.standard} onChange={handleChange} disabled={submitting || registrationClosed} required className="form-select" style={{ padding: '0.6rem 0.8rem' }}>
                    <option value="">{config.form.standardLabel.split(' /')[0]}</option>
                    {config.form.standardOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input id="popupSchool" name="school" value={form.school} onChange={handleChange} placeholder={config.form.schoolLabel.split(' /')[0]} disabled={submitting || registrationClosed} required className="form-input" style={{ padding: '0.6rem 0.8rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input id="popupPlace" name="place" value={form.place} onChange={handleChange} placeholder={config.form.placeLabel.split(' /')[0]} disabled={submitting || registrationClosed} required className="form-input" style={{ padding: '0.6rem 0.8rem' }} />
                </div>
              </div>
              <div className="consent-row" style={{ margin: '0.2rem 0', gap: '0.4rem', alignItems: 'flex-start' }}>
                <input id="popupConsent" name="consent" type="checkbox" checked={form.consent} onChange={handleChange} disabled={submitting || registrationClosed} required style={{ marginTop: '0.2rem' }} />
                <span style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>{config.form.consentText}</span>
              </div>

              <button className="submit-btn alert-submit-btn" style={{ padding: '0.7rem' }} type="submit" disabled={submitting || registrationClosed}>
                {submitting ? config.form.submittingText : config.form.submitText}
              </button>

              {statusMsg && (
                <p className={`form-status ${statusType}`} role="status" style={{ margin: 0, padding: '0.5rem' }}>{statusMsg}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function normalizeLoginUserId(value: string) {
  return value.trim().toLowerCase()
}

function App() {
  const [leads, setLeads] = useState<LeadRecord[]>(() => (LOCAL_FALLBACK_ENABLED ? loadLeads() : []))
  const [giveawayCounter, setGiveawayCounter] = useState<number>(() => loadFakeCounter())
  const [liveCounter, setLiveCounter] = useState<number>(() => loadLiveCounter())
  const [booting, setBooting] = useState(true)
  const [showPopup, setShowPopup] = useState(() => !window.sessionStorage.getItem('wingscampus-alert-seen'))
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(() => loadAdminAuth())
  const [isCpAuthed, setIsCpAuthed] = useState<boolean>(() => loadCpAuth())
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadSiteConfig())
  const [remoteConfigReady, setRemoteConfigReady] = useState(!MONGO_CONFIG_ENABLED)

  useEffect(() => {
    if (!LOCAL_FALLBACK_ENABLED) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])
  useEffect(() => { saveAdminAuth(isAdminAuthed) }, [isAdminAuthed])
  useEffect(() => { saveCpAuth(isCpAuthed) }, [isCpAuthed])
  useEffect(() => { saveFakeCounter(giveawayCounter) }, [giveawayCounter])
  useEffect(() => { saveLiveCounter(liveCounter) }, [liveCounter])
  useEffect(() => { saveSiteConfig(siteConfig); applyMeta(siteConfig) }, [siteConfig])
  useEffect(() => {
    if (!MONGO_CONFIG_ENABLED) return
    let active = true
    fetchSiteConfigRemote()
      .then((remote) => {
        if (!active) return
        if (remote) {
          setSiteConfig(remote)
        } else {
          saveSiteConfigRemote(loadSiteConfig()).catch(() => { })
        }
        setRemoteConfigReady(true)
      })
      .catch(() => {
        if (active) {
          setRemoteConfigReady(true)
        }
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!MONGO_CONFIG_ENABLED || !remoteConfigReady) return
    const handle = window.setTimeout(() => {
      saveSiteConfigRemote(siteConfig).catch(() => { })
    }, 700)
    return () => window.clearTimeout(handle)
  }, [siteConfig, remoteConfigReady])

  const refreshLeads = useCallback(async () => {
    if (!MONGO_ENABLED && LOCAL_FALLBACK_ENABLED) {
      const records = loadLeads()
      setLeads(records)
      return records
    }

    try {
      const records = await fetchLeadsServerless()
      setLeads(records)
      if (LOCAL_FALLBACK_ENABLED) {
        saveLeads(records)
      }
      return records
    } catch {
      if (!MONGO_ENABLED) {
        if (LOCAL_FALLBACK_ENABLED) {
          saveLeads([])
        }
        setLeads([])
        return []
      }
    }

    try {
      const records = await fetchLeadsRemote()
      setLeads(records)
      if (LOCAL_FALLBACK_ENABLED) {
        saveLeads(records)
      }
      return records
    } catch {
      if (LOCAL_FALLBACK_ENABLED) {
        saveLeads([])
      }
      setLeads([])
      return []
    }
  }, [])

  const persistLeadRecord = useCallback((record: LeadRecord) => {
    setLeads((current) => {
      const next = [record, ...current]
      if (LOCAL_FALLBACK_ENABLED) {
        saveLeads(next)
      }
      return next
    })
    setGiveawayCounter((current) => Math.min(FAKE_COUNTER_MAX, current + 1))
    setLiveCounter((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!isAdminAuthed) return
    void refreshLeads()
  }, [isAdminAuthed, refreshLeads])
  useEffect(() => {
    const t = window.setTimeout(() => setBooting(false), 950)
    return () => window.clearTimeout(t)
  }, [])

  const handleLeadSubmit = async (form: LeadForm) => {
    const normalizedPhone = normalizePhone(form.phone)
    if (!/^\d{10}$/.test(normalizedPhone)) {
      throw new Error('INVALID_PHONE')
    }
    if (MONGO_ENABLED) {
      const exists = await leadExistsRemote(normalizedPhone)
      if (exists) {
        throw new DuplicatePhoneError()
      }
    } else if (leads.some((lead) => normalizePhone(lead.phone) === normalizedPhone)) {
      throw new DuplicatePhoneError()
    }

    const record: LeadRecord = {
      ...form,
      phone: normalizedPhone,
      id: `WC-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    }
    try {
      await insertLeadServerless(buildLeadApiPayload(record))
    } catch (error) {
      if (MONGO_ENABLED) {
        await insertLeadRemote(record)
      } else {
        if (!LOCAL_FALLBACK_ENABLED) {
          throw error
        }
      }
    }
    persistLeadRecord(record)
  }

  const handleAdminLogin = (userId: string, password: string) => {
    if (normalizeLoginUserId(userId) === normalizeLoginUserId(ADMIN_USER_ID) && password === ADMIN_PASSWORD) {
      setIsAdminAuthed(true)
      return true
    }
    return false
  }

  const handleAdminLogout = () => {
    setIsAdminAuthed(false)
  }

  const handleCpLogin = (userId: string, password: string) => {
    if (userId === CP_USER_ID && password === CP_PASSWORD) {
      setIsCpAuthed(true)
      return true
    }
    return false
  }

  const handleCpLogout = () => {
    setIsCpAuthed(false)
  }

  return (
    <BrowserRouter>
      {showPopup && !booting && (
        <AlertPopup
          onSubmitLead={handleLeadSubmit}
          config={siteConfig}
          onClose={() => {
            setShowPopup(false)
            window.sessionStorage.setItem('wingscampus-alert-seen', '1')
          }}
        />
      )}
      {booting && (
        <div className="app-loader" role="status" aria-live="polite" aria-label="Loading">
          <div className="loader-orb" />
          <p>Loading Wings Campus...</p>
        </div>
      )}
      <div className="bg-decor" aria-hidden="true">
        <div className="bg-shape bg-shape-1" />
        <div className="bg-shape bg-shape-2" />
        <div className="bg-shape bg-shape-3" />
      </div>

      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/students" replace />} />
          <Route
            path="/students"
            element={
              <StudentsPage
                onSubmitLead={handleLeadSubmit}
                giveawayCounter={giveawayCounter}
                liveCounter={liveCounter}
                config={siteConfig}
              />
            }
          />
          <Route
            path="/admin-login"
            element={<AdminLoginPage isAdminAuthed={isAdminAuthed} onLogin={handleAdminLogin} />}
          />
          <Route
            path="/admin"
            element={
              isAdminAuthed
                ? <AdminPage leads={leads} setLeads={setLeads} onRefreshLeads={refreshLeads} onLogout={handleAdminLogout} config={siteConfig} setConfig={setSiteConfig} />
                : <Navigate to="/admin-login" replace />
            }
          />
          <Route path="/cp-login" element={<ControlPanelLoginPage isCpAuthed={isCpAuthed} onLogin={handleCpLogin} />} />
          <Route
            path="/cp"
            element={
              isCpAuthed
                ? <ControlPanelPage config={siteConfig} setConfig={setSiteConfig} onLogout={handleCpLogout} />
                : <Navigate to="/cp-login" replace />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function AdminLoginPage({
  isAdminAuthed,
  onLogin,
}: {
  isAdminAuthed: boolean
  onLogin: (userId: string, password: string) => boolean
}) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const adminCredentialsConfigured = Boolean(ADMIN_USER_ID && ADMIN_PASSWORD)
  const [mongoStatus, setMongoStatus] = useState<{
    tone: 'checking' | 'success' | 'error'
    message: string
  }>({
    tone: adminCredentialsConfigured ? 'checking' : 'error',
    message: adminCredentialsConfigured
      ? 'Checking MongoDB connection...'
      : 'Admin credentials are missing in this deployment. Add VITE_ADMIN_USER_ID and VITE_ADMIN_PASSWORD in Vercel, then redeploy.',
  })

  useEffect(() => {
    if (!adminCredentialsConfigured) return

    let active = true
    setMongoStatus({ tone: 'checking', message: 'Checking MongoDB connection...' })

    checkMongoServerlessHealth()
      .then(() => {
        if (!active) return
        setMongoStatus({ tone: 'success', message: 'MongoDB connection is working.' })
      })
      .catch((err) => {
        if (!active) return
        const message = err instanceof Error && err.message
          ? err.message
          : 'MongoDB connection failed.'
        setMongoStatus({ tone: 'error', message })
      })

    return () => {
      active = false
    }
  }, [adminCredentialsConfigured])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!adminCredentialsConfigured) {
      setError('Admin credentials are not loaded in this deployment. Save the Vercel env vars and redeploy.')
      return
    }
    const ok = onLogin(userId.trim(), password)
    if (!ok) setError('Invalid user ID or password. Password is exact, and the User ID from Vercel is now matched without case sensitivity.')
  }

  if (isAdminAuthed) {
    return <Navigate to="/admin" replace />
  }

  return (
    <main className="page-shell admin-page">
      <section className="admin-login-shell animate-in">
        <div className="form-card admin-login-card">
          <p className="form-eyebrow">Admin Access</p>
          <h1 className="form-title">Sign in to Admin Dashboard</h1>
          <p className="form-subtitle">Use your fixed admin credentials to continue.</p>
          <div className={`admin-login-alert ${mongoStatus.tone}`} role="status" aria-live="polite">
            <p>
              <strong>Admin credentials:</strong> {adminCredentialsConfigured ? 'Loaded from deployment' : 'Missing in deployment'}
            </p>
            <p>
              <strong>MongoDB:</strong> {mongoStatus.message}
            </p>
          </div>

          <form className="lead-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="adminUserId">User ID</label>
              <input
                id="adminUserId"
                className="form-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="adminPassword">Password</label>
              <input
                id="adminPassword"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="submit-btn" type="submit">Login</button>
            {error && <p className="form-status error" role="alert">{error}</p>}
          </form>
        </div>
      </section>
    </main>
  )
}

function AdCarousel({ ads, title }: { ads: [string, string, string], title: string }) {
  const adImages = [
    { src: ads[0], alt: 'Wings Campus Ad 1 - NEET/JEE Foundation' },
    { src: ads[1], alt: 'Wings Campus Ad 2 - Expert Coaching' },
    { src: ads[2], alt: 'Wings Campus Ad 3 - Enroll Now' },
  ]
  const [slide, setSlide] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const go = useCallback((i: number) => setSlide((i + 3) % 3), [])

  useEffect(() => {
    timer.current = setInterval(() => setSlide((s) => (s + 1) % 3), 4000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  return (
    <section className="ad-section animate-in animate-in-delay-2" id="ad-section">
      <h2 className="ad-section-title">{title}</h2>

      <div className="ad-carousel">
        <button className="ad-carousel-nav prev" onClick={() => go(slide - 1)} aria-label="Previous">‹</button>
        <button className="ad-carousel-nav next" onClick={() => go(slide + 1)} aria-label="Next">›</button>
        <div className="ad-carousel-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {adImages.map((ad, i) => (
            <div className="ad-carousel-slide" key={i}>
              <SmoothImage src={ad.src} fallbackSrc={DEFAULT_SITE_CONFIG.images.ads[i]} alt={ad.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
      <div className="ad-carousel-dots">
        {adImages.map((_, i) => (
          <button key={i} className={`ad-dot${i === slide ? ' active' : ''}`} onClick={() => go(i)} aria-label={`Ad ${i + 1}`} />
        ))}
      </div>

      <div className="ad-grid">
        {adImages.map((ad, i) => (
          <div className="ad-grid-item" key={i}>
            <SmoothImage src={ad.src} fallbackSrc={DEFAULT_SITE_CONFIG.images.ads[i]} alt={ad.alt} loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  )
}

function SmoothImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  loading = 'eager',
}: {
  src: string
  fallbackSrc: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
}) {
  const [currentSrc, setCurrentSrc] = useState(textOr(src, fallbackSrc))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setCurrentSrc(textOr(src, fallbackSrc))
    setLoaded(false)
  }, [src, fallbackSrc])

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`${className} smooth-image ${loaded ? 'is-loaded' : 'is-loading'}`.trim()}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
          return
        }
        setLoaded(true)
      }}
    />
  )
}

function GiveawayBanner({
  spotsLeft,
  liveCounter,
  config,
}: {
  spotsLeft: number
  liveCounter: number
  config: SiteConfig
}) {
  const filled = Math.min(GIVEAWAY_LIMIT, GIVEAWAY_LIMIT - spotsLeft)
  const pct = Math.round((filled / GIVEAWAY_LIMIT) * 100)

  return (
    <div className="giveaway-banner animate-in">
      <SmoothImage src={config.images.tab} fallbackSrc={DEFAULT_SITE_CONFIG.images.tab} alt="Tablet prize" className="giveaway-icon-img" />
      <div className="giveaway-content">
        <h2 className="giveaway-title">{textOr(config.giveaway.title, DEFAULT_SITE_CONFIG.giveaway.title)}</h2>
        <p className="giveaway-text" style={{ display: 'none' }}>
          ആദ്യത്തെ <strong>100 രജിസ്ട്രേഷനുകളിൽ</strong> നിന്ന് ഒരു <strong>Lucky Winner</strong> ന് ഒരു <strong>Tablet</strong>.
        </p>
        <p className="giveaway-text">{textOr(config.giveaway.text, DEFAULT_SITE_CONFIG.giveaway.text)}</p>
        <p className="giveaway-english">
          {textOr(config.giveaway.english, DEFAULT_SITE_CONFIG.giveaway.english)}
        </p>
        <div className="giveaway-live-pill" aria-live="polite">
          <span className="giveaway-live-dot" aria-hidden="true" />
          <strong>{liveCounter}</strong> people are online right now
        </div>
        <div className="giveaway-progress">
          <div className="giveaway-bar">
            <div className="giveaway-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="giveaway-counter">
            <strong>{spotsLeft}</strong> spots left out of {GIVEAWAY_LIMIT}
          </span>
        </div>
      </div>
    </div>
  )
}

function StudentsPage({
  onSubmitLead,
  giveawayCounter,
  liveCounter,
  config,
}: {
  onSubmitLead: (form: LeadForm) => Promise<void>
  giveawayCounter: number
  liveCounter: number
  config: SiteConfig
}) {
  const [form, setForm] = useState<LeadForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState<'' | 'success' | 'error'>('')
  const [showSyllabus, setShowSyllabus] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const spotsLeft = Math.max(1, GIVEAWAY_LIMIT - giveawayCounter)
  const urgencyText = config.form.urgencyText.replace('{spotsLeft}', String(spotsLeft))
  const registrationClosed = isRegistrationClosed(config.registrationCloseDate)
  const isFormComplete = Boolean(
    form.studentName.trim()
    && form.guardianName.trim()
    && /^\d{10}$/.test(form.phone.trim())
    && form.school.trim()
    && form.standard.trim()
    && form.place.trim()
    && form.consent
  )

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false
    if (type !== 'checkbox' && name === 'phone') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10)
      setForm((cur) => ({ ...cur, phone: sanitized }))
      return
    }
    setForm((cur) => ({ ...cur, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (registrationClosed) {
      setStatusMsg('Registrations are closed.')
      setStatusType('error')
      return
    }
    setSubmitting(true)
    setStatusMsg('')
    setStatusType('')
    try {
      await onSubmitLead(form)
      setForm(initialForm)
      setStatusMsg('Details submitted successfully')
      setStatusType('success')
    } catch (err) {
      if (err instanceof DuplicatePhoneError) {
        setStatusMsg('This phone number is already registered.')
      } else if (err instanceof Error && err.message === 'INVALID_PHONE') {
        setStatusMsg('Enter a valid 10-digit phone number.')
      } else if (err instanceof Error && import.meta.env.DEV && err.message) {
        setStatusMsg(`Submission failed: ${err.message}`)
      } else {
        setStatusMsg('Submission failed. Please try again.')
      }
      setStatusType('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-shell cp-page">
      <section className="hero-section hero-breakout animate-in" id="hero">
        <SmoothImage src={config.images.offer} fallbackSrc={DEFAULT_SITE_CONFIG.images.offer} alt="Special offer" className="hero-offer" />
        <div className="top-marquee" aria-label="Admission notice">
          <div className="top-marquee-track">
            <span>✨ നിലവിൽ 6,7 ക്ലാസ്സുകളിൽ പഠിക്കുന്ന കുട്ടികൾക്ക് ഈ പരീക്ഷയിലേക്ക് രജിസ്റ്റർ ചെയ്യാവുന്നതാണ്....</span>
            <span>✨ നിലവിൽ 6,7 ക്ലാസ്സുകളിൽ പഠിക്കുന്ന കുട്ടികൾക്ക് ഈ പരീക്ഷയിലേക്ക് രജിസ്റ്റർ ചെയ്യാവുന്നതാണ്....</span>
          </div>
        </div>
        <div className="hero-content">
          <div className="hero-layout">
            <div className="hero-main">
              <SmoothImage src={config.images.logo} fallbackSrc={DEFAULT_SITE_CONFIG.images.logo} alt="Wings Campus logo" className="hero-logo" />
              <h1 className="hero-title" style={{ marginBottom: '0.5rem' }}>
                {textOr(config.hero.titleMain, DEFAULT_SITE_CONFIG.hero.titleMain)} {textOr(config.hero.titleHighlight, DEFAULT_SITE_CONFIG.hero.titleHighlight)}
              </h1>
              <p className="hero-subtitle">
                {textOr(config.hero.intro1, DEFAULT_SITE_CONFIG.hero.intro1)}
              </p>
              <p className="hero-malayalam">
                നിങ്ങൾ 6, 7 ക്ലാസ്സുകളിൽ പഠിക്കുന്ന മിടുക്കരാണോ? , എങ്കിൽ വിങ്സ് ക്യാമ്പസ് ഒരുക്കുന്ന ഈ ബൃഹത്തായ മത്സരപരീക്ഷയിൽ പങ്കുചേരൂ. ആകർഷകമായ ക്യാഷ് പ്രൈസുകളും (Cash Prize) സ്കോളർഷിപ്പിുകളും നിങ്ങളെ കാത്തിരിക്കുന്നു.
              </p>
              <div className="hero-exam-center">
                <span className="hero-exam-icon">📍</span>
                <span><strong>Exam Center:</strong> Wings Academy, KK Tower, Kodungallur</span>
              </div>
              <div className="hero-actions">
                <button className="hero-syllabus-btn" type="button" onClick={() => setShowSyllabus(true)}>
                  📖 View Syllabus
                </button>
                <button className="hero-cta" type="button" onClick={scrollToForm}>
                  📝 {textOr(config.hero.ctaText, DEFAULT_SITE_CONFIG.hero.ctaText)}
                </button>
              </div>
            </div>
            <div className="hero-boy-wrap">
              <SmoothImage src={config.images.boy} fallbackSrc={DEFAULT_SITE_CONFIG.images.boy} alt="Student" className="hero-boy" />
            </div>
          </div>
        </div>
      </section>

      {showSyllabus && createPortal(
        <div className="syllabus-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowSyllabus(false) }}>
          <div className="syllabus-modal">
            <div className="syllabus-header">
              <h2 className="syllabus-title">📋 Syllabus for Wings Olympiad</h2>
              <button className="syllabus-close" onClick={() => setShowSyllabus(false)} aria-label="Close">&times;</button>
            </div>
            <a className="syllabus-download-btn" href="/syllabus.pdf" download="Wings_Olympiad_Syllabus.pdf">
              📥 Download Syllabus as PDF
            </a>
            <div className="syllabus-body">

              <div className="syllabus-section">
                <h3 className="syllabus-section-title">I. Life Sciences (Biology)</h3>
                <div className="syllabus-topic">
                  <h4>🔬 Cell Biology (Caskets of Life)</h4>
                  <ul>
                    <li>Identifying parts of a cell (nucleus, cytoplasm, cell wall)</li>
                    <li>Distinguishing between plant and animal cells</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🌸 Plant Reproduction (Flower to Flower)</h4>
                  <ul>
                    <li>Parts of a flower (thalamus, calyx, corolla, androecium, gynoecium) and their functions</li>
                    <li>Process of pollination (self and cross-pollination) and fertilization</li>
                    <li>Classification of fruits: simple, aggregate, multiple, and false fruits</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🥗 Health and Nutrition (Food for Health)</h4>
                  <ul>
                    <li>Nutrients in food (carbohydrates, proteins, fats, vitamins, minerals)</li>
                    <li>Their importance and identifying deficiency diseases</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🦴 Human Anatomy (For Shape and Strength)</h4>
                  <ul>
                    <li>The human skeletal system, functions of bones</li>
                    <li>Types of joints (e.g., hinge joints)</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🌍 Environmental Health (For a Pollution Free Nature)</h4>
                  <ul>
                    <li>Causes and effects of air, water, and soil pollution</li>
                  </ul>
                </div>
              </div>

              <div className="syllabus-section">
                <h3 className="syllabus-section-title">II. Physical Sciences (Physics &amp; Chemistry)</h3>
                <div className="syllabus-topic">
                  <h4>⚡ Energy and its Changes (The Essence of Change)</h4>
                  <ul>
                    <li>Forms of energy (electrical, light, heat) and energy conversions in daily life</li>
                    <li>Fossil fuels (LPG, coal) and their dependence on solar energy</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🧊 Matter and States of Change</h4>
                  <ul>
                    <li>Physical vs. chemical changes (permanent vs. temporary)</li>
                    <li>Change of state (melting, evaporation, condensation) due to heat absorption or release</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🚀 Motion and Force (Along with Motion)</h4>
                  <ul>
                    <li>Types of motion (rotation, revolution, linear, circular)</li>
                    <li>Force&apos;s role in changing a body&apos;s state of rest or direction</li>
                    <li>Speed and velocity concepts</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>💡 Electricity and Circuits</h4>
                  <ul>
                    <li>Function of an Electric Cell</li>
                    <li>Identifying closed vs. open circuits</li>
                    <li>Distinguishing between Conductors and Insulators</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🧲 Magnetism (Attraction and Repulsion)</h4>
                  <ul>
                    <li>Properties of magnets, magnetic poles, and the concept of a magnetic field</li>
                    <li>Classifying magnetic and non-magnetic substances</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>🧪 Chemistry of Mixtures (Mix and Separate)</h4>
                  <ul>
                    <li>Methods for separating mixtures</li>
                    <li>Understanding pure substances versus mixtures</li>
                  </ul>
                </div>
              </div>

              <div className="syllabus-section">
                <h3 className="syllabus-section-title">III. General Aptitude</h3>
                <div className="syllabus-topic">
                  <h4>🧠 Logical &amp; Abstract Reasoning</h4>
                  <ul>
                    <li><strong>Series Completion:</strong> Finding the next item in a sequence (e.g., 1, 4, 9, 16, _?)</li>
                    <li><strong>Coding-Decoding:</strong> If &quot;APPLE&quot; is written as &quot;BQQMF,&quot; how is &quot;MANGO&quot; written?</li>
                    <li><strong>Blood Relations:</strong> &quot;The man in the photo is my mother&apos;s only son. Who is he?&quot;</li>
                    <li><strong>Mirror &amp; Water Images:</strong> Visualizing how a shape or word looks when reflected</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>📐 Quantitative &amp; Arithmetical Aptitude</h4>
                  <ul>
                    <li><strong>Clocks &amp; Calendars:</strong> Calculating the angle between clock hands or finding the day of the week</li>
                    <li><strong>Direction Sense:</strong> A person walks 5km North, turns right, walks 3km... where are they now?</li>
                  </ul>
                </div>
                <div className="syllabus-topic">
                  <h4>💬 Verbal Aptitude (Critical Thinking)</h4>
                  <ul>
                    <li><strong>Analogies:</strong> Identifying relationships (e.g., Doctor : Medicine :: Postman : ________?)</li>
                    <li><strong>Odd One Out:</strong> Finding the intruder in a group (e.g., Nitrogen, Oxygen, CO₂, Water → Water is a liquid at room temperature)</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      <section className="form-hero-section animate-in animate-in-delay-1" id="register" ref={formRef}>
        <GiveawayBanner spotsLeft={spotsLeft} liveCounter={liveCounter} config={config} />

        <div className="form-card form-card-hero">
          <div className="form-header">
            <div className="form-urgency-badge">
              {urgencyText}
            </div>
            <h2 className="form-eyebrow">{config.form.eyebrow}</h2>
            <p className="form-subtitle">
              {config.form.subtitle}
            </p>
          </div>

          <form className="lead-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="studentName">{config.form.studentLabel}</label>
              <input id="studentName" className="form-input" name="studentName" value={form.studentName} onChange={handleChange}
                placeholder={config.form.studentPlaceholder} disabled={submitting || registrationClosed} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="guardianName">{config.form.guardianLabel}</label>
              <input id="guardianName" className="form-input" name="guardianName" value={form.guardianName} onChange={handleChange}
                placeholder={config.form.guardianPlaceholder} disabled={submitting || registrationClosed} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">{config.form.phoneLabel}</label>
                <input id="phone" className="form-input" name="phone" value={form.phone} onChange={handleChange}
                  placeholder={config.form.phonePlaceholder} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} disabled={submitting || registrationClosed} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="standard">{config.form.standardLabel}</label>
                <select id="standard" className="form-select" name="standard" value={form.standard} onChange={handleChange} disabled={submitting || registrationClosed} required>
                  <option value="">{config.form.standardPlaceholder}</option>
                  {config.form.standardOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="school">{config.form.schoolLabel}</label>
              <input id="school" className="form-input" name="school" value={form.school} onChange={handleChange}
                placeholder={config.form.schoolPlaceholder} disabled={submitting || registrationClosed} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="place">{config.form.placeLabel}</label>
              <input id="place" className="form-input" name="place" value={form.place} onChange={handleChange}
                placeholder={config.form.placePlaceholder} disabled={submitting || registrationClosed} required />
            </div>

            <div className="consent-row">
              <input id="consent" name="consent" type="checkbox" checked={form.consent} onChange={handleChange} disabled={submitting || registrationClosed} required />
              <span>
                {config.form.consentText}
              </span>
            </div>

            <button className="submit-btn" type="submit" disabled={submitting || registrationClosed}>
              {submitting ? config.form.submittingText : config.form.submitText}
            </button>

            {registrationClosed && (
              <p className="form-status error" role="status">Registrations are closed for this campaign.</p>
            )}

            {statusMsg && !registrationClosed && (
              <p className={`form-status ${statusType}`} role="status">{statusMsg}</p>
            )}
          </form>
        </div>

        <div className="info-sidebar">
          <div className="info-box giveaway-highlight animate-in animate-in-delay-2">
            <div className="info-box-icon">{config.infoCards[0].icon}</div>
            <div className="info-box-content">
              <h3>{config.infoCards[0].title}</h3>
              <p>{config.infoCards[0].text}</p>
            </div>
          </div>
          <div className="info-box animate-in animate-in-delay-3">
            <div className="info-box-icon">{config.infoCards[1].icon}</div>
            <div className="info-box-content">
              <h3>{config.infoCards[1].title}</h3>
              <p>{config.infoCards[1].text}</p>
            </div>
          </div>
          <div className="info-box animate-in animate-in-delay-4">
            <div className="info-box-icon">{config.infoCards[2].icon}</div>
            <div className="info-box-content">
              <h3>{config.infoCards[2].title}</h3>
              <p>{config.infoCards[2].text}</p>
            </div>
          </div>
          <div className="info-box animate-in animate-in-delay-4">
            <div className="info-box-icon">{config.infoCards[3].icon}</div>
            <div className="info-box-content">
              <h3>{config.infoCards[3].title}</h3>
              <p>{config.infoCards[3].text}</p>
            </div>
          </div>
        </div>
      </section>

      <AdCarousel ads={config.images.ads} title={config.campaignTitle} />

      <footer className="page-footer students-footer">
        <p>{textOr(config.footerText, DEFAULT_SITE_CONFIG.footerText)}</p>
      </footer>
    </main>
  )
}

function ControlPanelLoginPage({
  isCpAuthed,
  onLogin,
}: {
  isCpAuthed: boolean
  onLogin: (userId: string, password: string) => boolean
}) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const ok = onLogin(userId.trim(), password)
    if (!ok) setError('Invalid user ID or password.')
  }

  if (isCpAuthed) {
    return <Navigate to="/cp" replace />
  }

  return (
    <main className="page-shell cp-page">
      <section className="admin-login-shell animate-in">
        <div className="form-card admin-login-card">
          <p className="form-eyebrow">Control Panel</p>
          <h1 className="form-title">Sign in to C Panel</h1>
          <p className="form-subtitle">Manage content, images, and meta tags without touching code.</p>
          <form className="lead-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="cpUserId">User ID</label>
              <input id="cpUserId" className="form-input" value={userId} onChange={(e) => setUserId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cpPassword">Password</label>
              <input id="cpPassword" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="submit-btn" type="submit">Login</button>
            {error && <p className="form-status error" role="alert">{error}</p>}
          </form>
        </div>
      </section>
    </main>
  )
}

function ControlPanelPage({
  config,
  setConfig,
  onLogout,
}: {
  config: SiteConfig
  setConfig: React.Dispatch<React.SetStateAction<SiteConfig>>
  onLogout: () => void
}) {
  const [status, setStatus] = useState('All updates are auto-saved.')

  const updateMeta = (key: keyof SiteConfig['meta'], value: string) => {
    setConfig((cur) => ({ ...cur, meta: { ...cur.meta, [key]: value } }))
    setStatus('Updated and saved.')
  }

  const updateHero = (key: keyof SiteConfig['hero'], value: string) => {
    setConfig((cur) => ({ ...cur, hero: { ...cur.hero, [key]: value } }))
    setStatus('Updated and saved.')
  }

  const updateGiveaway = (key: keyof SiteConfig['giveaway'], value: string) => {
    setConfig((cur) => ({ ...cur, giveaway: { ...cur.giveaway, [key]: value } }))
    setStatus('Updated and saved.')
  }

  const updateFeature = (index: 0 | 1 | 2 | 3, value: string) => {
    setConfig((cur) => {
      const features: [string, string, string, string] = [...cur.features] as [string, string, string, string]
      features[index] = value
      return { ...cur, features }
    })
    setStatus('Updated and saved.')
  }

  const updateForm = (key: Exclude<keyof SiteConfig['form'], 'standardOptions'>, value: string) => {
    setConfig((cur) => ({ ...cur, form: { ...cur.form, [key]: value } }))
    setStatus('Updated and saved.')
  }

  const updateCloseDate = (value: string) => {
    const normalized = normalizeCloseDateValue(value)
    setConfig((cur) => ({ ...cur, registrationCloseDate: normalized }))
    setStatus('Updated and saved.')
  }

  const updateFormOption = (index: 0 | 1, value: string) => {
    setConfig((cur) => {
      const standardOptions: [string, string] = [...cur.form.standardOptions] as [string, string]
      standardOptions[index] = value
      return { ...cur, form: { ...cur.form, standardOptions } }
    })
    setStatus('Updated and saved.')
  }

  const updateInfoCard = (index: 0 | 1 | 2 | 3, key: 'icon' | 'title' | 'text', value: string) => {
    setConfig((cur) => {
      const infoCards = [...cur.infoCards] as SiteConfig['infoCards']
      infoCards[index] = { ...infoCards[index], [key]: value }
      return { ...cur, infoCards }
    })
    setStatus('Updated and saved.')
  }

  const updateImage = (key: keyof Omit<SiteConfig['images'], 'ads'>, value: string) => {
    setConfig((cur) => ({ ...cur, images: { ...cur.images, [key]: value } }))
    setStatus('Updated and saved.')
  }

  const updateAdImage = (index: 0 | 1 | 2, value: string) => {
    setConfig((cur) => {
      const ads: [string, string, string] = [...cur.images.ads] as [string, string, string]
      ads[index] = value
      return { ...cur, images: { ...cur.images, ads } }
    })
    setStatus('Updated and saved.')
  }

  const resetDefaults = () => {
    if (!window.confirm('Reset all content, images, and meta tags to defaults?')) return
    setConfig(DEFAULT_SITE_CONFIG)
    setStatus('Reset to defaults.')
  }

  return (
    <main className="page-shell cp-page">
      <section className="admin-hero animate-in">
        <p className="form-eyebrow">C Panel</p>
        <h1>Website Content Control Panel</h1>
        <p>Edit text, image URLs, and meta tags instantly.</p>
      </section>

      <section className="cp-toolbar animate-in animate-in-delay-1">
        <button className="btn-export" type="button" onClick={resetDefaults}>Reset Defaults</button>
        <button className="btn-clear" type="button" onClick={onLogout}>Logout</button>
      </section>

      <section className="form-card animate-in animate-in-delay-2 cp-card">
        <h2 className="form-title">Meta Tags</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={config.meta.title} onChange={(e) => updateMeta('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Keywords</label>
            <input className="form-input" value={config.meta.keywords} onChange={(e) => updateMeta('keywords', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input cp-textarea" value={config.meta.description} onChange={(e) => updateMeta('description', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">OG Title</label>
            <input className="form-input" value={config.meta.ogTitle} onChange={(e) => updateMeta('ogTitle', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">OG Image URL</label>
            <input className="form-input" value={config.meta.ogImage} onChange={(e) => updateMeta('ogImage', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">OG Description</label>
          <textarea className="form-input cp-textarea" value={config.meta.ogDescription} onChange={(e) => updateMeta('ogDescription', e.target.value)} />
        </div>
      </section>

      <section className="form-card animate-in animate-in-delay-3 cp-card">
        <h2 className="form-title">Hero Content</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Badge</label>
            <input className="form-input" value={config.hero.badge} onChange={(e) => updateHero('badge', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">CTA Text</label>
            <input className="form-input" value={config.hero.ctaText} onChange={(e) => updateHero('ctaText', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Hero Title Main</label>
            <input className="form-input" value={config.hero.titleMain} onChange={(e) => updateHero('titleMain', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Hero Title Highlight</label>
            <input className="form-input" value={config.hero.titleHighlight} onChange={(e) => updateHero('titleHighlight', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Intro Line 1</label>
          <textarea className="form-input cp-textarea" value={config.hero.intro1} onChange={(e) => updateHero('intro1', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Intro Line 2</label>
          <textarea className="form-input cp-textarea" value={config.hero.intro2} onChange={(e) => updateHero('intro2', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Campaign Section Title</label>
            <input className="form-input" value={config.campaignTitle} onChange={(e) => setConfig((cur) => ({ ...cur, campaignTitle: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Footer Text</label>
            <input className="form-input" value={config.footerText} onChange={(e) => setConfig((cur) => ({ ...cur, footerText: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Feature Tag 1</label><input className="form-input" value={config.features[0]} onChange={(e) => updateFeature(0, e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Feature Tag 2</label><input className="form-input" value={config.features[1]} onChange={(e) => updateFeature(1, e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Feature Tag 3</label><input className="form-input" value={config.features[2]} onChange={(e) => updateFeature(2, e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Feature Tag 4</label><input className="form-input" value={config.features[3]} onChange={(e) => updateFeature(3, e.target.value)} /></div>
        </div>
      </section>

      <section className="form-card animate-in animate-in-delay-4 cp-card">
        <h2 className="form-title">Form + Dropdown Settings</h2>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Urgency Text (use {'{spotsLeft}'})</label><input className="form-input" value={config.form.urgencyText} onChange={(e) => updateForm('urgencyText', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Form Eyebrow</label><input className="form-input" value={config.form.eyebrow} onChange={(e) => updateForm('eyebrow', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Form Title</label><input className="form-input" value={config.form.title} onChange={(e) => updateForm('title', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Submit Text</label><input className="form-input" value={config.form.submitText} onChange={(e) => updateForm('submitText', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Submitting Text</label><input className="form-input" value={config.form.submittingText} onChange={(e) => updateForm('submittingText', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Select Placeholder</label><input className="form-input" value={config.form.standardPlaceholder} onChange={(e) => updateForm('standardPlaceholder', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Form Subtitle</label><textarea className="form-input cp-textarea" value={config.form.subtitle} onChange={(e) => updateForm('subtitle', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Consent Text</label><textarea className="form-input cp-textarea" value={config.form.consentText} onChange={(e) => updateForm('consentText', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Student Placeholder</label><input className="form-input" value={config.form.studentPlaceholder} onChange={(e) => updateForm('studentPlaceholder', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Guardian Placeholder</label><input className="form-input" value={config.form.guardianPlaceholder} onChange={(e) => updateForm('guardianPlaceholder', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Student Label</label><input className="form-input" value={config.form.studentLabel} onChange={(e) => updateForm('studentLabel', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Guardian Label</label><input className="form-input" value={config.form.guardianLabel} onChange={(e) => updateForm('guardianLabel', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone Placeholder</label><input className="form-input" value={config.form.phonePlaceholder} onChange={(e) => updateForm('phonePlaceholder', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">School Placeholder</label><input className="form-input" value={config.form.schoolPlaceholder} onChange={(e) => updateForm('schoolPlaceholder', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone Label</label><input className="form-input" value={config.form.phoneLabel} onChange={(e) => updateForm('phoneLabel', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Standard Label</label><input className="form-input" value={config.form.standardLabel} onChange={(e) => updateForm('standardLabel', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Place Placeholder</label><input className="form-input" value={config.form.placePlaceholder} onChange={(e) => updateForm('placePlaceholder', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Dropdown Option 1</label><input className="form-input" value={config.form.standardOptions[0]} onChange={(e) => updateFormOption(0, e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">School Label</label><input className="form-input" value={config.form.schoolLabel} onChange={(e) => updateForm('schoolLabel', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Place Label</label><input className="form-input" value={config.form.placeLabel} onChange={(e) => updateForm('placeLabel', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Dropdown Option 2</label><input className="form-input" value={config.form.standardOptions[1]} onChange={(e) => updateFormOption(1, e.target.value)} /></div>
        </div>
      </section>

      <section className="form-card animate-in animate-in-delay-4 cp-card">
        <h2 className="form-title">Registration Settings</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Closing Date</label>
            <input
              className="form-input"
              type="date"
              value={config.registrationCloseDate}
              onChange={(e) => updateCloseDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" aria-hidden="true">&nbsp;</label>
            <button className="btn-clear" type="button" onClick={() => updateCloseDate('')}>Clear Date</button>
          </div>
        </div>
        <p className="form-subtitle">Leave empty for no closing date.</p>
      </section>

      <section className="form-card animate-in animate-in-delay-4 cp-card">
        <h2 className="form-title">Giveaway + Images</h2>
        <div className="form-group">
          <label className="form-label">Giveaway Title</label>
          <input className="form-input" value={config.giveaway.title} onChange={(e) => updateGiveaway('title', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Giveaway Text</label>
          <textarea className="form-input cp-textarea" value={config.giveaway.text} onChange={(e) => updateGiveaway('text', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Giveaway English Text</label>
          <textarea className="form-input cp-textarea" value={config.giveaway.english} onChange={(e) => updateGiveaway('english', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Logo URL</label><input className="form-input" value={config.images.logo} onChange={(e) => updateImage('logo', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Boy URL</label><input className="form-input" value={config.images.boy} onChange={(e) => updateImage('boy', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Offer URL</label><input className="form-input" value={config.images.offer} onChange={(e) => updateImage('offer', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Tablet URL</label><input className="form-input" value={config.images.tab} onChange={(e) => updateImage('tab', e.target.value)} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Footer Image URL</label>
          <input className="form-input" value={config.images.footer} onChange={(e) => updateImage('footer', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Ad Image 1 URL</label><input className="form-input" value={config.images.ads[0]} onChange={(e) => updateAdImage(0, e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Ad Image 2 URL</label><input className="form-input" value={config.images.ads[1]} onChange={(e) => updateAdImage(1, e.target.value)} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Ad Image 3 URL</label>
          <input className="form-input" value={config.images.ads[2]} onChange={(e) => updateAdImage(2, e.target.value)} />
        </div>
      </section>

      <section className="form-card animate-in animate-in-delay-4 cp-card">
        <h2 className="form-title">Info Cards (Right Side)</h2>
        {config.infoCards.map((card, i) => (
          <div className="cp-inline-card" key={i}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Card {i + 1} Icon</label>
                <input className="form-input" value={card.icon} onChange={(e) => updateInfoCard(i as 0 | 1 | 2 | 3, 'icon', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Card {i + 1} Title</label>
                <input className="form-input" value={card.title} onChange={(e) => updateInfoCard(i as 0 | 1 | 2 | 3, 'title', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Card {i + 1} Text</label>
              <textarea className="form-input cp-textarea" value={card.text} onChange={(e) => updateInfoCard(i as 0 | 1 | 2 | 3, 'text', e.target.value)} />
            </div>
          </div>
        ))}
        <p className="form-status success">{status}</p>
      </section>
    </main>
  )
}

function AdminPage({
  leads,
  setLeads,
  onRefreshLeads,
  onLogout,
  config,
  setConfig,
}: {
  leads: LeadRecord[]
  setLeads: React.Dispatch<React.SetStateAction<LeadRecord[]>>
  onRefreshLeads: () => Promise<LeadRecord[]>
  onLogout: () => void
  config: SiteConfig
  setConfig: React.Dispatch<React.SetStateAction<SiteConfig>>
}) {
  const [status, setStatus] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)

  const syncLeads = (next: LeadRecord[]) => {
    setLeads(next)
    if (LOCAL_FALLBACK_ENABLED) {
      saveLeads(next)
    }
  }

  const syncLeadsWithout = (leadId: string) => {
    setLeads((current) => {
      const next = current.filter((lead) => lead.id !== leadId)
      if (LOCAL_FALLBACK_ENABLED) {
        saveLeads(next)
      }
      return next
    })
  }

  const refreshLatestLeads = async (showStatus = true) => {
    setRefreshing(true)
    try {
      const records = await onRefreshLeads()
      if (showStatus) {
        setStatus(records.length ? 'Latest registrations loaded from MongoDB.' : 'No registrations found.')
      }
    } catch {
      if (showStatus) {
        setStatus('Failed to refresh registrations. Please try again.')
      }
    } finally {
      setRefreshing(false)
    }
  }

  const clearLeads = async () => {
    if (!window.confirm('Are you sure you want to clear all student data?')) return
    setClearing(true)
    try {
      try {
        await clearLeadsServerless()
      } catch {
        if (MONGO_ENABLED) {
          await clearLeadsRemote()
        } else {
          saveLeads([])
        }
      }
      syncLeads([])
      await refreshLatestLeads(false)
      setStatus(MONGO_ENABLED ? 'All student data deleted from MongoDB.' : 'All local student data cleared.')
    } catch {
      setStatus('Failed to clear student data. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  const deleteLead = async (lead: LeadRecord) => {
    if (!window.confirm(`Delete the registration for ${lead.studentName}?`)) return
    setDeletingLeadId(lead.id)
    try {
      try {
        await deleteLeadServerless(lead.id)
      } catch (error) {
        if (MONGO_ENABLED) {
          await deleteLeadRemote(lead.id)
        } else if (!LOCAL_FALLBACK_ENABLED) {
          throw error
        }
      }
      syncLeadsWithout(lead.id)
      await refreshLatestLeads(false)
      setStatus(`Deleted registration for ${lead.studentName}.`)
    } catch (error) {
      if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
        syncLeadsWithout(lead.id)
        await refreshLatestLeads(false)
        setStatus('That registration was already removed.')
      } else {
        setStatus('Failed to delete this registration. Please try again.')
      }
    } finally {
      setDeletingLeadId(null)
    }
  }

  const handleExport = () => {
    if (!exportLeadsAsExcel(leads)) {
      setStatus('No student data available for export.')
      return
    }
    setStatus('Student data exported as Excel file.')
  }

  const updateCloseDate = (value: string) => {
    const normalized = normalizeCloseDateValue(value)
    setConfig((cur) => ({ ...cur, registrationCloseDate: normalized }))
    if (normalized) {
      setStatus(`Registrations will close on ${normalized}.`)
    } else {
      setStatus('Registrations are open. No closing date set.')
    }
  }

  return (
    <main className="page-shell admin-page">
      <section className="admin-hero animate-in">
        <p className="form-eyebrow">Admin Dashboard</p>
        <h1>Student Registrations</h1>
        <p>View and export all student details collected from the campaign landing page.</p>
        <button className="btn-clear admin-logout-btn" type="button" onClick={onLogout}>Logout</button>
      </section>

      <section className="admin-toolbar animate-in animate-in-delay-1">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <strong>{leads.length}</strong>
            <span>Total Registrations</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎁</div>
          <div>
            <strong>{Math.max(0, GIVEAWAY_LIMIT - leads.length)}</strong>
            <span>Giveaway Spots Left</span>
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="btn-export" type="button" onClick={handleExport}>Export as Excel</button>
          <button className="btn-export btn-refresh" type="button" onClick={() => void refreshLatestLeads()} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Latest'}
          </button>
          <button className="btn-clear" type="button" onClick={() => void clearLeads()} disabled={clearing || refreshing}>
            {clearing ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </section>

      <section className="form-card animate-in animate-in-delay-2 admin-card">
        <h2 className="form-title">Registration Settings</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Closing Date</label>
            <input
              className="form-input"
              type="date"
              value={config.registrationCloseDate}
              onChange={(e) => updateCloseDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" aria-hidden="true">&nbsp;</label>
            <button className="btn-clear" type="button" onClick={() => updateCloseDate('')}>Clear Date</button>
          </div>
        </div>
        <p className="form-subtitle">Leave empty for no closing date.</p>
      </section>

      <section className="table-card animate-in animate-in-delay-3">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th>School</th>
                <th>Standard</th>
                <th>Place</th>
                <th>Consent</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length ? (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.id}</td>
                    <td>{lead.studentName}</td>
                    <td>{lead.guardianName}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.school}</td>
                    <td>{lead.standard}</td>
                    <td>{lead.place}</td>
                    <td>{lead.consent ? '✅ Yes' : '❌ No'}</td>
                    <td>{formatSubmittedAt(lead.submittedAt)}</td>
                    <td className="table-actions">
                      <button
                        className="btn-row-delete"
                        type="button"
                        onClick={() => void deleteLead(lead)}
                        disabled={deletingLeadId === lead.id || clearing}
                      >
                        {deletingLeadId === lead.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty-state">
                    No student registrations yet. Share the link via Meta ads to start collecting data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {status && <p className="admin-status">{status}</p>}
      </section>

      <footer className="page-footer">
        <a href="https://www.nexston.in" target="_blank" rel="noopener noreferrer" aria-label="Visit Nexston">
          <SmoothImage src={config.images.footer} fallbackSrc={DEFAULT_SITE_CONFIG.images.footer} alt="Wings Campus footer visual" className="admin-footer-image" />
        </a>
      </footer>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
