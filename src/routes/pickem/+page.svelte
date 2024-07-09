<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly, slide } from 'svelte/transition';
	import type { ActionData, PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	import { fullNameToMascot } from '$lib/utils/matching-format';
	import type { Writable } from 'svelte/store';
	import { getContext } from 'svelte';
	import AlertFlash from '$lib/components/alert.svelte';
	import { type Alert } from '$lib/utils/types';
	import { type PickForm } from '$lib/utils/types';
	// import { type $Enums } from '@prisma/client';

	export let data: PageData;
	export let form: ActionData;

	const alert: Writable<Alert> = getContext('alert');

	$: ({ odds, savedPicks } = data);
	$: console.log('odds', odds);
	// $: console.log('data', data);
	// $: console.log('form', form);

	$: usersPicks = data.picks ? data.picks : form?.picks ? form?.picks : [];
	$: hiddenInput = JSON.stringify(usersPicks) as unknown as HTMLInputElement;
	let errorId: string;

	const addPick = (
		id: string,
		oddId: string,
		type: string,
		description: string,
		homeTeam: string,
		awayTeam: string
	) => {
		// add this data
		const userPick = {
			id,
			show: 'PMT',
			type,
			description: description,
			homeTeam: fullNameToMascot[homeTeam],
			awayTeam: fullNameToMascot[awayTeam]
		};

		// check if the pick already exists
		if (usersPicks.length > 0) {
			const pickExists = usersPicks.find((pick) => pick.id === id);
			if (pickExists) {
				alert.set({
					text: 'You have already made this pick',
					alertType: 'error'
				});
				errorId = oddId;
				setTimeout(() => {
					errorId = '';
				}, 3000);
				return;
			}
		}

		// check if the pick is an opposing pick
		if (usersPicks.length > 0) {
			if (savedPicks && usersPicks.length >= 2) {
				alert.set({
					text: 'You already have 2 saved. Please remove them to choose a new ones.',
					alertType: 'error'
				});
				errorId = oddId;
				return;
			}
			const opposingPick: PickForm | undefined = usersPicks.find(
				(pick) =>
					pick.homeTeam === fullNameToMascot[homeTeam] &&
					pick.awayTeam === fullNameToMascot[awayTeam] &&
					pick.type === type
			);
			if (opposingPick) {
				usersPicks = usersPicks.filter((pick) => pick.id !== opposingPick.id);
			}
		}

		// check if the user has already made that type of pick
		if (usersPicks.length > 0) {
			const pickType = usersPicks.find((pick) => pick.type === type);
			if (pickType) {
				alert.set({
					text: `You have already made a ${type} pick. Please choose a different type.`,
					alertType: 'error'
				});
				errorId = oddId;
				setTimeout(() => {
					errorId = '';
				}, 3000);

				return;
			}
		}

		// check if user has already made picks
		if (usersPicks.length >= 2) {
			alert.set({
				text: 'You have already made 2 picks. Remove one to choose a new one.',
				alertType: 'error'
			});
			errorId = oddId;
			return;
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
			case 'spreads' || 'spread':
				description = `${team} ${betNumber > 0 ? `+${betNumber}` : betNumber}`;
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

	const updateAlert = () => {
		if (form) {
			alert.set({
				text: form.message,
				alertType: form.success ? 'success' : 'error'
			});
		}
		return;
	};
	// alerts
	$: form, updateAlert();
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

	<div class="my-4" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
		<AlertFlash />
	</div>

	<form use:enhance action="?/addPicks" method="post">
		<input type="hidden" name="userPicks" bind:value={hiddenInput} />
		{#if usersPicks.length > 0}
			<div class="w-full mt-4 card max-w-6xl" transition:slide={{ duration: 300 }}>
				{#if data.picks !== usersPicks && usersPicks.length === 2}
					<div
						class="transition-all duration-300 ease-in-out flex justify-end items-center"
						transition:slide={{ duration: 300, delay: 300 }}
					>
						<button
							type="submit"
							disabled={data.picks === usersPicks || usersPicks.length !== 2}
							class={`btn-primary ${
								usersPicks.length < 2
									? 'bg-disabled hover:bg-disabled dark:hover:bg-disabled text-muteTextColor border-black'
									: ''
							}`}
						>
							Save Picks
						</button>
					</div>
				{:else}
					<div
						class="transition-all duration-300 ease-in-out flex justify-start items-center"
						transition:slide={{ duration: 300, delay: 300 }}
					>
						<h2 class="font-header text-2xl">
							{savedPicks ? 'Your Picks' : 'Make 2 Picks & Save Them'}
						</h2>
					</div>
				{/if}

				<div
					class="grid grid-cols-1 sm:grid-cols-2 mt-4 mb-8 sm:gap-x-6 gap-y-6 max-w-6xl
							font-paragraph transition-all duration-300 ease-in-out"
				>
					{#each usersPicks as pick}
						<div
							class="card pb-4 pt-2 flex flex-col gap-y-4 gap-x-4 justify-between
							transition-all duration-300 ease-in-out"
							in:slide={{ duration: 300, delay: 250 }}
							out:slide={{ duration: 250 }}
						>
							<div class="flex justify-start items-center">
								<p class="">{pick.awayTeam} @ {pick.homeTeam}</p>
							</div>
							<div class="flex justify-start items-center">
								<p class="font-semibold">{pick.description}</p>
							</div>

							<div
								class="flex flex-row gap-x-4"
								in:slide={{ duration: 300 }}
								out:slide={{ duration: 250 }}
							>
								<form use:enhance action="?/deletePick" method="post">
									<input type="hidden" name="pickId" value={pick.id} />
									<input type="hidden" name="usersPicks" bind:value={hiddenInput} />

									<button
										class="w-full px-4 py-1.5 rounded-md bg-lightRed hover:bg-lightRedHover
										dark:bg-darkRed dark:hover:bg-darkRedHover text-white transition-all duration-300 ease-in-out"
										type="submit"
									>
										Remove
									</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		<div
			class="grid grid-cols-1 lg:grid-cols-2 mt-4 mb-8 md:gap-x-6 gap-y-6 max-w-6xl
			font-paragraph transition-all duration-300 ease-in-out"
		>
			{#if odds !== undefined}
				{#each odds as odd}
					{#if errorId === odd.id}
						<div class="my-4" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
							<AlertFlash />
						</div>
					{/if}

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
										{#each bets.outcomes as outcome, outcomeIndex}
											<div class="">
												<button
													class={`w-full p-4 rounded-md transition-all duration-300 ease-in-out
													${
														usersPicks.map((pick) => pick.id === outcome.id).includes(true)
															? 'bg-disabled hover:bg-disabled dark:hover:bg-disabled text-muteTextColor border-black cursor-not-allowed'
															: 'bg-gray-200 hover:bg-gray-300 dark:bg-darkPrimary dark:hover:bg-darkHover'
													}`}
													disabled={usersPicks.map((pick) => pick.id === outcome.id)[0]}
													on:click={(e) => {
														e.preventDefault();
														addPick(
															outcome.id,
															odd.id,
															bets.key === 'spreads' ? bets.key.slice(0, -1) : bets.key,
															getDescription(
																bets.key,
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
														: bets.key === 'totals' && outcomeIndex % 2 === 0
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
