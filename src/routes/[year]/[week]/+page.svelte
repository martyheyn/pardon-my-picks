<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { page } from '$app/stores';
	import { fade, fly, slide } from 'svelte/transition';
	import { quadInOut } from 'svelte/easing';
	import { getContext } from 'svelte';
	import { logo, personaImgPath, sortOrder, teamLink } from '$lib/utils/matching-format';
	import type { PickByPerson } from '$lib/utils/types';
	import type { Writable } from 'svelte/store';
	import { enhance } from '$app/forms';

	import Icon from '$lib/components/icon.svelte';
	import Race from '$lib/components/race.svelte';
	import SpecialBet from '$lib/components/special-bet.svelte';
	import AlertFlash from '$lib/components/alert.svelte';
	import type { Alert } from '$lib/utils/types';

	export let data: PageData;
	export let form: ActionData;

	$: ({ picks, user, bettingOpen, pickemOpen } = data);

	$: ({ year, week } = $page.params);

	// set current week so users cant fade/tail games that have already happened
	const currWeek: Writable<number> = getContext('currWeek');
	const currYear: Writable<number> = getContext('currYear');
	const alert: Writable<Alert> = getContext('alert');

	let cardWidth: number;

	// $: console.log('picks', picks);

	$: picksByPerson = picks.reduce((acc: PickByPerson, pick: any) => {
		const { person } = pick;
		acc[person] = acc[person] || [];
		acc[person].push(pick);
		return acc;
	}, {});

	$: picksArr = [picksByPerson];
	$: for (const x in picksByPerson) {
		picksArr.push({ [x]: picksByPerson[x] });
	}
	// remove first element and sort
	$: picksArr.shift();
	$: picksArr.sort((a, b) => {
		return (
			sortOrder[Object.keys(a)[0] as keyof typeof sortOrder] -
			sortOrder[Object.keys(b)[0] as keyof typeof sortOrder]
		);
	});

	let showNerdNug: { person: string; indx: number } | undefined;

	const toggleNerdNug = (person: string, indx: number) => {
		if (showNerdNug === undefined || showNerdNug.person !== person || showNerdNug.indx !== indx) {
			showNerdNug = { person, indx };
		} else {
			showNerdNug = undefined;
		}
	};

	let btnsDivWidth: number = 0;

	const updateAlert = () => {
		if (form?.pickId) {
			alert.set({
				text: form.message,
				alertType: form.success ? 'success' : 'error'
			});

			setTimeout(() => {
				form = {
					...form,
					pickId: ''
				};
			}, 3000);
		}

		return;
	};
	// alerts
	$: form, updateAlert();

	$: alertBool = $alert.text ? true : false;

	const now = new Date();

	const displayDate = (date: Date | null) => {
		if (!date) return 'TBD';
		let estGameDate = new Date(date.getTime());
		const timeString = estGameDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
		const dayString = estGameDate.toLocaleDateString('en-US', { weekday: 'long' });
		return [timeString, dayString];
	};

	// TODO: find best wy to organize data to display
	// TODO: clean up logic making data reactive
	// TODO: look deeper into if there is a more secure way to fade/tail picks,
	// not sure if passing arguments through the url is the best way to do it
	// do it as a form so it can have a zod schema
</script>

<svelte:head>
	<title>Pardon My Picks - Week {week}</title>
</svelte:head>

<div class="max-w-6xl" in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}>
	<div
		class="flex justify-between items-center gap-x-8 text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header text-2xl sm:text-3xl">{year} Week: {week}</h1>
		{#if pickemOpen}
			<a href="/pickem" class="btn-primary">Make your picks</a>
		{/if}
	</div>

	<!-- {#if form && !form.pickId}
		<div transition:fly={{ x: -50, duration: 300, delay: 50 }}>
			<AlertFlash />
		</div>
	{/if} -->
	{#if picks.length === 0}
		<div class="card max-w-6xl px-4 flex flex-col gap-y-6 items-start justify-center my-8 text-2xl">
			<p>This weeks picks have not yet been entered.</p>
			{#if bettingOpen}
				<p>Check back later or make your picks now</p>
			{:else}
				<p>Check back Friday for the boys picks or to make your own</p>
			{/if}
		</div>
	{:else}
		<div
			class="grid grid-cols-1 md:grid-cols-8 my-8 md:gap-x-6 lg:gap-x-12 gap-y-6 md:gap-y-12 max-w-6xl font-paragraph transition-all duration-300 ease-in-out"
		>
			{#each picksArr as pickPerson}
				<div
					class="flex flex-row justify-start items-center md:items-start md:flex-col gap-x-4 md:col-span-2"
				>
					<h2 class="text-2xl pl-3 font-semibold text-left">{Object.keys(pickPerson)}</h2>
					<img
						src={personaImgPath(Object.keys(pickPerson)[0])}
						alt="sad max"
						class=" w-16 h-16 md:rounded-none md:w-full md:min-h-[225px] md:max-h-[300px] object-fit"
					/>
				</div>

				<div class="md:col-span-6">
					<div
						class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 transition-all ease-in-out duration-300"
					>
						{#each pickPerson[Object.keys(pickPerson)[0]] as pick, i}
							{#key week}
								<div
									class="card"
									bind:clientWidth={cardWidth}
									in:fade={{ duration: 400, easing: quadInOut, delay: 100 }}
								>
									<div class="">
										<h4
											class={`min-h-[56px] text-lg shadow-lg dark:text-white ${
												pick.winner === null || pick.winner === undefined
													? 'bg-slate-300 dark:bg-[#1f1f1f]  bg-opacity-70'
													: pick.winner
													? 'bg-lightGreen dark:bg-darkGreen'
													: pick.push
													? 'bg-lightYellow dark:bg-darkYellow'
													: 'bg-lightRed dark:bg-darkRed'
											} w-fit px-6 rounded-md flex justify-start items-center`}
										>
											{pick.description}
										</h4>
									</div>

									{#if pick.specialBet}
										<div class="absolute -top-4 md:top-2 -right-4 z-50 w-fit">
											<SpecialBet betType={pick.specialBet} />
										</div>
									{/if}

									{#if pick.gameDate && now < pick.gameDate}
										<div class="mt-1 ml-1 text-muteTextColor dark:text-darkMuteTextColor">
											{displayDate(pick.gameDate)[0]}
											<span class="text-xs text-muteTextColor dark:text-darkMuteTextColor ml-0.5"
												>({displayDate(pick.gameDate)[1]})</span
											>
										</div>
									{/if}

									<div
										class="flex justify-between items-center pb-4 border-b border-black border-opacity-25 dark:border-white dark:border-opacity-100"
									>
										<div class="flex flex-col items-center gap-4">
											<a href={`${teamLink[pick.awayTeam]}`} target="_blank" rel="noopener">
												<img src={logo[pick.awayTeam]} alt="helmet" class="w-10 h-10" />
											</a>
											{#if pick.homeTeamScore !== null && pick.awayTeamScore !== null}
												<p
													class={`${
														pick.homeTeamScore - pick.awayTeamScore > 0 ? '' : 'font-bold'
													} ${pick.isLive ? ' font-normal' : ''} text-lg`}
												>
													{pick.awayTeamScore}
												</p>
											{/if}
										</div>

										<div>
											<p class="font-semibold">@</p>
										</div>

										<div class="flex flex-col items-center gap-4">
											<a href={`${teamLink[pick.homeTeam]}`} target="_blank" rel="noopener">
												<img src={logo[pick.homeTeam]} alt="helmet" class="w-10 h-10" />
											</a>

											{#if pick.homeTeamScore !== null && pick.awayTeamScore !== null}
												<p
													class={`${
														!pick.isLive && pick.homeTeamScore - pick.awayTeamScore > 0
															? 'font-bold'
															: ''
													} text-lg`}
												>
													{pick.homeTeamScore}
												</p>
											{/if}
										</div>
									</div>

									{#if showNerdNug && showNerdNug.person === Object.keys(pickPerson)[0] && showNerdNug.indx === i}
										<div
											transition:slide={{ duration: 300, easing: quadInOut }}
											class="flex flex-col gap-y-2"
										>
											<div class="flex justify-between">
												<p class="font-semibold">Nerd Nugget</p>
												<button
													class="p-0.5 transition-all duration-300 ease-in-out cursor-pointer hover:bg-gray-300 hover:bg-opacity-50 rounded-full"
													on:click={() => (showNerdNug = undefined)}
												>
													<Icon
														class={`transition-all duration-300 ease-in-out fill-black cursor-pointer rotate-[270deg]`}
														width="24px"
														height="24px"
														iconName="arrow"
													/>
												</button>
											</div>
											<p>{pick.nerdNugget}</p>
										</div>
									{/if}

									<div
										class={`flex flex-row ${
											btnsDivWidth < 250 ? 'flex-col gap-y-4 items-start' : 'flex-row items-center'
										} justify-start gap-x-4 ${
											!pick.espnLink && !pick.highlighLink && !pick.nerdNugget ? 'hidden' : 'block'
										}`}
										bind:clientWidth={btnsDivWidth}
									>
										{#if pick.espnLink}
											<a href={pick.espnLink} target="_blank" rel="noopener">
												<button
													class={`min-w-[122px] px-4 sm:px-6 py-2 shadow-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 
												rounded-sm hover:bg-slate-500 transition-all duration-300 ease-in-out hover:bg-opacity-10  hover:shadow-lg`}
												>
													Box Score
												</button>
											</a>
										{/if}

										{#if pick.highlighLink}
											<a href={pick.highlighLink} target="_blank" rel="noopener">
												<button
													class="min-w-[122px] px-4 sm:px-6 py-2 shadow-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100
												rounded-sm hover:bg-slate-500 transition-all duration-300 ease-in-out hover:bg-opacity-10 hover:shadow-lg"
												>
													Highlights
												</button>
											</a>
										{/if}

										{#if pick.nerdNugget}
											<button
												class={`p-1.5 transition-all duration-300 ease-in-out cursor-pointer hover:bg-gray-300 hover:bg-opacity-50
											 rounded-full ${cardWidth > 305 && cardWidth < 370 ? 'hidden' : 'block'} ${
													showNerdNug &&
													showNerdNug.person === Object.keys(pickPerson)[0] &&
													showNerdNug.indx === i
														? 'bg-gray-300 bg-opacity-50'
														: ''
												}`}
												on:click={() => toggleNerdNug(Object.keys(pickPerson)[0], i)}
											>
												<Icon
													class={`transition-all duration-300 ease-in-out cursor-pointer fill-none`}
													width="24px"
													height="24px"
													iconName="glasses"
												/>
											</button>
										{/if}
									</div>

									<div class="flex flex-col gap-y-1 w-fit">
										<div class="flex justify-center items-center gap-x-10">
											<p class="text-sm">Tail</p>
											<p class="text-sm">Fade</p>
										</div>

										<div class="bg-gray-200 dark:bg-[#1f1f1f] px-3 py-2 bg-opacity-50 rounded-xl">
											<div class="flex justify-between items-center px-2 gap-x-4">
												<div class="h-full flex flex-col justify-center items-center gap-y-2">
													<div class="flex flex-row justify-center items-center gap-x-2">
														<form
															use:enhance
															action="?/tailPick&id={pick.id}&week={week}&year={year}"
															method="POST"
														>
															<button
																disabled={alertBool || (pick.gameDate && now > pick.gameDate)}
															>
																<Icon
																	class={`transition-all duration-300 ease-in-out ${
																		$currWeek === parseInt(week) &&
																		parseInt(year) === $currYear &&
																		!alertBool &&
																		pick.gameDate &&
																		now < pick.gameDate
																			? 'sm:hover:fill-green-300 dark:sm:hover:fill-green-900 cursor-pointer'
																			: ''
																	} ${
																		pick.tail && pick.tail.some((obj) => obj.userId === user?.id)
																			? 'fill-green-300 dark:fill-green-900'
																			: 'fill-none'
																	} ${
																		parseInt(week) !== $currWeek || parseInt(year) !== $currYear
																			? ' hover:fill-gray-500'
																			: ''
																	}`}
																	width="24px"
																	height="24px"
																	iconName="thumbUp"
																/>
															</button>
														</form>
														<p>{pick.tail ? `${pick.tail.length}` : '0'}</p>
													</div>
												</div>

												<div class="w-[.8px] h-4 mb-[1px] bg-black bg-opacity-10" />

												<div class="h-full flex flex-col justify-center items-center gap-y-2">
													<div class="flex flex-row justify-center items-center gap-x-2">
														<form
															use:enhance
															action="?/fadePick&id={pick.id}&week={week}&year={year}"
															method="POST"
														>
															<button
																disabled={alertBool || (pick.gameDate && now > pick.gameDate)}
															>
																<Icon
																	class={`transition-all duration-300 ease-in-out ${
																		$currWeek === parseInt(week) &&
																		parseInt(year) === $currYear &&
																		!alertBool &&
																		pick.gameDate &&
																		now < pick.gameDate
																			? 'sm:hover:fill-red-300 dark:sm:hover:fill-red-900 cursor-pointer '
																			: ''
																	} ${
																		pick.fade && pick.fade.some((obj) => obj.userId === user?.id)
																			? 'fill-red-300 dark:fill-red-900'
																			: 'fill-none'
																	} ${
																		parseInt(week) !== $currWeek || parseInt(year) !== $currYear
																			? ' hover:fill-gray-500'
																			: ''
																	}`}
																	width="24px"
																	height="24px"
																	iconName="thumbDown"
																/>
															</button>
														</form>
														<p>{pick.fade ? `${pick.fade.length}` : '0'}</p>
													</div>
												</div>
											</div>

											{#if (pick.tail && pick.tail.length > 0) || (pick.fade && pick.fade.length > 0)}
												<div class={`w-full h-1 flex rounded-md`}>
													<div
														class={`h-full bg-lightGreen bg-opacity-90
											${
												pick.tail &&
												pick.fade &&
												pick.tail.length / (pick.tail.length + pick.fade.length) === 1
													? 'rounded-sm'
													: 'rounded-l-sm'
											}`}
														style={`width: ${
															pick.tail && pick.fade
																? (pick.tail.length / (pick.tail.length + pick.fade.length)) * 100
																: 100
														}%`}
													/>
													<div
														class={`h-full bg-lightRed bg-opacity-90 
											${
												pick.tail &&
												pick.fade &&
												pick.fade.length / (pick.tail.length + pick.fade.length) === 1
													? 'rounded-sm'
													: 'rounded-r-sm'
											}`}
														style={`width: ${
															pick.tail && pick.fade
																? (pick.fade.length / (pick.tail.length + pick.fade.length)) * 100
																: 100
														}%`}
													/>
												</div>
											{/if}
										</div>
									</div>

									{#if form && form.pickId && pick.id === form.pickId}
										<div transition:fly={{ x: -50, duration: 300, delay: 50 }}>
											<AlertFlash />
										</div>
									{/if}
								</div>
							{/key}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<Race raceYear={Number(year)} />
</div>
