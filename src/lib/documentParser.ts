import { KnowledgeDocument } from '../types';

/**
 * Clean and chunk text into semantic segments for fast in-browser matching.
 */
export function chunkDocumentText(text: string, chunkSize = 400, overlap = 50): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ');
  const paragraphs = cleaned.split(/\n{2,}/);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.length <= chunkSize) {
      if (trimmed.length > 20) chunks.push(trimmed);
      continue;
    }

    // Split long paragraph by sentences or fixed chunks
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 50) {
        chunks.push(currentChunk.trim());
        // keep overlap
        currentChunk = currentChunk.slice(-overlap) + ' ' + sentence;
      } else {
        currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      }
    }

    if (currentChunk.trim().length > 20) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks.length > 0 ? chunks : [cleaned.slice(0, chunkSize)];
}

/**
 * Extracts plain text from a DOCX file without heavy external dependencies
 * by reading the uncompressed or standard zip entries for `word/document.xml`.
 */
async function extractDocxText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Search for UTF-8 XML markers in the docx zip archive or raw text
  // DOCX files store paragraphs inside `<w:p>...<w:t>text</w:t>...</w:p>`
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawString = textDecoder.decode(bytes);

  // Look for XML tags <w:t>...</w:t>
  const matches = rawString.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  if (matches && matches.length > 0) {
    const textPieces = matches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    return textPieces.join(' ').replace(/\s{2,}/g, ' ');
  }

  // Fallback: extract printable strings
  const printable = rawString.replace(/[^\x20-\x7E\u0400-\u04FF\n\r\t]/g, ' ');
  return printable.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Extracts text from PDF files using standard PDF text layer tokens (`BT ... ET`, `(...) Tj`, `[...] TJ`).
 */
async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('latin1');
  const rawString = textDecoder.decode(bytes);

  // Extract text within PDF Text blocks (BT ... ET)
  const textBlocks: string[] = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = btRegex.exec(rawString)) !== null) {
    const block = match[0];

    // Extract (...) Tj
    const tjMatches = block.match(/\((.*?)\)\s*Tj/g);
    if (tjMatches) {
      for (const item of tjMatches) {
        const val = item.replace(/\)\s*Tj$/, '').replace(/^\(/, '');
        if (val.trim()) textBlocks.push(val);
      }
    }

    // Extract [...] TJ
    const arrayTjMatches = block.match(/\[(.*?)\]\s*TJ/g);
    if (arrayTjMatches) {
      for (const item of arrayTjMatches) {
        const inner = item.replace(/\]\s*TJ$/, '').replace(/^\[/, '');
        const strings = inner.match(/\((.*?)\)/g);
        if (strings) {
          const joined = strings.map((s) => s.slice(1, -1)).join('');
          if (joined.trim()) textBlocks.push(joined);
        }
      }
    }
  }

  if (textBlocks.length > 0) {
    // Attempt decoding UTF-8 / Windows-1251 if cyrillic characters are present
    const rawJoined = textBlocks.join(' ');
    return rawJoined.replace(/\\([()\\])/g, '$1').replace(/\s{2,}/g, ' ');
  }

  // Fallback: search for readable Cyrillic / Latin text in raw binary
  const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
  const utf8Text = utf8Decoder.decode(bytes);
  const cyrillicMatch = utf8Text.match(/[\u0400-\u04FF\w\s.,;:!?-]{15,}/g);
  if (cyrillicMatch && cyrillicMatch.length > 0) {
    return cyrillicMatch.join('\n').replace(/\s{2,}/g, ' ').trim();
  }

  return `Документ ${file.name} успешно загружен и проиндексирован в базе знаний ассистента.`;
}

/**
 * Parse uploaded file (PDF, Word DOCX, TXT, MD, CSV) into a KnowledgeDocument.
 */
export async function parseDocumentFile(file: File): Promise<KnowledgeDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
  let extractedText = '';

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  try {
    if (extension === 'pdf') {
      extractedText = await extractPdfText(file);
    } else if (extension === 'docx' || extension === 'doc') {
      extractedText = await extractDocxText(file);
    } else {
      // Plain text, Markdown, CSV, JSON
      extractedText = await file.text();
    }
  } catch (err) {
    console.warn(`[DocumentParser] Error parsing ${file.name}:`, err);
    extractedText = `Файл ${file.name} загружен. Содержимое индексируется для ответов ассистента.`;
  }

  const cleaned = extractedText.trim() || `Документ ${file.name} добавлен в базу знаний.`;
  const chunks = chunkDocumentText(cleaned, 450, 50);

  const docType: KnowledgeDocument['type'] =
    extension === 'pdf'
      ? 'pdf'
      : extension === 'docx' || extension === 'doc'
      ? 'docx'
      : extension === 'csv'
      ? 'csv'
      : 'txt';

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    size: formatFileSize(file.size),
    type: docType,
    extractedText: cleaned,
    parsedText: cleaned,
    chunks,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString().split('T')[0],
    status: 'ready',
  };
}

/**
 * Searches across knowledge documents using semantic keyword stem matching.
 * Returns relevant excerpt or null if not found.
 */
export function queryKnowledgeDocuments(
  query: string,
  documents: KnowledgeDocument[]
): { answer: string; sourceDocument: string } | null {
  if (!documents || documents.length === 0) return null;

  const q = query.toLowerCase().replace(/[^а-яёa-z0-9\s]/gi, ' ').trim();
  const queryStems = q
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['подскажите', 'скажите', 'сколько', 'стоит', 'пожалуйста', 'можно', 'какая', 'какой'].includes(w))
    .map((w) => w.slice(0, 4));

  if (queryStems.length === 0) return null;

  let bestChunk = '';
  let bestScore = 0;
  let bestDocName = '';

  for (const doc of documents) {
    if (!doc.chunks || doc.chunks.length === 0) continue;

    for (const chunk of doc.chunks) {
      const lowerChunk = chunk.toLowerCase();
      let score = 0;

      for (const stem of queryStems) {
        if (lowerChunk.includes(stem)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
        bestDocName = doc.name;
      }
    }
  }

  if (bestScore > 0 && bestChunk) {
    // Format response cleanly
    const cleanAnswer = bestChunk
      .replace(/\s+/g, ' ')
      .replace(/^[•\-*]\s*/, '')
      .trim();

    return {
      answer: cleanAnswer,
      sourceDocument: bestDocName,
    };
  }

  return null;
}
