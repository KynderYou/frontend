import JSZip from 'jszip';

export type ExtractedClientData = {
  scanId: string;
  name: string;
  age: string;
  phone: string;
  gender: string;
  clientType: string;
  category: string;
};

export type ScanZipImage = {
  name: string;
  url: string;
  label: string;
};

export type ZipExtractResult = {
  data: ExtractedClientData;
  images: ScanZipImage[];
  sourceFile: string | null;
  foundAny: boolean;
  /** Non-directory entries found in the zip (for diagnostics). */
  fileCount: number;
};

const emptyClient: ExtractedClientData = {
  scanId: '',
  name: '',
  age: '',
  phone: '',
  gender: '',
  clientType: '',
  category: '',
};

function hasAnyField(data: ExtractedClientData): boolean {
  return Boolean(
    data.scanId || data.name || data.age || data.phone || data.gender || data.clientType || data.category
  );
}

function normalizeGender(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value) return '';
  if (value === 'm' || value.startsWith('male') || value === 'boy') return 'Male';
  if (value === 'f' || value.startsWith('female') || value === 'girl') return 'Female';
  if (value === 'o' || value.startsWith('other')) return 'Other';
  return raw.trim();
}

/** Map scanner category token (e.g. business) to client type options. */
export function categoryToClientType(category: string): string {
  const value = category.trim().toLowerCase();
  if (!value) return '';
  if (value === 'bulk') return 'Bulk';
  if (value === 'business' || value === 'institution' || value === 'corporate' || value === 'company') {
    return 'Institution';
  }
  if (value === 'individual' || value === 'personal' || value === 'private') return 'Individual';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

function normalizeZipPath(path: string): string {
  return path.replace(/\\/g, '/');
}

function baseName(path: string): string {
  const normalized = normalizeZipPath(path);
  return normalized.split('/').pop() ?? normalized;
}

/** Age in whole years from an ISO / date string. */
export function ageFromDob(dobRaw: string, now = new Date()): string {
  const dob = new Date(dobRaw);
  if (Number.isNaN(dob.getTime())) return '';

  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? String(age) : '';
}

/** Decode scanner text that may be UTF-8 or UTF-16. */
export function decodeZipText(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  // UTF-16 LE without BOM (null bytes on odd indexes)
  if (
    bytes.length >= 8 &&
    bytes[1] === 0 &&
    bytes[3] === 0 &&
    bytes[5] === 0 &&
    bytes[0] !== 0
  ) {
    return new TextDecoder('utf-16le').decode(bytes);
  }

  const utf8 = new TextDecoder('utf-8').decode(bytes);
  // Mis-decoded UTF-16 often leaves NULs — strip as last resort
  if (utf8.includes('\0')) {
    return utf8.replace(/\0/g, '');
  }
  return utf8;
}

function labelForImage(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/i, '');
  const match = base.match(/^([LR])(\d+)(Center|Left|Right)$/i);
  if (match) {
    const hand = match[1].toUpperCase() === 'L' ? 'Left' : 'Right';
    return `${hand} ${match[2]} · ${match[3]}`;
  }
  if (/^photo$/i.test(base)) return 'Profile photo';
  return base;
}

function isImagePath(path: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(baseName(path));
}

function viewSortKey(name: string): number {
  const view = name.replace(/\.[^.]+$/i, '').match(/(Center|Left|Right)$/i)?.[1]?.toLowerCase();
  if (view === 'center') return 0;
  if (view === 'left') return 1;
  if (view === 'right') return 2;
  return 3;
}

async function extractImagesFromZip(zip: JSZip, paths: string[]): Promise<ScanZipImage[]> {
  const imagePaths = paths
    .filter(isImagePath)
    .sort((a, b) => {
      const baseCompare = baseName(a).localeCompare(baseName(b), undefined, { numeric: true });
      if (baseCompare !== 0) return baseCompare;
      return viewSortKey(baseName(a)) - viewSortKey(baseName(b));
    });

  const images: ScanZipImage[] = [];
  for (const path of imagePaths) {
    const entry =
      zip.file(path) ??
      zip.file(
        Object.keys(zip.files).find((key) => normalizeZipPath(key) === normalizeZipPath(path)) ?? ''
      );
    if (!entry || entry.dir) continue;
    const blob = await entry.async('blob');
    const name = baseName(path);
    images.push({
      name,
      url: URL.createObjectURL(blob),
      label: labelForImage(name),
    });
  }
  return images;
}

/**
 * Midna scanner Data.xml body (often plain text, not real XML tags):
 *   {id} {name…} {Gender} {ISO-DOB} {category} {phone} {base64Photo…}
 *
 * Example:
 *   3001202301 Anmol Vij Male 1987-05-10T20:07:43+05:30 business 9842227643 /9j/…
 */
export function parseMidnaDataXml(text: string): ExtractedClientData {
  const result = { ...emptyClient };

  let plain = text.replace(/^\uFEFF/, '').replace(/\0/g, '');
  plain = plain.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return result;

  // Drop trailing base64 photo payload (JPEG markers or long base64)
  const photoCut = plain.search(/\s\/9j\//i);
  if (photoCut >= 0) {
    plain = plain.slice(0, photoCut).trim();
  }

  // Primary regex
  const match = plain.match(
    /^(\d+)\s+(.+?)\s+(Male|Female|Other|M|F)\s+(\d{4}-\d{2}-\d{2}(?:T[^\s]*)?)\s+(\S+)\s+(\d{8,15})\b/i
  );

  if (match) {
    result.scanId = match[1];
    result.name = match[2].trim();
    result.gender = normalizeGender(match[3]);
    result.age = ageFromDob(match[4]);
    result.category = match[5];
    result.clientType = categoryToClientType(match[5]);
    result.phone = match[6];
    return result;
  }

  // Token fallback — resilient to odd spacing / multi-word names like "L B SAHANA"
  const tokens = plain.split(' ').filter(Boolean);
  if (tokens.length < 4) return result;

  const genderIdx = tokens.findIndex((t) => /^(male|female|other|m|f)$/i.test(t));
  const dobIdx = tokens.findIndex((t) => /^\d{4}-\d{2}-\d{2}/.test(t));
  let phoneIdx = -1;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (/^\d{8,15}$/.test(tokens[i])) {
      phoneIdx = i;
      break;
    }
  }

  if (/^\d+$/.test(tokens[0])) {
    result.scanId = tokens[0];
  }

  if (/^\d+$/.test(tokens[0]) && genderIdx > 1) {
    result.name = tokens.slice(1, genderIdx).join(' ').trim();
    result.gender = normalizeGender(tokens[genderIdx]);
  } else if (genderIdx > 0) {
    result.name = tokens.slice(0, genderIdx).join(' ').trim();
    result.gender = normalizeGender(tokens[genderIdx]);
  }

  if (dobIdx >= 0) result.age = ageFromDob(tokens[dobIdx]);
  if (phoneIdx >= 0) result.phone = tokens[phoneIdx];
  if (dobIdx >= 0 && phoneIdx > dobIdx + 1) {
    const category = tokens.slice(dobIdx + 1, phoneIdx).join(' ').trim();
    result.category = category;
    result.clientType = categoryToClientType(category);
  }

  return result;
}

function isDataXmlPath(path: string): boolean {
  return baseName(path).toLowerCase() === 'data.xml';
}

function findDataXmlPaths(paths: string[]): string[] {
  const normalized = paths.map(normalizeZipPath);
  const exact = normalized.filter(isDataXmlPath);
  if (exact.length > 0) return exact;

  return normalized.filter((p) => {
    const base = baseName(p).toLowerCase();
    return base.endsWith('.xml') && base.includes('data');
  });
}

function isIgnoredPath(path: string): boolean {
  const n = normalizeZipPath(path).toLowerCase();
  return n.startsWith('__macosx/') || n.includes('/.ds_store') || n.endsWith('/.ds_store');
}

/**
 * Reads client fields from a Midna scan ZIP.
 * Primary source: Data.xml (ID, name, gender, DOB, category, phone, photo).
 */
export async function extractClientFromZip(file: File): Promise<ZipExtractResult> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const paths = Object.keys(zip.files).filter((path) => {
    const entry = zip.files[path];
    return !entry.dir && !isIgnoredPath(path);
  });

  const images = await extractImagesFromZip(zip, paths);

  const tryParseEntry = async (path: string): Promise<ExtractedClientData | null> => {
    const entry = zip.file(path) ?? zip.file(normalizeZipPath(path));
    if (!entry) {
      // Path key may use backslashes — look up original key
      const originalKey = Object.keys(zip.files).find(
        (k) => normalizeZipPath(k) === normalizeZipPath(path)
      );
      if (!originalKey) return null;
      const original = zip.file(originalKey);
      if (!original) return null;
      const bytes = await original.async('uint8array');
      return parseMidnaDataXml(decodeZipText(bytes));
    }
    const bytes = await entry.async('uint8array');
    return parseMidnaDataXml(decodeZipText(bytes));
  };

  for (const dataXmlPath of findDataXmlPaths(paths)) {
    const data = await tryParseEntry(dataXmlPath);
    if (data && hasAnyField(data)) {
      return {
        data,
        images,
        sourceFile: baseName(dataXmlPath),
        foundAny: true,
        fileCount: paths.length,
      };
    }
  }

  // Fallback: any .xml that matches the Midna line format
  for (const path of paths) {
    if (!baseName(path).toLowerCase().endsWith('.xml')) continue;
    const data = await tryParseEntry(path);
    if (data && hasAnyField(data)) {
      return {
        data,
        images,
        sourceFile: baseName(path),
        foundAny: true,
        fileCount: paths.length,
      };
    }
  }

  // Last resort: small text-like files (some packages use .txt)
  for (const path of paths) {
    const base = baseName(path).toLowerCase();
    if (!/\.(txt|csv)$/.test(base)) continue;
    const data = await tryParseEntry(path);
    if (data && hasAnyField(data)) {
      return {
        data,
        images,
        sourceFile: baseName(path),
        foundAny: true,
        fileCount: paths.length,
      };
    }
  }

  return {
    data: { ...emptyClient },
    images,
    sourceFile: null,
    foundAny: false,
    fileCount: paths.length,
  };
}

export function revokeScanZipImages(images: ScanZipImage[] | undefined) {
  images?.forEach((image) => URL.revokeObjectURL(image.url));
}
