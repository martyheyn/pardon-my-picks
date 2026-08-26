<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { untrack } from 'svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type statsType = 'wins' | 'tails' | 'fades';

	// stat switches/pagination flow through form actions (form?.x || x below), never
	// through data reloading, so this is intentionally a one-time snapshot of the initial load.
	const { wins, tails, fades, totalCounts } = untrack(() => data);
	let winsData = $derived(form?.wins || wins);
	let tailsData = $derived(form?.tails || tails);
	let fadesData = $derived(form?.fades || fades);

	let selectedStats: statsType = $state('wins');
	const selectedStatsArr: statsType[] = ['wins', 'tails', 'fades'];

	let stats = $derived({
		wins: winsData,
		tails: tailsData,
		fades: fadesData
	});

	// pagination
	let currentPage = $state(1);
	let totalPages = $derived(Math.ceil(Number(totalCounts[selectedStats]) / 10));

	const pageIndices = (count: number) => Array.from({ length: count }, (_, i) => i);
</script>

<div
	class="max-w-2xl"
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
	<div class="card px-0">
		<div class="border-b dark:border-white dark:border-opacity-100 text-center pt-3">
			<h2 class="text-2xl font-header mb-4">Leaderboard</h2>

			<div class="grid grid-cols-3 mt-2">
				{#each selectedStatsArr as statType}
					<form
						action="?/{statType}Total&page=0"
						method="POST"
						use:enhance={() => {
							selectedStats = statType;
							currentPage = 1;
						}}
					>
						<button
							class={`w-full h-full text-slate-900 dark:text-white transition-all duration-300 
									ease-in-out cursor-pointer py-4 rounded-md ${
										selectedStats === statType
											? 'underline underline-offset-4 bg-primary text-white dark:bg-[#1f1f1f]'
											: 'hover:bg-primaryHover hover:text-white dark:hover:bg-darkHover'
									}`}
						>
							{statType.charAt(0).toUpperCase() + statType.slice(1)}
						</button>
					</form>
				{/each}
			</div>
		</div>

		<div class="my-2 mx-4 p-2 flex flex-col justify-center items-center gap-y-2">
			<h4 class="text-2xl font-header mb-4">
				{selectedStats.charAt(0).toUpperCase() + selectedStats.slice(1)} Leaderboard
			</h4>
			{#if stats[selectedStats].length === 0}
				<p class="text-xl">No stats for this leaderboard yet</p>
			{/if}
			{#each stats[selectedStats] as stat, i}
				<div class="flex justify-between items-center w-full max-w-md">
					<div class="flex items-center gap-x-2">
						<p>{i + 1 + (currentPage - 1) * 10}.</p>
						<h4
							class="font-semibold font-header max-w-36 sm:max-w-none break-words hover:scale-[1.02] transition-all ease-in-out duration-300"
						>
							<a href={`/user/${encodeURIComponent(stat.username)}`}>
								{stat.username}
							</a>
						</h4>
					</div>

					<div class="flex items-center justify-between gap-x-6">
						<p class="text-lg font-paragraph">
							{stat.wins} - {stat.losses}
							{stat.pushes ? ` - ${stat.pushes}` : ''}
						</p>
						<p
							class={`w-12 text-right ${
								stat.pct > 50
									? 'text-green-500 dark:text-green-300'
									: stat.pct < 50
										? 'text-red-500 dark:text-red-300'
										: 'text-yellow-500 dark:text-yellow-300'
							}`}
						>
							{stat.pct}%
						</p>
					</div>
				</div>
			{/each}

			<div class="mt-8">
				<div class="flex flex-row gap-x-4">
					{#if totalPages <= 3}
						{#each pageIndices(totalPages) as pageIdx}
							<form
								action="?/{selectedStats}Total&page={pageIdx}"
								method="POST"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.type === 'success') {
											await applyAction(result);
											currentPage = pageIdx + 1;
										} else if (result.type === 'failure') {
											await applyAction(result);
										}
									};
								}}
							>
								<button
									disabled={currentPage === pageIdx + 1}
									class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4 ${
										currentPage === pageIdx + 1
											? 'bg-primaryHover dark:bg-darkHover text-white'
											: ''
									}`}
									>{pageIdx + 1}
								</button>
							</form>
						{/each}
					{:else if currentPage === 1}
						<button
							disabled={true}
							class={`bg-darkHover hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white text-white rounded-full py-2 px-4`}
							>1
						</button>

						<form
							action="?/{selectedStats}Total&page=1"
							method="POST"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										await applyAction(result);
										currentPage = 2;
									} else if (result.type === 'failure') {
										await applyAction(result);
									}
								};
							}}
						>
							<button
								class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4`}
								>2
							</button>
						</form>

						<div>...</div>

						<form
							action="?/{selectedStats}Total&page={totalPages - 1}"
							method="POST"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										await applyAction(result);
										currentPage = totalPages;
									} else if (result.type === 'failure') {
										await applyAction(result);
									}
								};
							}}
						>
							<button
								class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4 ${
									currentPage === totalPages ? 'bg-primaryHover dark:bg-darkHover text-white' : ''
								}`}
								>{totalPages}
							</button>
						</form>
					{:else}
						<form
							action="?/{selectedStats}Total&page={currentPage - 2}"
							method="POST"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										await applyAction(result);
										currentPage = currentPage - 1;
									} else if (result.type === 'failure') {
										await applyAction(result);
									}
								};
							}}
						>
							<button
								class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4`}
								>{currentPage - 1}</button
							>
						</form>

						<button
							disabled={true}
							class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white text-white 
									rounded-full py-2 px-4 bg-darkHover`}>{currentPage}</button
						>

						{#if currentPage !== totalPages}
							<form
								action="?/{selectedStats}Total&page={currentPage}"
								method="POST"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.type === 'success') {
											await applyAction(result);
											currentPage = currentPage + 1;
										} else if (result.type === 'failure') {
											await applyAction(result);
										}
									};
								}}
							>
								<button
									class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4`}
									>{currentPage + 1}</button
								>
							</form>
						{/if}

						{#if currentPage < totalPages - 1}
							<div>...</div>

							<form
								action="?/{selectedStats}Total&page={totalPages - 1}"
								method="POST"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.type === 'success') {
											await applyAction(result);
											currentPage = totalPages;
										} else if (result.type === 'failure') {
											await applyAction(result);
										}
									};
								}}
							>
								<button
									disabled={currentPage === totalPages}
									class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4 ${
										currentPage === totalPages ? 'bg-darkHover' : ''
									}`}
									>{totalPages}
								</button>
							</form>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
