import { div } from '../element';
import type { CardTemplate } from '../render';
import { COLORS, HEADER_FONT, avatar, cardFrame, eyebrow, siteFooter } from './shared';

export type WeeklyStandingsRow = {
	rank: string;
	displayName: string;
	avatar: string | null;
	seasonRecord: string;
	weekRecord: string;
	weekTone: 'good' | 'bad' | 'even';
	// points back of 1st, '—' for the leader
	gap: string;
	isWorstWeek: boolean;
};

export type WeeklyStandingsData = {
	// "Week 9 is graded · 2026 standings"
	eyebrow: string;
	headline: string;
	subline: string | null;
	weekLabel: string;
	rows: WeeklyStandingsRow[];
};

const WIDTH = 1200;
const HEIGHT = 675;
// the space between the column labels and the footer that the rows share
const ROWS_HEIGHT = 370;
const ROW_GAP = 6;

const COLUMNS = {
	rank: 70,
	name: 330,
	season: 200,
	week: 200,
	gap: 140
};

const toneColor = { good: COLORS.win, bad: COLORS.loss, even: COLORS.white };

const columnLabel = (text: string, width: number) =>
	div(
		{ width, fontSize: 16, fontWeight: 600, letterSpacing: 2, color: COLORS.muted },
		text.toUpperCase()
	);

export const weeklyStandings: CardTemplate<WeeklyStandingsData> = {
	width: WIDTH,
	height: HEIGHT,
	render: (data) => {
		const rowHeight = Math.min(
			62,
			Math.floor(ROWS_HEIGHT / Math.max(data.rows.length, 1)) - ROW_GAP
		);

		return div(
			{ ...cardFrame(WIDTH, HEIGHT, '40px 56px'), flexDirection: 'column' },
			eyebrow(data.eyebrow),
			div(
				{ fontFamily: HEADER_FONT, fontWeight: 700, fontSize: 52, lineHeight: 1.1, marginTop: 4 },
				data.headline
			),
			data.subline && div({ fontSize: 24, color: COLORS.muted, marginTop: 2 }, data.subline),
			div(
				{ marginTop: 16, marginBottom: 6, padding: '0 18px' },
				columnLabel('', COLUMNS.rank),
				columnLabel('', COLUMNS.name),
				columnLabel('Season', COLUMNS.season),
				columnLabel(data.weekLabel, COLUMNS.week),
				columnLabel('Back', COLUMNS.gap)
			),
			...data.rows.map((row) =>
				div(
					{
						height: rowHeight,
						alignItems: 'center',
						marginBottom: ROW_GAP,
						padding: '0 18px',
						borderRadius: 10,
						background: row.isWorstWeek ? COLORS.lossBackground : COLORS.rowBackground,
						border: `3px solid ${row.isWorstWeek ? COLORS.loss : 'transparent'}`,
						fontFamily: HEADER_FONT,
						fontWeight: 500,
						fontSize: 28
					},
					div({ width: COLUMNS.rank, color: COLORS.secondary }, row.rank),
					div(
						{ width: COLUMNS.name, alignItems: 'center' },
						avatar(row.avatar, rowHeight - 18),
						div({ marginLeft: 14 }, row.displayName)
					),
					div({ width: COLUMNS.season }, row.seasonRecord),
					div({ width: COLUMNS.week, color: toneColor[row.weekTone] }, row.weekRecord),
					div({ width: COLUMNS.gap, color: COLORS.muted }, row.gap)
				)
			),
			// in the column's flow rather than absolute, so it can never sit on top of a row
			siteFooter({ marginTop: 'auto', alignSelf: 'flex-end' })
		);
	}
};
