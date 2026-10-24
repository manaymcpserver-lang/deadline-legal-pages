// Optional enhancement only: no redirect, location lookup, cookie or network call.
// Storage failures must never prevent navigation or reading the static page.
export const preferenceKey = "nonlate.website-language.v1";
export const languageNames = {
  en:"English",es:"Español",fr:"Français",hi:"हिन्दी",ar:"العربية","zh-Hans":"简体中文","pt-BR":"Português (Brasil)","pt-PT":"Português (Portugal)",de:"Deutsch",ja:"日本語",id:"Bahasa Indonesia",ru:"Русский",ko:"한국어",it:"Italiano",tr:"Türkçe",vi:"Tiếng Việt",pl:"Polski",fa:"فارسی",th:"ไทย",nl:"Nederlands",uk:"Українська",bn:"বাংলা",ur:"اردو",ta:"தமிழ்",te:"తెలుగు","zh-Hant":"繁體中文",he:"עברית",fil:"Filipino",cs:"Čeština",sv:"Svenska",ca:"Català",da:"Dansk",fi:"Suomi",el:"Ελληνικά",hu:"Magyar",ms:"Bahasa Melayu",nb:"Norsk bokmål",ro:"Română",hr:"Hrvatski",sk:"Slovenčina",sl:"Slovenščina",gu:"ગુજરાતી",kn:"ಕನ್ನಡ",ml:"മലയാളം",mr:"मराठी",or:"ଓଡ଼ିଆ",pa:"ਪੰਜਾਬੀ",
};
export const prompts = {
  en:"Continue in English?",es:"¿Continuar en español?",fr:"Continuer en français ?",hi:"हिन्दी में जारी रखें?",ar:"هل تريد المتابعة بالعربية؟","zh-Hans":"使用简体中文继续？","pt-BR":"Continuar em português do Brasil?","pt-PT":"Continuar em português de Portugal?",de:"Auf Deutsch weiterlesen?",ja:"日本語で続けますか？",id:"Lanjutkan dalam bahasa Indonesia?",ru:"Продолжить на русском?",ko:"한국어로 계속할까요?",it:"Continuare in italiano?",tr:"Türkçe devam edilsin mi?",vi:"Tiếp tục bằng tiếng Việt?",pl:"Kontynuować po polsku?",fa:"به فارسی ادامه می‌دهید؟",th:"อ่านต่อเป็นภาษาไทยไหม?",nl:"Verdergaan in het Nederlands?",uk:"Продовжити українською?",bn:"বাংলায় চালিয়ে যাবেন?",ur:"اردو میں جاری رکھیں؟",ta:"தமிழில் தொடரவா?",te:"తెలుగులో కొనసాగించాలా?","zh-Hant":"使用繁體中文繼續？",he:"להמשיך בעברית?",fil:"Magpatuloy sa Filipino?",cs:"Pokračovat česky?",sv:"Fortsätta på svenska?",ca:"Vols continuar en català?",da:"Fortsæt på dansk?",fi:"Jatketaanko suomeksi?",el:"Συνέχεια στα ελληνικά;",hu:"Folytatja magyarul?",ms:"Teruskan dalam bahasa Melayu?",nb:"Fortsette på norsk bokmål?",ro:"Continuați în română?",hr:"Nastaviti na hrvatskom?",sk:"Pokračovať po slovensky?",sl:"Nadaljuj v slovenščini?",gu:"ગુજરાતીમાં ચાલુ રાખશો?",kn:"ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯುವುದೇ?",ml:"മലയാളത്തിൽ തുടരണോ?",mr:"मराठीत पुढे जायचे?",or:"ଓଡ଼ିଆରେ ଜାରି ରଖିବେ?",pa:"ਪੰਜਾਬੀ ਵਿੱਚ ਜਾਰੀ ਰੱਖਣਾ ਹੈ?",
};
export function matchLanguage(input) {
  if (typeof input !== "string") return null;
  const tag = input.replaceAll("_", "-").toLowerCase();
  const exact = Object.keys(languageNames).find(code => code.toLowerCase() === tag);
  if (exact) return exact;
  const parts = tag.split("-");
  const language = parts[0];
  if (language === "zh") {
    if (parts.includes("hant")) return "zh-Hant";
    if (parts.includes("hans")) return "zh-Hans";
    return parts.some(part => ["tw","hk","mo"].includes(part)) ? "zh-Hant" : "zh-Hans";
  }
  if (language === "pt") return parts.slice(1).includes("pt") ? "pt-PT" : "pt-BR";
  if (language === "tl") return "fil";
  if (language === "iw") return "he";
  if (language === "in") return "id";
  if (language === "no") return "nb";
  return Object.hasOwn(languageNames, language) ? language : null;
}
export function suggestedLanguage({current, available, saved, preferred}) {
  // An explicit translated URL must not be second-guessed by browser settings.
  if (current !== "en") return null;
  if (Object.hasOwn(languageNames, saved ?? "")) {
    // A manual preference wins even if this article lacks that translation.
    return saved !== current && Object.hasOwn(available, saved) ? saved : null;
  }
  for (const input of preferred) {
    const code = matchLanguage(input);
    if (code && Object.hasOwn(available, code)) return code === current ? null : code;
  }
  return null;
}
export function readPreference(storage) {
  try { const code = storage.getItem(preferenceKey); return Object.hasOwn(languageNames, code ?? "") ? code : null; }
  catch { return null; }
}
export function savePreference(storage, code) {
  if (!Object.hasOwn(languageNames, code)) return;
  try { storage.setItem(preferenceKey, code); } catch { /* Private browsing/storage disabled. */ }
}
export function mountLanguageSuggestion(doc, browser, navigation) {
  const config = doc.querySelector("script[data-language-suggestion]");
  if (!config || doc.getElementById("nonlate-language-suggestion")) return;
  const current = config.dataset.currentLanguage;
  let available;
  try { available = JSON.parse(config.dataset.languageTargets); } catch { return; }
  if (!Object.hasOwn(languageNames, current ?? "") || !available || typeof available !== "object") return;
  let storage;
  try { storage = browser.localStorage; } catch { storage = null; }
  // Preserve choices made through either of the existing language selectors.
  doc.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Next.js can navigate without a document reload. Never leave a banner
    // with an old article's destination on screen after such navigation.
    const anchor = event.target?.closest?.("a[href]");
    if (anchor) {
      const href = new URL(anchor.href, navigation.href);
      if (href.origin === navigation.origin && href.pathname !== navigation.pathname) doc.getElementById("nonlate-language-suggestion")?.remove();
    }
    const link = event.target?.closest?.("[data-language-switcher] a[lang], .guide-languages a[lang]");
    if (!link) return;
    const url = new URL(link.href, navigation.href);
    if (url.origin === navigation.origin) savePreference(storage, matchLanguage(link.lang));
  });
  browser.addEventListener?.("popstate", () => doc.getElementById("nonlate-language-suggestion")?.remove());
  const target = suggestedLanguage({current, available, saved:readPreference(storage), preferred:browser.navigator.languages?.length ? browser.navigator.languages : [browser.navigator.language]});
  if (!target || typeof available[target] !== "string") return;
  const destination = new URL(available[target], navigation.href);
  if (destination.origin !== navigation.origin) return;
  destination.search = navigation.search;
  destination.hash = navigation.hash;
  const panel = doc.createElement("aside");
  panel.id = "nonlate-language-suggestion";
  panel.className = "language-suggestion";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-labelledby", "nonlate-language-title");
  const title = doc.createElement("p");
  title.id = "nonlate-language-title";
  title.lang = target;
  title.dir = ["ar","fa","he","ur"].includes(target) ? "rtl" : "ltr";
  title.textContent = prompts[target];
  const actions = doc.createElement("div");
  actions.className = "language-suggestion-actions";
  const accept = doc.createElement("a");
  accept.href = destination.href;
  accept.lang = target;
  accept.hreflang = target === "fil" ? "tl" : target;
  accept.textContent = languageNames[target] + " →";
  accept.addEventListener("click", () => savePreference(storage, target));
  const stay = doc.createElement("button");
  stay.type = "button";
  stay.lang = current;
  stay.textContent = languageNames[current];
  stay.addEventListener("click", () => { savePreference(storage, current); panel.remove(); });
  panel.addEventListener("keydown", event => { if (event.key === "Escape") { savePreference(storage, current); panel.remove(); } });
  actions.append(accept, stay);
  panel.append(title, actions);
  doc.body.append(panel);
}
if (typeof window !== "undefined" && typeof document !== "undefined") {
  mountLanguageSuggestion(document, window, window.location);
}
