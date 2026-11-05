import { div, img } from '../element';
import type { CardTemplate } from '../render';
import { BODY_FONT, COLORS, HEADER_FONT, avatar, cardFrame, eyebrow, siteFooter } from './shared';

export type FridayFadePick = {
	label: string;
	// data urls - the picked team's logo for a spread, both teams' for a total
	logos: string[];
};

export type FridayFadeRow = {
	displayName: string;
	record: string;
	avatar: string | null;
	picks: FridayFadePick[];
	isFade: boolean;
};

export type FridayFadeData = {
	// "Week 9 · Who to fade"
	eyebrow: string;
	headline: string;
	rows: FridayFadeRow[];
};

const WIDTH = 1200;
const HEIGHT = 675;
// the space between the header and the footer that the rows share
const ROWS_HEIGHT = 420;
const ROW_GAP = 8;

const pickChip = (pick: FridayFadePick, fontSize: number) =>
	div(
		{ alignItems: 'center', marginRight: 28 },
		...pick.logos.map((logo) => img(logo, 34, 34, { marginRight: 8 })),
		div({ fontFamily: BODY_FONT, fontWeight: 600, fontSize }, pick.label)
	);

export const fridayFade: CardTemplate<FridayFadeData> = {
	width: WIDTH,
	height: HEIGHT,
	render: (data) => {
		const rowHeight = Math.min(
			76,
			Math.floor(ROWS_HEIGHT / Math.max(data.rows.length, 1)) - ROW_GAP
		);
		const mostPicks = Math.max(0, ...data.rows.map((row) => row.picks.length));
		const pickFontSize = mostPicks > 2 ? 19 : 23;

		return div(
			{ ...cardFrame(WIDTH, HEIGHT, '40px 56px'), flexDirection: 'column' },
			eyebrow(data.eyebrow),
			div(
				{ fontFamily: HEADER_FONT, fontWeight: 700, fontSize: 56, lineHeight: 1.1, marginTop: 4 },
				data.headline
			),
			div(
				{ flexDirection: 'column', marginTop: 18 },
				...data.rows.map((row) =>
					div(
						{
							height: rowHeight,
							alignItems: 'center',
							marginBottom: ROW_GAP,
							padding: '0 18px',
							borderRadius: 10,
							background: row.isFade ? COLORS.fadeBackground : COLORS.rowBackground,
							border: `3px solid ${row.isFade ? COLORS.secondary : 'transparent'}`
						},
						avatar(row.avatar, rowHeight - 20),
						div(
							{ flexDirection: 'column', width: 220, marginLeft: 16 },
							div(
								{ fontFamily: HEADER_FONT, fontWeight: 500, fontSize: 28, lineHeight: 1.1 },
								row.displayName
							),
							div({ fontSize: 18, color: COLORS.muted }, row.record)
						),
						div(
							{ flexGrow: 1, alignItems: 'center' },
							...row.picks.map((pick) => pickChip(pick, pickFontSize))
						),
						row.isFade &&
							div(
								{
									padding: '4px 12px',
									borderRadius: 6,
									background: COLORS.secondary,
									color: COLORS.primary,
									fontFamily: HEADER_FONT,
									fontWeight: 700,
									fontSize: 22
								},
								'THE FADE'
							)
					)
				)
			),
			// in the column's flow rather than absolute, so it can never sit on top of a row
			siteFooter({ marginTop: 'auto', alignSelf: 'flex-end' })
		);
	}
};
