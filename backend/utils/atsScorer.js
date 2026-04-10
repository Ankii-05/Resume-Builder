import { DOMAIN_KEYWORDS } from "../data/domainKeywords.js";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;
const LOCATION_HINTS =
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*[A-Z]{2}\b|\bRemote\b|\bUnited States\b/i;

const SECTION_PATTERNS = {
  experience:
    /\b(experience|work experience|employment|professional experience|career history)\b/i,
  education: /\b(education|academic|qualifications|university|degree)\b/i,
  skills: /\b(skills|technical skills|core competencies|expertise)\b/i,
  summary:
    /\b(summary|profile|objective|about me|professional summary|overview)\b/i,
  projects: /\b(projects|portfolio|key projects)\b/i,
  certifications: /\b(certifications?|licenses?|credentials)\b/i,
  achievements: /\b(achievements?|awards?|honors?)\b/i,
};

const HEADER_LINE_RE =
  /^(?:[A-Z][A-Z\s&]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m;

const DATE_RANGE_RE =
  /\b(19|20)\d{2}\s*[-–—]\s*(?:present|now|current|(19|20)\d{2})\b/i;
const QUANT_RE = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%|\b\d+\s*(?:%|k|m|million|billion)\b|\$\s*\d/i;

const BULLET_RE = /(?:^|\n)\s*[•\-\*▪◦]\s+/m;

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const FALLBACK_SOFT_ACTION = DOMAIN_KEYWORDS.software_engineer;

/** Admin-defined keyword list → scoring pack (soft skills + verbs from generic SE pack). */
export function packFromAdminKeywords(keywords) {
  const uniq = [
    ...new Set(
      (keywords || [])
        .map((k) => String(k).trim())
        .filter(Boolean)
    ),
  ];
  return {
    technical: uniq,
    soft: [...FALLBACK_SOFT_ACTION.soft],
    action_verbs: [...FALLBACK_SOFT_ACTION.action_verbs],
    extraKeywords: [],
  };
}

function collectAllKeywords(pack) {
  const list = [
    ...pack.technical,
    ...pack.soft,
    ...pack.action_verbs,
    ...(pack.extraKeywords || []),
  ];
  return list;
}

function textIncludesKeyword(lowerText, keyword) {
  const k = keyword.toLowerCase();
  if (lowerText.includes(k)) return true;
  const compact = k.replace(/\s+/g, "");
  if (compact.length >= 3 && lowerText.replace(/\s+/g, "").includes(compact))
    return true;
  return false;
}

function hasClearSectionHeaders(text) {
  const lines = text.split("\n").slice(0, 80);
  let headers = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t.length >= 3 && t.length <= 48 && HEADER_LINE_RE.test(t)) headers++;
  }
  return headers >= 2;
}

function inconsistentFormatting(text) {
  const hasBullet = BULLET_RE.test(text);
  const hasDashLine = /(?:^|\n)\s*-\s+\S/m.test(text);
  return hasBullet && hasDashLine;
}

function hasSkillsCategories(text) {
  const skillsBlock = text.match(
    /\b(skills|technical skills|core competencies)\b[\s\S]{0,1200}/i
  );
  if (!skillsBlock) return false;
  const block = skillsBlock[0];
  return (
    /\b(Technical|Tools|Languages|Frameworks|Cloud|Soft)\s*:/i.test(block) ||
    (block.includes(":") && block.split("\n").filter((l) => l.includes(":")).length >= 2)
  );
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function generateSuggestions(scores, matched, missing, text, _domainSlug, domainLabel) {
  const suggestions = [];
  const lower = text.toLowerCase();
  const hasSummary = SECTION_PATTERNS.summary.test(text);

  if (scores.keywords < 20) {
    const top = missing.slice(0, 5).join(", ");
    suggestions.push({
      priority: "HIGH",
      section: "Keywords",
      text: top
        ? `Add these high-impact ${domainLabel} keywords where truthful: ${top}.`
        : `Strengthen keyword alignment for ${domainLabel} roles using the job description as a guide.`,
      impact: "+15-20 ATS points",
    });
  }

  if (scores.experience < 12) {
    suggestions.push({
      priority: "HIGH",
      section: "Work Experience",
      text: "Quantify achievements with metrics (%, $, volume, time). Example: 'Reduced latency by 35%' instead of 'Improved performance'.",
      impact: "+8-12 ATS points",
    });
  }

  if (scores.contact < 8) {
    suggestions.push({
      priority: "MEDIUM",
      section: "Contact Info",
      text: "Add a LinkedIn URL and keep email and phone visible at the top of your resume.",
      impact: "+5 ATS points",
    });
  }

  if (scores.structure < 10) {
    suggestions.push({
      priority: "HIGH",
      section: "Structure",
      text: "Use clear section headers such as EXPERIENCE, EDUCATION, and SKILLS so ATS parsers can map your content.",
      impact: "+10 ATS points",
    });
  }

  if (!hasSummary) {
    suggestions.push({
      priority: "MEDIUM",
      section: "Professional Summary",
      text: `Add a 2-3 line summary tailored to ${domainLabel}, weaving in 2-3 role-relevant keywords.`,
      impact: "+5 ATS points",
    });
  }

  if (scores.skills < 7) {
    suggestions.push({
      priority: "LOW",
      section: "Skills",
      text: "Group skills into categories (e.g., Languages, Tools, Cloud) and mirror phrasing from target job posts.",
      impact: "+3-5 ATS points",
    });
  }

  if (scores.formatting < 7) {
    suggestions.push({
      priority: "MEDIUM",
      section: "Formatting",
      text:
        countWords(text) > 1200
          ? "Trim content toward two pages or fewer; long resumes often parse poorly in ATS."
          : "Keep consistent bullets and spacing; mixed styles can confuse parsers.",
      impact: "+3-6 ATS points",
    });
  }

  suggestions.sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  );

  return suggestions;
}

function quickWinStrings(suggestions) {
  return suggestions.slice(0, 3).map((s) => {
    const t = s.text;
    if (t.length <= 100) return t;
    return `${t.slice(0, 97)}...`;
  });
}

function overallLabel(score) {
  if (score <= 40) return "Needs Improvement";
  if (score <= 65) return "Fair Match";
  if (score <= 85) return "Good Match";
  if (score >= 92) return "Excellent";
  return "Strong Match";
}

/**
 * @param {string} resumeText
 * @param {string} domainSlug — persisted slug (static or admin profile)
 * @param {{ technical: string[], soft: string[], action_verbs: string[], extraKeywords?: string[] }} pack
 * @param {string} domainLabel — human-readable name for suggestions copy
 */
export function scoreResume(resumeText, domainSlug, pack, domainLabel) {
  const text = resumeText || "";
  const lower = text.toLowerCase();
  const label =
    domainLabel && String(domainLabel).trim()
      ? String(domainLabel).trim()
      : String(domainSlug || "role").replace(/_/g, " ");
  const allKeywords = collectAllKeywords(pack);

  const matched = [];
  const missing = [];
  for (const keyword of allKeywords) {
    if (textIncludesKeyword(lower, keyword)) matched.push(keyword);
    else missing.push(keyword);
  }

  const keywordScore = Math.round(
    allKeywords.length
      ? (matched.length / allKeywords.length) * 35
      : 0
  );

  let contactScore = 0;
  if (EMAIL_RE.test(text)) contactScore += 3;
  if (PHONE_RE.test(text)) contactScore += 3;
  if (LINKEDIN_RE.test(text)) contactScore += 2;
  if (LOCATION_HINTS.test(text)) contactScore += 2;

  let structureScore = 0;
  if (SECTION_PATTERNS.experience.test(text)) structureScore += 4;
  if (SECTION_PATTERNS.education.test(text)) structureScore += 4;
  if (SECTION_PATTERNS.skills.test(text)) structureScore += 4;
  if (SECTION_PATTERNS.summary.test(text)) structureScore += 1;
  if (SECTION_PATTERNS.projects.test(text)) structureScore += 1;
  if (SECTION_PATTERNS.certifications.test(text)) structureScore += 1;
  if (SECTION_PATTERNS.achievements.test(text)) structureScore += 1;
  structureScore = Math.min(structureScore, 15);

  let experienceScore = 0;
  const actionHits = pack.action_verbs.filter((v) =>
    textIncludesKeyword(lower, v)
  ).length;
  if (BULLET_RE.test(text) || actionHits >= 2) experienceScore += 8;
  if (QUANT_RE.test(text)) experienceScore += 8;
  if (DATE_RANGE_RE.test(text)) experienceScore += 4;
  experienceScore = Math.min(experienceScore, 20);

  let formattingScore = 10;
  if (countWords(text) > 1200) formattingScore -= 3;
  if (!hasClearSectionHeaders(text)) formattingScore -= 3;
  if (inconsistentFormatting(text)) formattingScore -= 2;
  formattingScore = Math.max(formattingScore, 0);

  let skillsScore = 0;
  if (SECTION_PATTERNS.skills.test(text)) skillsScore += 5;
  if (hasSkillsCategories(text)) skillsScore += 3;
  const domainSkillHits = pack.technical.filter((k) =>
    textIncludesKeyword(lower, k)
  ).length;
  if (domainSkillHits >= 3) skillsScore += 2;
  skillsScore = Math.min(skillsScore, 10);

  const breakdown = {
    contact: contactScore,
    keywords: keywordScore,
    experience: experienceScore,
    structure: structureScore,
    formatting: formattingScore,
    skills: skillsScore,
  };

  const total = Math.min(
    100,
    breakdown.contact +
      breakdown.keywords +
      breakdown.experience +
      breakdown.structure +
      breakdown.formatting +
      breakdown.skills
  );

  const suggestions = generateSuggestions(
    breakdown,
    matched,
    missing,
    text,
    domainSlug,
    label
  );

  const missingCap = missing.slice(0, 15);

  return {
    overall: total,
    label: overallLabel(total),
    domain: domainSlug,
    breakdown,
    matchedKeywords: matched,
    missingKeywords: missingCap,
    suggestions,
    quickWins: quickWinStrings(suggestions),
  };
}
