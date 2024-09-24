<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	export let data: PageData;
	export let form: ActionData;

	type statsType = 'wins' | 'tails' | 'fades';

	// $: console.log(data);
	const { wins, tails, fades, totalCounts } = data;
	$: winsData = form?.wins || wins;
	$: tailsData = form?.tails || tails;
	$: fadesData = form?.fades || fades;

	let selectedStats: statsType = 'wins';
	let selectedStatsArr: statsType[] = ['wins', 'tails', 'fades'];

	$: stats = {
		wins: winsData,
		tails: tailsData,
		fades: fadesData
	};

	// pagination
	let currentPage = 1;
	let totalPages = Math.ceil(Number(totalCounts[selectedStats]) / 10);
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
			{#each stats[selectedStats] as stat, i}
				<div class="flex justify-between items-center w-full max-w-md">
					<div class="flex items-center gap-x-2">
						<p>{i + 1}.</p>
						<h4 class="font-semibold font-header max-w-44 sm:max-w-none break-words">
							{stat.username}
						</h4>
					</div>

					<div class="w-24 flex items-center justify-between">
						<p class="text-lg font-paragraph">
							{stat.wins} - {stat.losses}
							{stat.pushes ? `${stat.pushes}` : ''}
						</p>
						<p
							class={`${
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
						{#each Array.from({ length: totalPages }) as _, i}
							<form
								action="?/{selectedStats}Total&page={i}"
								method="POST"
								use:enhance={() => {
									currentPage = i + 1;
								}}
							>
								<button
									disabled={currentPage === i + 1}
									class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4 ${
										currentPage === i + 1 ? 'bg-primaryHover dark:bg-darkHover text-white' : ''
									}`}
									>{i + 1}
								</button>
							</form>
						{/each}
					{:else if currentPage === 1}
						<button
							disabled={true}
							class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white text-white rounded-full py-2 px-4`}
							>1
						</button>

						<form
							action="?/{selectedStats}Total&page=1"
							method="POST"
							use:enhance={() => {
								currentPage = 2;
							}}
						>
							<button
								class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4 bg-darkHover`}
								>2
							</button>
						</form>

						<div>...</div>

						<form
							action="?/{selectedStats}Total&page={totalPages - 1}"
							method="POST"
							use:enhance={() => {
								currentPage = 1;
							}}
						>
							<button
								disabled={currentPage === totalPages}
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
								currentPage = currentPage - 1;
							}}
						>
							<button
								class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4 bg-darkHover`}
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
									currentPage = currentPage + 1;
								}}
							>
								<button
									class={`hover:bg-primaryHover dark:hover:bg-darkHover hover:text-white rounded-full py-2 px-4`}
									>{currentPage + 1}</button
								>
							</form>
						{/if}

						<div>...</div>

						<form
							action="?/{selectedStats}Total&page={totalPages - 1}"
							method="POST"
							use:enhance={() => {
								currentPage = 1;
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
				</div>
			</div>
		</div>
	</div>
</div>
