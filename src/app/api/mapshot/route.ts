import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy server-side para imagens do Google (Static Maps / Street View).
 * Buscar direto no browser esbarra em CORS (resposta opaca, sem acesso aos
 * bytes), impedindo a conversão para base64 e o embed nos documentos.
 * Este endpoint roda no Worker, busca a imagem no Google e devolve os bytes
 * na mesma origem — o cliente então lê e converte livremente.
 *
 * GET /api/mapshot?type=satellite|streetview&lat=..&lng=..&zoom=20
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') || 'satellite';
  const lat = sp.get('lat');
  const lng = sp.get('lng');
  const zoom = sp.get('zoom') || '20';
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

  if (!lat || !lng) return new Response('lat/lng ausentes', { status: 400 });
  if (!key) return new Response('GOOGLE_MAPS_KEY ausente', { status: 500 });

  const url =
    type === 'streetview'
      ? `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&fov=80&pitch=0&source=outdoor&key=${key}`
      : `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=640x640&scale=2&maptype=satellite&key=${key}`;

  try {
    const r = await fetch(url);
    if (!r.ok) return new Response(`upstream ${r.status}`, { status: 502 });
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: {
        'Content-Type': r.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'erro', { status: 500 });
  }
}
