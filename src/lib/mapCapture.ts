/**
 * Captura de imagens do imóvel via Google (Static Maps / Street View),
 * passando pelo proxy /api/mapshot para contornar CORS.
 * Retorna data URL (base64) pronto para preview e para embed nos documentos.
 */
export type TipoImagem = 'satellite' | 'streetview';

export function mapshotUrl(type: TipoImagem, lat: number, lng: number, zoom = 20): string {
  const q = new URLSearchParams({ type, lat: String(lat), lng: String(lng), zoom: String(zoom) });
  return `/api/mapshot?${q.toString()}`;
}

/** Busca a imagem no proxy e converte para data URL (base64). */
export async function capturarImagem(
  type: TipoImagem,
  lat: number,
  lng: number,
  zoom = 20,
): Promise<string> {
  const res = await fetch(mapshotUrl(type, lat, lng, zoom));
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (res.status === 502 || /not activated|not enabled/i.test(txt)) {
      throw new Error(
        'Habilite a "Maps Static API" e a "Street View Static API" no Google Cloud Console para este projeto.',
      );
    }
    throw new Error(`Falha ao capturar imagem (${res.status}). ${txt}`.trim());
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('Falha ao ler imagem'));
    fr.readAsDataURL(blob);
  });
}
