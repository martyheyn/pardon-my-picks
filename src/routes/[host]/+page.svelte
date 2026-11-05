<script lang="ts">
	import type { PageData } from './$types';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { quadInOut } from 'svelte/easing';
	import type { Writable } from 'svelte/store';
	import AlertFlash from '$lib/components/alert.svelte';
	import SpecialBet from '$lib/components/special-bet.svelte';
	import { logo } from '$lib/utils/matching-format';
	import type { Alert } from '$lib/utils/types';

	let { data }: { data: PageData } = $props();

	let { host, season, summary, meta, pickSide } = $derived(data);

	// logged out goes through login first, which sends them on to the week page afterwards
	let pickSideHref = $derived(
		pickSide &&
			(data.user ? pickSide.href : `/login?redirectTo=${encodeURIComponent(pickSide.href)}`)
	);

	const alert: Writable<Alert> = getContext('alert');

	type HistoryPick = PageData['history'][number];

	// history comes newest first, so each week's picks are already next to each other
	let weeks = $derived.by(() => {
		const byWeek: { week: number | null; picks: HistoryPick[] }[] = [];
		for (const pick of data.history) {
			const current = byWeek[byWeek.length - 1];
			if (current && current.week === pick.week) {
				current.picks.push(pick);
			} else {
				byWeek.push({ week: pick.week, picks: [pick] });
			}
		}
		return byWeek;
	});

	// same colors the weekly picks page uses for graded picks
	const outcomeStyles = {
		W: 'bg-lightGreen dark:bg-darkGreen',
		L: 'bg-lightRed dark:bg-darkRed',
		P: 'bg-lightYellow dark:bg-darkYellow',
		pending: 'bg-slate-300 dark:bg-[#1f1f1f] bg-opacity-70'
	};

	const outcomeLabels = { W: 'W', L: 'L', P: 'P' };

	const marginText = (pick: HistoryPick) => {
		if (pick.outcome === null) return 'Not graded yet';
		if (pick.outcome === 'P') return 'Push';
		if (pick.margin === null) return pick.outcome === 'W' ? 'Win' : 'Loss';
		return pick.margin > 0 ? `Covered by ${pick.margin}` : `Missed by ${-pick.margin}`;
	};

	const fadeVerdict = (net: number) => {
		if (net > 0) return `Up ${net}`;
		if (net < 0) return `Down ${-net}`;
		return 'Dead even';
	};

	// phones get the native share sheet; everything else copies the link
	const share = async () => {
		const isTouch = window.matchMedia('(pointer: coarse)').matches;
		if (isTouch && navigator.share) {
			try {
				await navigator.share({ title: meta.title, text: meta.description, url: meta.url });
			} catch {
				// closing the share sheet without sharing rejects too - nothing to do
			}
			return;
		}

		try {
			await navigator.clipboard.writeText(meta.url);
			alert.set({ text: 'Link copied. Go send it to the group chat', alertType: 'success' });
		} catch {
			alert.set({ text: `Couldn't copy the link: ${meta.url}`, alertType: 'error' });
		}
	};
</script>

<div class="max-w-6xl" in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}>
	<div
		class="flex flex-wrap justify-between items-center gap-x-8 gap-y-3 pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header text-2xl sm:text-3xl">{host.displayName}'s {season.year} picks</h1>

		{#if data.seasons.length > 1}
			<nav aria-label="Seasons" class="flex flex-wrap gap-2 font-paragraph">
				{#each data.seasons as { year, href } (year)}
					<a
						{href}
						aria-current={year === season.year ? 'page' : undefined}
						class={`rounded-md border px-3 py-1 text-sm transition-all duration-200 ease-in-out ${
							year === season.year
								? 'bg-primary dark:bg-darkPrimary text-white border-primary dark:border-white'
								: 'border-black border-opacity-20 dark:border-white hover:bg-primary hover:border-primary hover:text-white dark:hover:bg-darkHover'
						}`}
					>
						{year}
					</a>
				{/each}
			</nav>
		{/if}
	</div>

	<div class="mt-4">
		<AlertFlash />
	</div>

	<img
		src={data.cardUrl}
		alt={meta.image.alt}
		width={meta.image.width}
		height={meta.image.height}
		class="w-full h-auto mt-6 rounded-md shadow-lg"
	/>

	<div class="mt-4">
		<button type="button" class="btn-primary" onclick={share}>Share</button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 font-paragraph">
		{#snippet fadeStats()}
			<p class="font-header text-5xl">{summary.fadeRecord}</p>
			<p class="text-lg">
				<span class="font-semibold">{fadeVerdict(summary.fadeNet)}</span>
				taking the other side of every {host.displayName} pick
				{season.isCurrent ? 'this season' : `in ${season.year}`}.
			</p>
		{/snippet}

		{#if pickSide && pickSideHref}
			<a
				href={pickSideHref}
				class="group card md:col-span-3 border-secondary dark:border-secondary hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1"
			>
				<div class="flex flex-wrap justify-between items-center gap-3">
					<p
						class="font-header text-lg uppercase tracking-wide text-muteTextColor dark:text-darkMuteTextColor"
					>
						Fade or tail {host.displayName}
					</p>
					<span class="btn-primary group-hover:bg-primaryHover dark:group-hover:bg-darkHover">
						{data.user ? `Week ${pickSide.week} picks →` : 'Log in to fade or tail →'}
					</span>
				</div>
				{@render fadeStats()}
			</a>
		{:else}
			<div class="card md:col-span-3 border-secondary dark:border-secondary">
				<p
					class="font-header text-lg uppercase tracking-wide text-muteTextColor dark:text-darkMuteTextColor"
				>
					Fade {host.displayName}
				</p>
				{@render fadeStats()}
			</div>
		{/if}

		<div class="card">
			<p class="text-sm text-muteTextColor dark:text-darkMuteTextColor">Record</p>
			<p class="font-header text-3xl">
				{summary.record}
				{#if summary.winPct !== null}
					<span class="text-lg text-muteTextColor dark:text-darkMuteTextColor"
						>{Math.round(summary.winPct * 100)}%</span
					>
				{/if}
			</p>
			{#if summary.streak}
				<p class="text-sm">Current streak: {summary.streak}</p>
			{/if}
		</div>

		<div class="card">
			<p class="text-sm text-muteTextColor dark:text-darkMuteTextColor">Place</p>
			<p class="font-header text-3xl">{summary.rank} of {summary.hostCount}</p>
			{#if summary.standingLine}
				<p class="text-sm">{summary.standingLine}</p>
			{/if}
		</div>

		<div class="card">
			<p class="text-sm text-muteTextColor dark:text-darkMuteTextColor">
				{summary.lastWeek ? `Week ${summary.lastWeek.week}` : 'Last week'}
			</p>
			<p class="font-header text-3xl">{summary.lastWeek ? summary.lastWeek.record : '—'}</p>
			{#if summary.worstPickLine}
				<p class="text-sm">{summary.worstPickLine}</p>
			{/if}
		</div>
	</div>

	<h2
		class="font-header text-2xl mt-12 pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		Every pick, graded
	</h2>

	{#if weeks.length === 0}
		<p class="mt-4 font-paragraph">No picks yet this season.</p>
	{/if}

	{#each weeks as { week, picks }}
		<div class="mt-6 font-paragraph">
			<h3 class="font-header text-xl mb-3">
				{#if week !== null}
					<a href={`/${season.year}/${week}`} class="hover:underline">Week {week}</a>
				{:else}
					Unscheduled
				{/if}
			</h3>

			<div class="flex flex-col gap-3">
				{#each picks as pick (pick.id)}
					<div
						class={`card flex-row items-center justify-between gap-x-4 ${
							pick.outcome === 'L'
								? 'border-l-8 border-l-lightRedHover dark:border-l-lightRedHover'
								: ''
						}`}
					>
						<div class="flex items-center gap-x-4 min-w-0">
							<span
								class={`${outcomeStyles[pick.outcome ?? 'pending']} font-header text-lg w-10 h-10 shrink-0 rounded-md flex items-center justify-center`}
							>
								{pick.outcome ? outcomeLabels[pick.outcome] : '–'}
							</span>
							<div class="min-w-0">
								<p
									class={`font-semibold ${pick.outcome === 'L' ? 'line-through decoration-2' : ''}`}
								>
									{pick.description}
								</p>
								<p class="text-sm text-muteTextColor dark:text-darkMuteTextColor">
									{marginText(pick)}
								</p>
							</div>
							{#if pick.specialBet}
								<SpecialBet betType={pick.specialBet} />
							{/if}
						</div>

						<div class="hidden sm:flex items-center gap-x-3 shrink-0">
							<img src={logo[pick.awayTeam]} alt={pick.awayTeam} class="w-8 h-8" />
							{#if pick.homeTeamScore !== null && pick.awayTeamScore !== null}
								<span class="text-lg">{pick.awayTeamScore} – {pick.homeTeamScore}</span>
							{:else}
								<span class="font-semibold">@</span>
							{/if}
							<img src={logo[pick.homeTeam]} alt={pick.homeTeam} class="w-8 h-8" />
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if data.otherHosts.length > 0}
		<h2
			class="font-header text-2xl mt-12 pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
		>
			See who else is losing
		</h2>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 mb-8 font-paragraph">
			{#each data.otherHosts as other (other.slug)}
				<a
					href={other.href}
					class="card items-center gap-y-1 hover:-translate-y-1 hover:shadow-xl hover:border-secondary dark:hover:border-secondary focus-visible:-translate-y-1 focus-visible:border-secondary dark:focus-visible:border-secondary"
				>
					<span class="font-header text-xl">{other.displayName}</span>
					<span class="text-sm text-muteTextColor dark:text-darkMuteTextColor">{other.record}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
