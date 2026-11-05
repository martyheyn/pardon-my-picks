// satori renders the same { type, props } trees React.createElement builds. These helpers build
// them directly so the card templates don't need JSX in a svelte project

export type CardStyle = Record<string, string | number>;

export type CardChild = CardNode | string | null | false | undefined;

export type CardNode = {
	type: string;
	props: {
		style?: CardStyle;
		children?: CardChild[];
		src?: string;
		width?: number;
		height?: number;
	};
};

const present = (child: CardChild) => child !== null && child !== false && child !== undefined;

// satori requires display: flex on any div with more than one child, so it's on by default here
export function div(style: CardStyle, ...children: CardChild[]): CardNode {
	return {
		type: 'div',
		props: { style: { display: 'flex', ...style }, children: children.filter(present) }
	};
}

export function img(src: string, width: number, height: number, style: CardStyle = {}): CardNode {
	return { type: 'img', props: { src, width, height, style } };
}
