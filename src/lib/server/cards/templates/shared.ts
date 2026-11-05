import { div, img, type CardStyle } from '../element';

// the site's tailwind colors (tailwind.config.js), plus a deeper navy for the card background
export const COLORS = {
	primary: '#18314F',
	primaryDeep: '#0c1a2b',
	secondary: '#FFA500',
	white: '#ffffff',
	muted: '#d1d5db',
	win: '#86efac',
	loss: '#fca5a5',
	rowBackground: 'rgba(255, 255, 255, 0.06)',
	fadeBackground: 'rgba(255, 165, 0, 0.16)',
	lossBackground: 'rgba(252, 165, 165, 0.14)'
};

export const HEADER_FONT = 'Kanit';
export const BODY_FONT = 'IBM Plex Sans';

export const BACKGROUND = `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDeep} 100%)`;

// every card's outer box. border-box keeps the padding inside the canvas - satori's default
// content-box adds it on top, pushing the right and bottom edges (and the footer) off the image
export const cardFrame = (width: number, height: number, padding: string) => ({
	width,
	height,
	boxSizing: 'border-box',
	position: 'relative',
	background: BACKGROUND,
	color: COLORS.white,
	fontFamily: BODY_FONT,
	padding
});

// the link lives on the image - links in X posts cost extra and get buried
export const siteFooter = (placement: CardStyle) =>
	div(
		{
			...placement,
			fontFamily: HEADER_FONT,
			fontWeight: 500,
			fontSize: 30,
			color: COLORS.secondary,
			letterSpacing: 1
		},
		'pardonmypicks.com'
	);

export const eyebrow = (text: string) =>
	div(
		{
			fontFamily: BODY_FONT,
			fontWeight: 600,
			fontSize: 24,
			letterSpacing: 3,
			color: COLORS.secondary
		},
		text.toUpperCase()
	);

// a round avatar, or an empty circle when the host has no picture
export const avatar = (src: string | null, size: number) =>
	src
		? img(src, size, size, { borderRadius: size, objectFit: 'cover' })
		: div({ width: size, height: size, borderRadius: size, background: COLORS.rowBackground });
