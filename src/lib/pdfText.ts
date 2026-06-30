type PdfTextItem = {
  str?: string;
  transform?: number[];
};

type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (source: { data: Uint8Array }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{ items: PdfTextItem[] }>;
      }>;
    }>;
  };
};

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.mjs`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of content.items) {
      const text = item.str?.trim();
      const transform = item.transform;
      if (!text || !transform) continue;

      const x = transform[4] || 0;
      const y = Math.round((transform[5] || 0) / 3) * 3;
      const row = rows.get(y) || [];
      row.push({ x, text });
      rows.set(y, row);
    }

    const pageText = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(' '))
      .join('\n');

    pages.push(pageText);
  }

  return pages.join('\n\f\n');
}
