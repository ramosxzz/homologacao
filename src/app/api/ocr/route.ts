import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseFaturaText } from '@/lib/faturaParser';

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `fatura_${Date.now()}.pdf`);
    await fs.writeFile(tempFilePath, buffer);

    try {
      const { stdout } = await execFileAsync('pdftotext', ['-layout', tempFilePath, '-']);
      const data = parseFaturaText(stdout);
      return NextResponse.json({ success: !('error' in data), data, error: 'error' in data ? data.error : undefined });
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  } catch (error) {
    console.error('OCR API Error:', error);
    const message = error instanceof Error ? error.message : 'Erro ao processar PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
