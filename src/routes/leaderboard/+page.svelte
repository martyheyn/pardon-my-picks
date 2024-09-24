<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	export let data: PageData;
	export let form: ActionData;

	// $: console.log(data);
	const { wins, tails, fades, totalCounts } = data;
	$: winsData = form?.wins || wins;
	$: tailsData = form?.tails || tails;
	$: fadesData = form?.fades || fades;

	let selectedStats: 'wins' | 'tails' | 'fades' = 'wins';

	$: stats = {
		wins: winsData,
		tails: tailsData,
		fades: fadesData
	};

	// pagination
	let cuurentPage = 1;
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
				<button
					class={`w-full h-full hover:bg-darkHover transition-all duration-300 ease-in-out
                     cursor-pointer py-4 rounded-md ${
												selectedStats === 'wins'
													? 'text-blue-200 underline underline-offset-4 bg-darkHover'
													: 'text-white'
											}`}
					on:click={() => {
						selectedStats = 'wins';
						cuurentPage = 1;
					}}
				>
					Wins
				</button>
				<button
					class={`w-full h-full hover:bg-darkHover transition-all duration-300 ease-in-out
                     cursor-pointer py-4 rounded-md ${
												selectedStats === 'tails'
													? 'text-blue-200 underline underline-offset-4 bg-darkHover'
													: 'text-white'
											}`}
					on:click={() => {
						selectedStats = 'tails';
						cuurentPage = 1;
					}}
				>
					Tails
				</button>
				<button
					class={`w-full h-full hover:bg-darkHover transition-all duration-300 ease-in-out
                     cursor-pointer py-4 rounded-md ${
												selectedStats === 'fades'
													? 'text-blue-200 underline underline-offset-4 bg-darkHover'
													: 'text-white'
											}`}
					on:click={() => {
						selectedStats = 'fades';
						cuurentPage = 1;
					}}
				>
					Fades
				</button>
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
						<h4 class="font-semibold font-header">{stat.username}</h4>
					</div>

					<div class=" w-24 flex items-center justify-between">
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
					{#each Array.from({ length: totalPages }) as _, i}
						<form
							action="?/{selectedStats}Total&page={i}"
							method="POST"
							use:enhance={() => {
								cuurentPage = i + 1;
							}}
						>
							<button
								disabled={cuurentPage === i + 1}
								class={`hover:bg-darkHover rounded-full py-2 px-4 ${
									cuurentPage === i + 1 ? 'bg-darkHover' : ''
								}`}
								>{i + 1}
							</button>
						</form>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
