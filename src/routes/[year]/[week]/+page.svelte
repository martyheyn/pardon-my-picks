<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { fade, slide } from 'svelte/transition';
	import { linear, quadInOut } from 'svelte/easing';
	import { getContext } from 'svelte';
	import { logo, personaImgPath, sortOrder, teamLink } from '$lib/utils/matching-format';
	import type { PickByPerson } from '$lib/utils/types';
	import type { Writable } from 'svelte/store';

	import Icon from '$lib/components/icon.svelte';
	import Race from '$lib/components/race.svelte';
	import SpecialBet from '$lib/components/special-bet.svelte';

	export let data: PageData;

	$: ({ picks } = data);

	$: ({ year, week } = $page.params);

	// set current week so users cant fade/tail games that have already happened
	const currWeek: Writable<number> = getContext('currWeek');

	$: picksByPerson = picks.reduce((acc: PickByPerson, pick) => {
		const { person } = pick;
		acc[person] = acc[person] || [];
		acc[person].push(pick);
		return acc;
	}, {});

	// TODO: find better way to organize data and make it reactive
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
	// $: console.log('picksArr', picksArr);

	// set height on pick description element to max-h of row

	// get todays datetime to compare to game datetime
	const now = new Date();

	let showNerdNug: { person: string; indx: number } | undefined;

	const toggleNerdNug = (person: string, indx: number) => {
		if (showNerdNug === undefined || showNerdNug.person !== person || showNerdNug.indx !== indx) {
			showNerdNug = { person, indx };
		} else {
			showNerdNug = undefined;
		}
	};

	let btnsDivWidth: number = 0;

	// TODO: find best wy to organize data to display
	// TODO: clean up logic making data reactive
</script>

<svelte:head>
	<title>Pardon My Picks - Week {week}</title>
</svelte:head>

<div class="" in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}>
	<div
		class="flex justify-start items-center gap-x-8 text-3xl pb-2 border-b border-b-black border-opacity-10"
	>
		<h1 class="font-header">{year} Week: {week}</h1>
		<!-- <img class="w-16 h-16" src="$lib/assets/lighthouse.png" alt="hello" /> -->
	</div>

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
								class="rounded-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 shadow-lg px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-y-4 font-paragraph relative"
								in:fade={{ duration: 400, easing: quadInOut, delay: 100 }}
							>
								<div class="">
									<h4
										class={`min-h-[56px] text-lg shadow-lg dark:text-white ${
											pick.homeTeamScore === null || pick.homeTeamScore === undefined
												? 'bg-slate-300 bg-opacity-70'
												: pick.winner
												? 'bg-green-300 dark:bg-green-900'
												: pick.push
												? 'bg-yellow-300 dark:bg-yellow-500'
												: 'bg-red-300 dark:bg-red-900'
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

								<div
									class="flex justify-between items-center pb-4 border-b border-black border-opacity-25 dark:border-white dark:border-opacity-100"
								>
									<div class="flex flex-col items-center gap-2">
										<a href={`${teamLink[pick.awayTeam]}`} target="_blank" rel="noopener">
											<img src={logo[pick.awayTeam]} alt="helmet" class="w-10 h-10" />
										</a>
										{#if pick.homeTeamScore !== null && pick.homeTeamScore !== undefined && pick.awayTeamScore !== null && pick.awayTeamScore !== undefined}
											<p
												class={`${
													pick.homeTeamScore - pick.awayTeamScore > 0 ? '' : 'font-bold'
												} text-lg`}
											>
												{pick.awayTeamScore}
											</p>
										{/if}
									</div>

									<p class="font-semibold">@</p>

									<div class="flex flex-col items-center gap-2">
										<a href={`${teamLink[pick.homeTeam]}`} target="_blank" rel="noopener">
											<img src={logo[pick.homeTeam]} alt="helmet" class="w-10 h-10" />
										</a>

										{#if pick.homeTeamScore !== null && pick.homeTeamScore !== undefined && pick.awayTeamScore !== null && pick.awayTeamScore !== undefined}
											<p
												class={`${
													pick.homeTeamScore - pick.awayTeamScore > 0 ? 'font-bold' : ''
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
												class={`px-4 sm:px-6 py-2 shadow-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 rounded-sm hover:bg-slate-500 transition-all duration-300 ease-in-out hover:bg-opacity-10  hover:shadow-lg`}
											>
												Box Score
											</button>
										</a>
									{/if}

									{#if pick.highlighLink}
										<a href={pick.highlighLink} target="_blank" rel="noopener">
											<button
												class="px-4 sm:px-6 py-2 shadow-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 rounded-sm hover:bg-slate-500 transition-all duration-300 ease-in-out hover:bg-opacity-10 hover:shadow-lg"
											>
												Highlights
											</button>
										</a>
									{/if}

									{#if pick.nerdNugget}
										<button
											class={`p-1.5 transition-all duration-300 ease-in-out cursor-pointer hover:bg-gray-300 hover:bg-opacity-50 rounded-full ${
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

								<div class="flex items-center gap-x-8 sm:gap-x-4 lg:gap-x-8">
									<!-- <div class="flex flex-col items-center gap-y-2">
								<p class="">Tail</p>
								<form action="?/tailPick&id={pick.id}" method="POST">
									<button type="submit">
										<Icon
											class={`transition-all duration-300 ease-in-out fill-none ${
												$currWeek === parseInt(week) ? 'hover:fill-green-300 cursor-pointer' : ''
											}`}
											width="24px"
											height="24px"
											iconName="thumbUp"
										/>
									</button>
								</form>
								<p>{pick.tail}</p>
							</div>

							<div class="flex flex-col justify-center items-center gap-y-2">
								<p class="">Fade</p>
								<form
									on:submit|preventDefault
									action={`${$currWeek === parseInt(week) ? '?/fadePick&id={pick.id}' : ''}`}
									method={`${$currWeek === parseInt(week) ? 'POST' : ''}`}
								>
									<Icon
										class={`transition-all duration-300 ease-in-out fill-none ${
											$currWeek === parseInt(week) ? 'hover:fill-red-300 cursor-pointer' : ''
										}`}
										width="24px"
										height="24px"
										iconName="thumbDown"
									/>
								</form>
								<p>{pick.fade}</p>
							</div> -->
								</div>
							</div>
						{/key}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<Race />
</div>
