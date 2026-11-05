import { div, img } from '../element';
import type { CardImage } from '../assets';
import type { CardTemplate } from '../render';
import { COLORS, HEADER_FONT, cardFrame, eyebrow, siteFooter } from './shared';

export type HostCardData = {
	displayName: string;
	// "2026 season · 6th of 6"
	eyebrow: string;
	record: string;
	winPct: string | null;
	streak: string | null;
	headline: string;
	standingLine: string | null;
	worstPickLine: string | null;
	persona: CardImage | null;
};

const WIDTH = 1200;
const HEIGHT = 630;
const PERSONA_MAX_WIDTH = 440;
const PERSONA_MAX_HEIGHT = 580;

// scales the persona art to fit its corner without stretching it
const fitPersona = (persona: CardImage): CardImage => {
	const scale = Math.min(PERSONA_MAX_WIDTH / persona.width, PERSONA_MAX_HEIGHT / persona.height);
	return {
		src: persona.src,
		width: Math.round(persona.width * scale),
		height: Math.round(persona.height * scale)
	};
};

export const hostCard: CardTemplate<HostCardData> = {
	width: WIDTH,
	height: HEIGHT,
	render: (data) => {
		const persona = data.persona ? fitPersona(data.persona) : null;

		return div(
			cardFrame(WIDTH, HEIGHT, '52px 64px'),
			persona &&
				img(persona.src, persona.width, persona.height, {
					position: 'absolute',
					right: 40,
					bottom: 0
				}),
			div(
				{ flexDirection: 'column', width: 720 },
				eyebrow(data.eyebrow),
				div(
					{
						fontFamily: HEADER_FONT,
						fontWeight: 700,
						fontSize: data.displayName.length > 9 ? 84 : 112,
						lineHeight: 1,
						marginTop: 10
					},
					data.displayName.toUpperCase()
				),
				// baseline, not flex-end: the three sizes and two fonts leave different gaps under the
				// text, so lining up their bottoms leaves the small ones hanging below the record
				div(
					{ alignItems: 'baseline', marginTop: 6 },
					div({ fontFamily: HEADER_FONT, fontWeight: 500, fontSize: 64 }, data.record),
					data.winPct && div({ fontSize: 30, color: COLORS.muted, marginLeft: 18 }, data.winPct),
					data.streak &&
						div(
							{
								fontFamily: HEADER_FONT,
								fontWeight: 700,
								fontSize: 26,
								color: data.streak.startsWith('W') ? COLORS.win : COLORS.loss,
								marginLeft: 18
							},
							data.streak
						)
				),
				div(
					{
						alignSelf: 'flex-start',
						marginTop: 26,
						padding: '8px 24px',
						borderRadius: 8,
						background: COLORS.secondary,
						color: COLORS.primary,
						fontFamily: HEADER_FONT,
						fontWeight: 700,
						fontSize: 46
					},
					data.headline
				),
				data.standingLine && div({ marginTop: 22, fontSize: 30 }, data.standingLine),
				data.worstPickLine &&
					div({ marginTop: 8, fontSize: 24, color: COLORS.muted }, data.worstPickLine)
			),
			siteFooter({ position: 'absolute', left: 64, bottom: 40 })
		);
	}
};
