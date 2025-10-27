import { Buffer } from "node:buffer";

export async function extractTextFromArrayBuffer(arrayBuffer, { mimeType, fileName } = {}) {
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = fileName?.toLowerCase() || "";
  const lowerMime = mimeType?.toLowerCase() || "";

  try {
    if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
      const { default: pdfParse } = await import("pdf-parse");
      const result = await pdfParse(buffer);
      return result.text || "";
    }

    if (lowerMime.includes("wordprocessingml") || lowerName.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    }

    if (lowerMime.startsWith("text/") || lowerName.endsWith(".txt")) {
      return buffer.toString("utf8");
    }

    return buffer.toString("utf8");
  } catch (err) {
    console.error("Failed to extract document text", err);
    return "";
  }
}
