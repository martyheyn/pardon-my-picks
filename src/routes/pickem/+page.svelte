<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { fade, fly, slide } from 'svelte/transition';
	import type { ActionData, PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	import { fullNameToMascot, logo } from '$lib/utils/matching-format';
	import type { Writable } from 'svelte/store';
	import { getContext, onMount } from 'svelte';
	import AlertFlash from '$lib/components/alert.svelte';
	import { type Alert, type Odds } from '$lib/utils/types';
	import { type PickForm } from '$lib/utils/types';
	import { type $Enums } from '@prisma/client';
	import { generateId } from 'lucia';
	import { beforeNavigate } from '$app/navigation';
	import Modal from '$lib/components/modal.svelte';

	export let data: PageData;
	export let form: ActionData;

	$: ({ user } = data);

	const alert: Writable<Alert> = getContext('alert');

	let odds: Odds[];
	let bettingOpen: boolean;
	let dbPicks: PickForm[];
	let usersPicks: PickForm[] = [];
	let stoppedToSave = 0;
	onMount(async () => {
		console.log('fetching data');
		const oddsRes = await fetch(`/api/odds`);
		let oddsData = await oddsRes.json();
		odds = oddsData.odds;
		bettingOpen = oddsData.bettingOpen;

		const dbPicksRes = await fetch(`/api/db-picks`);
		let dbPicksData = await dbPicksRes.json();
		dbPicks = dbPicksData.picks;
		usersPicks = dbPicksData.picks;
	});
	$: dbPicks = form?.picks && form?.picks?.length > 1 ? form?.picks : dbPicks;
	// $: console.log('odds', odds);

	$: hiddenInput = JSON.stringify(usersPicks) as unknown as HTMLInputElement;
	let errorId: string;

	// TODO: clean this function up, seems like there are way too many inputs and there is a better way to format this
	const addPick = async (
		id: string,
		oddId: string,
		gameId: string,
		type: string,
		description: string,
		homeTeam: string,
		awayTeam: string,
		pickTeam?: string,
		pickScore?: number,
		gameDate?: string
	) => {
		let estGameDate: string = '';
		if (gameDate) {
			const tzoffset = new Date().getTimezoneOffset() * 60000;
			const dt = new Date(gameDate);
			estGameDate = new Date(dt.getTime() - tzoffset).toISOString().split('.')[0] + 'Z';
		}

		// add this data
		const userPick: PickForm = {
			id,
			gameId,
			show: 'PMT',
			type,
			description: description,
			homeTeam: fullNameToMascot[homeTeam] as $Enums.NFLTeam,
			awayTeam: fullNameToMascot[awayTeam] as $Enums.NFLTeam,
			pickTeam: pickTeam ? (fullNameToMascot[pickTeam] as $Enums.NFLTeam) : undefined,
			pickScore: pickScore,
			gameDate: estGameDate,
			marked: false
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
			if (dbPicks.length >= 2 && usersPicks.length >= 2) {
				alert.set({
					text: 'You already have 2 saved. Please remove them to choose a new ones.',
					alertType: 'error'
				});
				errorId = oddId;
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

		// check if the user has already made that type of pick
		if (usersPicks.length > 0) {
			const pickType = usersPicks.find((pick) => pick.type === type);
			if (pickType) {
				alert.set({
					text: `You have already made a ${type} pick. Please choose a different type or remove the selected pick.`,
					alertType: 'error'
				});
				errorId = oddId;
				setTimeout(() => {
					errorId = '';
				}, 3000);

				return;
			}
		}

		const response = await fetch(`/api/db-picks`);
		let data = await response.json();

		dbPicks = data.picks;

		// add the pick to the array
		usersPicks = [...usersPicks, userPick];
	};

	const removeUnsavedPick = (pickId: string) => {
		usersPicks = usersPicks.filter((pick) => pick.id !== pickId);
	};

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

	// get EST for gameDate comparison
	const date = new Date();
	const tzoffset = new Date().getTimezoneOffset() * 60000;
	const estDate = new Date(date.getTime() - tzoffset).toISOString().split('.')[0] + 'Z';

	let showModal = false;
	beforeNavigate(({ cancel }) => {
		if (usersPicks.length > 0 && dbPicks.length < 1 && stoppedToSave === 0) {
			showModal = true;
			stoppedToSave += 1;
			cancel();
		}
	});

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
	{#if !user}
		<div class={`px-4 py-3 bg-lightRed dark:bg-darkRed dark:text-white rounded-md mb-4 shadow-lg`}>
			You must be logged in to make picks
		</div>
	{/if}
	<div
		class="flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header text-2xl sm:text-3xl">Place this weeks picks here</h1>
	</div>

	<div class="my-4" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
		<AlertFlash />
	</div>

	{#if bettingOpen === false}
		<div class="my-4 rounded-md flex flex-col gap-y-4 font-paragraph">
			<h2 class="text-2xl">Betting is currently on vacation with Hank</h2>
			<p class="text-xl max-w-2xl">
				Betting is only open on Friday to Saturday so the odds will be similar to when the PMT picks
			</p>
		</div>
	{:else}
		<form use:enhance action="?/addPicks" method="post">
			<input type="hidden" name="userPicks" bind:value={hiddenInput} />
			{#if usersPicks.length > 0}
				<div class="w-full mt-4 card max-w-6xl" transition:slide={{ duration: 300 }}>
					<div
						class={`transition-all duration-300 ease-in-out flex justify-start items-center`}
						transition:slide={{ duration: 300, delay: 300 }}
					>
						{#if dbPicks.length === 2 && usersPicks.length === 2}
							<h2 class="font-header text-2xl">Your Picks</h2>
						{:else if dbPicks.length < 2 && usersPicks.length === 2}
							<div class="w-full flex justify-end">
								<button
									type="submit"
									disabled={dbPicks === usersPicks || usersPicks.length !== 2}
									class={`btn-primary ${
										usersPicks.length < 2
											? 'bg-disabled hover:bg-disabled dark:hover:bg-disabled text-muteTextColor border-black'
											: ''
									}`}
								>
									Save Picks
								</button>
							</div>
						{:else if usersPicks.length < 2}
							<h2 class="font-header text-2xl">Make 2 Picks & Save Them</h2>
						{:else}
							<h2 class="font-header text-2xl">Error, Please Refresh Page</h2>
						{/if}
					</div>

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
								<div class="flex flex-row justify-between items-center max-w-[400px]">
									<div class="">
										<img src={logo[pick.awayTeam]} alt="helmet" class="w-6 sm:w-10 h-6 sm:h-10" />
										<p>{pick.awayTeam}</p>
									</div>

									<p>@</p>

									<div class="">
										<img src={logo[pick.homeTeam]} alt="helmet" class="w-6 sm:w-10 h-6 sm:h-10" />
										<p>{pick.homeTeam}</p>
									</div>
								</div>
								<div class="flex justify-start items-center">
									<p
										class={`text-lg dark:text-white ${
											pick.marked === false
												? ''
												: pick.winner
												? 'bg-lightGreen dark:bg-darkGreen px-3 py-2 shadow-lg rounded-md'
												: pick.push
												? 'bg-lightYellow dark:bg-darkYellow px-3 py-2 shadow-lg rounded-md'
												: 'bg-lightRed dark:bg-darkRed px-3 py-2 shadow-lg rounded-md'
										} w-fit flex justify-start items-center`}
									>
										{pick.description}
									</p>
								</div>

								{#if pick.gameDate && pick.gameDate > estDate}
									<div
										class="flex flex-row gap-x-4"
										in:slide={{ duration: 300 }}
										out:slide={{ duration: 250 }}
									>
										<form
											action="?/deletePick"
											method="post"
											use:enhance={({ cancel }) => {
												const findPick = dbPicks.find((dbPick) => dbPick.id === pick.id)
													? true
													: false;

												// scan for if id is in the DB
												if (!findPick) {
													console.log('here didnt make it to deleting');
													removeUnsavedPick(pick.id);
													cancel();
												}

												return async ({ result }) => {
													console.log('result', result);
													// `result` is an `ActionResult` object
													if (result.type === 'success') {
														await applyAction(result);
														removeUnsavedPick(pick.id);
													} else if (result.type === 'failure') {
														await applyAction(result);
													}
												};
											}}
										>
											<input type="hidden" name="pickId" value={pick.id} />
											<input type="hidden" name="usersPicks" bind:value={hiddenInput} />

											<button
												class="w-full px-4 py-1.5 rounded-md bg-lightRed hover:bg-lightRedHover dark:bg-darkRed
											 dark:hover:bg-darkRedHover text-white transition-all duration-300 ease-in-out"
												type="submit"
											>
												Remove
											</button>
										</form>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
			<div
				class="grid grid-cols-1 lg:grid-cols-2 mt-4 mb-8 md:gap-x-6 gap-y-6 max-w-6xl
			font-paragraph transition-all duration-300 ease-in-out"
			>
				{#if odds !== undefined && odds.length > 0}
					{#each odds as odd, i}
						<div class="card pb-4 pt-2 px-4 sm:px-6">
							<!-- min-w-[360px] -->
							{#if errorId === odd.id && $alert.text}
								<div
									class={`mt-2 lg:col-span-1`}
									transition:fly={{ x: -50, duration: 300, delay: 50 }}
								>
									<AlertFlash />
								</div>
							{/if}

							<div class="grid grid-cols-8 gap-x-4">
								<div class="col-span-3 grid grid-rows-3 gap-4 place-content-start w-full">
									<div />
									<div class="flex gap-x-4 justify-start items-center">
										<img
											src={logo[fullNameToMascot[odd.away_team]]}
											alt="helmet"
											class="w-10 h-10"
										/>
										<p class="text-sm sm:text-base">{odd.away_team}</p>
									</div>
									<div class="flex gap-x-4 justify-start items-center">
										<img
											src={logo[fullNameToMascot[odd.home_team]]}
											alt="helmet"
											class="w-10 h-10"
										/>

										<p class="text-sm sm:text-base">{odd.home_team}</p>
									</div>
								</div>

								<div class="w-full col-span-5 flex flex-row gap-x-4 sm:gap-x-6 justify-end">
									{#each odd.bookmakers[0].markets as bets}
										<div class="grid grid-rows-3 gap-y-4 place-content-center">
											<div
												class="flex justify-center items-center font-header font-semibold text-lg"
											>
												{bets.key.charAt(0).toUpperCase() + bets.key.slice(1)}
											</div>
											{#each bets.outcomes as outcome, outcomeIndex}
												<div class="w-[60px] sm:w-full flex items-center">
													<button
														class={`w-full py-3 px-0 sm:py-4 sm:px-4 rounded-md transition-all duration-300 ease-in-out text-xs sm:text-base
													${
														usersPicks.map((pick) => pick.id === outcome.id).includes(true) || !user
															? 'bg-disabled hover:bg-disabled dark:hover:bg-disabled text-muteTextColor border-black cursor-not-allowed'
															: 'bg-gray-200 hover:bg-gray-300 dark:bg-darkPrimary dark:hover:bg-darkHover'
													}`}
														disabled={usersPicks
															.map((pick) => pick.id === outcome.id)
															.includes(true) || !user}
														on:click={(e) => {
															let outcomeId = generateId(15);
															outcome.id = outcomeId;
															e.preventDefault();
															addPick(
																outcomeId,
																odd.id,
																odd.gameId,
																bets.key === 'spreads' ? bets.key.slice(0, -1) : bets.key,
																getDescription(
																	bets.key,
																	outcome.point,
																	bets.key === 'spreads' ? outcome.name : odd.home_team,
																	bets.key === 'totals' ? outcome.name : undefined,
																	bets.key === 'totals' ? odd.away_team : undefined
																), // getDescription(type, betNumber, team, overUnder, otherTeam)
																odd.home_team,
																odd.away_team,
																bets.key === 'spreads' ? outcome.name : undefined,
																outcome.point,
																odd.commence_time
															);
														}}
													>
														<span>
															{bets.key === 'spreads' && outcome.point > 0
																? `+${outcome.point}`
																: bets.key === 'spreads' && outcome.point < 0
																? `${outcome.point}`
																: bets.key === 'totals' && outcomeIndex % 2 === 0
																? `O ${outcome.point}`
																: `U ${outcome.point}`}
														</span>
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
	{/if}
</div>

<Modal bind:showModal>
	<div class="flex flex-col gap-y-4">
		<h2 class="font-header text-2xl">Yo</h2>
		<p class="font-paragraph">
			You haven't saved your picks yet, so they are not fully submitted. Press the save button to
			submit them.
		</p>
		<p class="font-paragraph">Don't be like Max and forget to push the button</p>
	</div>
</Modal>
