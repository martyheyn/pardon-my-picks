<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ odds } = data);
	$: console.log('odds', odds);

	const usersPicks = [];
	const addPick = (type: string, description: string, homeTeam: string, awayTeam: string) => {
		// add this data
		const userPick = {
			// id: '1',
			year: 2021,
			show: 'PMT',
			week: 1,
			// person: 'me',
			type,
			description: description,
			homeTeam,
			awayTeam
			// User: ['1'],
		};
	};
	const getDescription = (
		type: string,
		betNumber: number,
		team: string // should be enum
	) => {
		let description = '';
		let betNum: string = '';
		if (betNumber) {
		}

		switch (type) {
			case 'spread':
				description = `${team} ${betNumber}`;
				break;
			case 'total':
				description = `${team} ${betNumber}`;
				break;
			default:
				description = 'No description';
				break;
		}
		return description;
	};
</script>

<div class="">
	<h1>Place your picks here</h1>

	<div
		class="grid grid-cols-1 md:grid-cols-2 my-8 md:gap-x-6 gap-y-6 max-w-6xl font-paragraph transition-all duration-300 ease-in-out"
	>
		<form action="" use:enhance>
			{#if usersPicks.length > 0}
				<div transition:slide={{ duration: 300 }}>
					<button>Save Picks</button>
				</div>
			{/if}
			{#if odds !== undefined}
				{#each odds as odd}
					<div class="card pb-4 pt-2 min-w-[360px]">
						<div class="grid grid-cols-8 gap-x-4">
							<div class="col-span-3 grid grid-rows-3 place-content-start w-full">
								<div />
								<div class="flex justify-start items-center">
									<p class="">{odd.away_team}</p>
								</div>
								<div class="flex justify-start items-center">
									<p class="">{odd.home_team}</p>
								</div>
							</div>

							<div class="w-full col-span-5 flex flex-row gap-x-6 justify-end">
								{#each odd.bookmakers[0].markets as bets}
									<div class="grid grid-rows-3 gap-y-4 place-content-center">
										<div class="flex justify-center items-center font-header font-semibold text-lg">
											{bets.key.charAt(0).toUpperCase() + bets.key.slice(1)}
										</div>
										{#each bets.outcomes as outcome}
											<div class="">
												<button
													class="w-full p-4 rounded-md bg-gray-200 hover:bg-gray-300 transition-all duration-300 ease-in-out"
													on:click={() =>
														addPick(
															bets.key.slice(0, -1),
															'description',
															odd.home_team,
															odd.away_team
														)}
													>{bets.key === 'spreads' && outcome.point > 0
														? `+${outcome.point}`
														: outcome.point}</button
												>
											</div>
										{/each}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</form>
	</div>
</div>
