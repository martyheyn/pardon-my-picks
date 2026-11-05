import { read } from '$app/server';
import kanitMedium from '@fontsource/kanit/files/kanit-latin-500-normal.woff';
import kanitBold from '@fontsource/kanit/files/kanit-latin-700-normal.woff';
import plexRegular from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff';
import plexSemiBold from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff';

// fonts and images are imported here so vite copies them into the server build, then loaded with
// sveltekit's read() - the adapter bundles imported assets with the function, so cards never
// depend on fetching the site's own static files over the network

export type CardFont = {
	name: string;
	data: Buffer;
	weight: 400 | 500 | 600 | 700;
	style: 'normal';
};

export type CardImage = {
	src: string;
	width: number;
	height: number;
};

const readBytes = async (asset: string) => Buffer.from(await read(asset).arrayBuffer());

let fonts: Promise<CardFont[]> | null = null;

// the site's font-header and font-paragraph. Read once per server instance
export function loadCardFonts(): Promise<CardFont[]> {
	fonts ??= Promise.all([
		readBytes(kanitMedium).then((data) => ({ name: 'Kanit', data, weight: 500 as const })),
		readBytes(kanitBold).then((data) => ({ name: 'Kanit', data, weight: 700 as const })),
		readBytes(plexRegular).then((data) => ({ name: 'IBM Plex Sans', data, weight: 400 as const })),
		readBytes(plexSemiBold).then((data) => ({ name: 'IBM Plex Sans', data, weight: 600 as const }))
	]).then((loaded) => loaded.map((font) => ({ ...font, style: 'normal' as const })));
	return fonts;
}

// path -> url of the copy vite emits. Eager on purpose: sveltekit only ships the assets that are
// statically imported next to a read() call, and lazy globs would leave the images out of the deployed
// function. Each entry is just a url string - the image bytes are only read when a card draws it
const staticImages: Record<string, string> = {
	...import.meta.glob('/static/personas/*.png', { import: 'default', eager: true }),
	...import.meta.glob('/static/avatars/*.jpg', { import: 'default', eager: true }),
	...import.meta.glob('/static/nfl-team-logos/*.png', { import: 'default', eager: true })
};

const MIME_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg' };

// width and height straight from the PNG header, so a persona can be scaled without squashing it
export function pngSize(bytes: Buffer): { width: number; height: number } | null {
	const isPng = bytes.length >= 24 && bytes.toString('ascii', 1, 4) === 'PNG';
	if (!isPng) return null;
	return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function loadStaticBytes(path: string): Promise<Buffer | null> {
	const asset = staticImages[`/static${path}`];
	return asset ? readBytes(asset) : null;
}

const toDataUrl = (path: string, bytes: Buffer) => {
	const type = MIME_TYPES[path.slice(path.lastIndexOf('.') + 1)] ?? 'application/octet-stream';
	return `data:${type};base64,${bytes.toString('base64')}`;
};

// takes the same path the site uses in an <img src>, e.g. personaAvatarPath('Hank'). Returns a
// data url satori can draw, or null for an image that isn't in static/
export async function loadStaticImage(path: string): Promise<string | null> {
	const bytes = await loadStaticBytes(path);
	return bytes ? toDataUrl(path, bytes) : null;
}

// a PNG along with its size, for art that needs scaling to fit
export async function loadPngImage(path: string): Promise<CardImage | null> {
	const bytes = await loadStaticBytes(path);
	const size = bytes ? pngSize(bytes) : null;
	if (!bytes || !size) return null;
	return { src: toDataUrl(path, bytes), ...size };
}
