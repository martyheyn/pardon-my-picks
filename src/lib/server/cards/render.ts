import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { loadCardFonts } from './assets';
import type { CardNode } from './element';

export type CardTemplate<Data> = {
	width: number;
	height: number;
	render: (data: Data) => CardNode;
};

// satori lays the template out as an svg, resvg turns that into the png
export async function renderCard<Data>(
	template: CardTemplate<Data>,
	data: Data
): Promise<Uint8Array> {
	// satori's types expect a React node - the tree from element.ts is that same shape
	const svg = await satori(template.render(data) as Parameters<typeof satori>[0], {
		width: template.width,
		height: template.height,
		fonts: await loadCardFonts()
	});

	// satori already turned the text into paths, so skip resvg's system font scan - it's most of the
	// render time otherwise (seconds per card on a mac)
	return new Resvg(svg, {
		fitTo: { mode: 'width', value: template.width },
		font: { loadSystemFonts: false }
	})
		.render()
		.asPng();
}
