const COOKIE_NAME = "immochezsoi_session"

function getCookieValue(cookieHeaderOrString, name) {
  const str = cookieHeaderOrString || ""
  const parts = str.split(";").map(s => s.trim())
  for (const p of parts) {
    if (p.startsWith(name + "=")) return p.slice(name.length + 1)
  }
  return null
}

function parseJwtPayload(token) {
  try {
    const part = token.split(".")[1]
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch (_) { return null }
}

export function isLoggedIn() {
  if (typeof document === "undefined") return false
  const t = getCookieValue(document.cookie, COOKIE_NAME)
  if (!t) return false
  const p = parseJwtPayload(t)
  if (!p || (p.exp && Date.now() / 1000 > p.exp)) return false
  return Boolean(p.sub)
}

export function getUser() {
  if (typeof document === "undefined") return null
  const t = getCookieValue(document.cookie, COOKIE_NAME)
  if (!t) return null
  const p = parseJwtPayload(t)
  return p?.sub || null
}

export function requireAuth(event) {
  const isServer = typeof process !== "undefined" && process?.versions?.node
  if (!isServer) throw new Error("requireAuth() doit être appelé côté serveur.")
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SERVER_MISCONFIG: SESSION_SECRET manquant.")
  const cookieHeader = event?.headers?.cookie || event?.headers?.Cookie || ""
  const token = getCookieValue(cookieHeader, COOKIE_NAME)
  if (!token) throw new Error("AUTH_REQUIRED")
  let jwt
  try { jwt = require("jsonwebtoken") }
  catch { throw new Error("jsonwebtoken manquant. Installe: npm i jsonwebtoken") }
  try {
    const payload = jwt.verify(token, secret)
    return { user: payload.sub }
  } catch {
    throw new Error("AUTH_INVALID")
  }
}

const DB_NS = "__db_app__"

function frontDb() {
  const read = () => {
    try { return JSON.parse(localStorage.getItem(DB_NS) || "{}") }
    catch { return {} }
  }
  const write = (obj) => localStorage.setItem(DB_NS, JSON.stringify(obj))
  return {
    get(key, def = null) { const all = read(); return key in all ? all[key] : def },
    set(key, value) { const all = read(); all[key] = value; write(all) },
    delete(key) { const all = read(); delete all[key]; write(all) },
    all() { return read() },
    clear() { localStorage.removeItem(DB_NS) }
  }
}

function serverDb() {
  const hint = "Aucune base fichier possible en serverless. Branche une base distante."
  const err = (op) => { throw new Error(`DB_UNAVAILABLE (${op}) — ${hint}`) }
  return {
    get: () => err("get"),
    set: () => err("set"),
    delete: () => err("delete"),
    all: () => err("all"),
    clear: () => err("clear")
  }
}

export const db = (typeof window !== "undefined" && typeof localStorage !== "undefined")
  ? frontDb()
  : serverDb()

export function buildSessionSetCookie(token, maxAgeSeconds = 60 * 60 * 12) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${maxAgeSeconds}`
  ]
  return parts.join("; ")
}

export function buildClearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
}
