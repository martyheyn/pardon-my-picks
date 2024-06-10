<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, slide } from 'svelte/transition';
	import type { PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	// import { type $Enums } from '@prisma/client';

	export let data: PageData;

	type PickForm = {
		year: number;
		show: string;
		week: number;
		type: string;
		description: string;
		homeTeam: string;
		awayTeam: string;
	};

	$: ({ odds } = data);
	$: console.log('odds', odds);

	let usersPicks: PickForm[] = [];
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

		// check if user has already made picks
		if (usersPicks.length >= 2) {
			alert('You have already made your picks');
			return;
		}

		// check if the pick already exists
		if (usersPicks.length > 0) {
			const pickExists = usersPicks.find((pick) => pick.description === description);
			if (pickExists) {
				const index = usersPicks.indexOf(pickExists);
				usersPicks.splice(index, 1);
			}
		}

		// add the pick to the array
		usersPicks = [...usersPicks, userPick];
	};
	$: console.log('usersPicks', usersPicks);

	const getDescription = (
		type: string,
		betNumber: number,
		team: string, // should be enum
		overUnder?: string,
		otherTeam?: string
	) => {
		let description = '';
		if (betNumber) {
		}

		switch (type) {
			case 'spread':
				description = `${team} ${betNumber}`;
				break;
			case 'totals':
				description = `${team} vs ${otherTeam} ${overUnder} ${betNumber}`;
				break;
			default:
				description = 'No description';
				break;
		}
		return description;
	};
</script>

<svelte:head>
	<title>Pardon My Picks - Pickem</title>
</svelte:head>

<div
	class=""
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
	<div
		class="flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header">Place this weeks picks here</h1>
	</div>

	<form use:enhance method="POST">
		{#if usersPicks.length > 0}
			<div
				class="w-full mt-4 transition-all duration-300 ease-in-out flex justify-end items-center"
				transition:slide={{ duration: 300 }}
			>
				<button
					disabled={usersPicks.length < 2}
					class={`btn-primary ${
						usersPicks.length < 2
							? 'bg-disabled hover:bg-disabled dark:hover:bg-disabled text-muteTextColor border-black'
							: ''
					}`}>Save Picks</button
				>
			</div>
		{/if}
		<div
			class="grid grid-cols-1 lg:grid-cols-2 mt-4 mb-8 md:gap-x-6 gap-y-6 max-w-6xl font-paragraph transition-all duration-300 ease-in-out"
		>
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
										{#each bets.outcomes as outcome, i}
											<div class="">
												<button
													class="w-full p-4 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-darkPrimary dark:hover:bg-darkHover transition-all duration-300 ease-in-out"
													on:click={(e) => {
														e.preventDefault();
														console.log(e);
														addPick(
															bets.key === 'spreads' ? bets.key.slice(0, -1) : bets.key,
															getDescription(
																bets.key === 'spreads' ? 'spread' : 'totals',
																outcome.point,
																bets.key === 'spreads' ? outcome.name : odd.home_team,
																bets.key === 'totals' ? outcome.name : undefined,
																bets.key === 'totals' ? odd.away_team : undefined
															), // getDescription(type, betNumber, team, overUnder, otherTeam
															odd.home_team,
															odd.away_team
														);
													}}
												>
													{bets.key === 'spreads' && outcome.point > 0
														? `+${outcome.point}`
														: bets.key === 'spreads' && outcome.point < 0
														? `${outcome.point}`
														: bets.key === 'totals' && i % 2 === 0
														? `O ${outcome.point}`
														: `U ${outcome.point}`}
												</button>
											</div>
										{/each}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</form>
</div>
