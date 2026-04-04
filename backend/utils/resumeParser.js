import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function parseResume(fileBuffer, mimeType) {
  let raw = "";

  if (mimeType === PDF_MIME) {
    const parser = new PDFParse({ data: fileBuffer });
    try {
      const result = await parser.getText();
      raw = result.text || "";
    } finally {
      await parser.destroy();
    }
  } else if (mimeType === DOCX_MIME) {
    const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
    raw = value || "";
  } else {
    throw new Error("Unsupported file type for parsing");
  }

  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export { PDF_MIME, DOCX_MIME };
