<script lang="ts">
	import type { PageData } from './$types';
	import {
		personasLabelToslug,
		personaAvatarPath,
		sortOrder,
		specialBetsLabel
	} from '$lib/utils/matching-format';
	import Race from '$lib/components/race.svelte';
	import AvatarModal from '$lib/components/avatar-modal.svelte';
	import { fade, slide } from 'svelte/transition';
	import { linear, quadInOut } from 'svelte/easing';
	import Icon from '$lib/components/icon.svelte';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form;

	$: ({ typeBets, specialBets, personData } = form || data);

	$: personData.sort((a, b) => {
		return (
			sortOrder[a.person as keyof typeof sortOrder] - sortOrder[b.person as keyof typeof sortOrder]
		);
	});

	const tableHeaders = ['2023 NFL Season', 'Spread', 'Totals'];

	// TODO:: indexing would be more efficeint
	// format
	// { "Big Cat": { spread: '11 - 5 -3', total: '11 - 6' } }
	const getBetTypeStats = (persona: string, type: string) => {
		const betTypeStats = typeBets.filter(
			(spread) => spread.person === persona && spread.type === type
		)[0];

		return betTypeStats.record;
	};

	let specialBetOpen: string | undefined = undefined;
	type SpecialBet = {
		[person: string]: {
			specialBet: string;
			wins: number;
			pushes: number;
			totalGames: number;
		}[];
	};

	// want this indexed so it can be easily accessed in the loop for jsx
	$: specialBetsData = specialBets.reduce((acc: SpecialBet, bet: any) => {
		const { person } = bet;
		acc[person] = acc[person] || [];
		const betData = {
			specialBet: bet.specialBet,
			wins: bet._sum.winner,
			pushes: bet._sum.push,
			totalGames: bet._count.winner
		};
		acc[person].push(betData);
		return acc;
	}, {});

	$: console.log(specialBetsData);

	const getSpecialBetDetails = async (person: string, specialBet: string) => {
		console.log(person, specialBet);
		try {
			const res = await fetch(`/api/special-bet-details?person=${person}&specialBet=${specialBet}`);
			const data: {
				description: string;
				person: string;
				result: string;
				week: number;
			}[] = await res.json();

			console.log(data);

			return data;
		} catch (err) {
			console.error(err);
		}
	};

	// modal
	let showModal = false;
	let profilePic = '';

	// dropdown selector for stat aggregation
	enum StatHeaders {
		CURR_YEAR = '2023 NFL Season Stats',
		ALLTIME = 'All Time Stats',
		PREV_2023 = '2022 NFL Season Stats'
	}
	let selectedStat: StatHeaders = StatHeaders.CURR_YEAR;
	const selectStatHeaders: StatHeaders[] = [
		StatHeaders.CURR_YEAR,
		StatHeaders.ALLTIME,
		StatHeaders.PREV_2023
	];
	let dropdownOpen = false;
</script>

<svelte:head>
	<title>Pardon My Picks - Stats</title>
</svelte:head>

<div
	class=""
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
	<div
		class="flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header">Sabermetrics</h1>
	</div>

	<div
		class="mt-2 text-lg rounded-md border border-black border-opacity-20
		dark:border-white dark:border-opacity-100 shadow-lg w-fit
		transition-all duration-300 ease-in-out"
	>
		<button
			class={`w-full transition-all duration-300 ease-in-out py-2 pl-4 pr-2 flex gap-x-3 
			justify-between border border-black border-opacity-20 group cursor-auto`}
		>
			<h2 class="">{selectedStat}</h2>
			<button
				class={`transition-all duration-300 ease-in-out opacity-0 -translate-y-2 
				group-hover:opacity-100 group-hover:translate-y-0 cursor-pointer`}
				on:click={() => (dropdownOpen = !dropdownOpen)}
			>
				<Icon
					class={`${
						dropdownOpen ? 'rotate-[270deg]' : 'rotate-90'
					} transition-all duration-300 ease-in-out`}
					width="28px"
					height="28px"
					iconName="arrow"
				/>
			</button>
		</button>
		{#if dropdownOpen}
			<div
				class={`transition-all duration-300 ease-in-out	flex flex-col text-left`}
				transition:slide={{ duration: 300 }}
			>
				{#each selectStatHeaders.filter((stat) => stat !== selectedStat) as stat}
					<form action="" method="POST" use:enhance class="w-full">
						<button
							class="w-full text-left py-2 px-4 border border-black border-opacity-20
							hover:bg-gray-200 transition-all duration-300 ease-in-out"
							type="submit"
							on:click={() => (selectedStat = stat)}>{stat}</button
						>
						<input type="hidden" name="year" id="year" value={selectedStat} />
					</form>
				{/each}
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-6xl mt-4 mb-6 font-paragraph">
		{#each personData as persona}
			<div
				class="rounded-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 shadow-lg p-6 flex flex-col gap-y-2"
				id={personasLabelToslug(persona.person)}
			>
				<div class="flex justify-between items-start">
					<a
						href="/stats/{personasLabelToslug(persona.person)}"
						class="text-2xl hover:text-gray-600 transition duration-200 ease-in-out cursor-pointer"
					>
						{persona.person}
					</a>
					<button
						on:click={() => {
							showModal = true;
							profilePic = personaAvatarPath(persona.person);
						}}
					>
						<img
							src={personaAvatarPath(persona.person)}
							alt="avatar"
							class="w-16 h-16 rounded-full"
						/>
					</button>
				</div>

				<div class="flex flex-col gap-y-[10px]">
					<p
						class={`text-4xl [text-shadow:1px_1px_1px_gray] dark:[text-shadow:1px_1px_1px_white] mb-1 ${
							parseFloat(persona.record_pct) > 50
								? 'text-green-500 dark:text-green-300'
								: parseFloat(persona.record_pct) < 50
								? 'text-red-500 dark:text-red-300'
								: 'text-yellow-500 dark:text-yellow-300'
						}`}
					>
						{parseFloat(persona.record_pct).toFixed(1)}%
					</p>

					<div class="w-full overflow-x-auto rounded-md">
						<table
							class="w-full text-sm text-left rtl:text-right text-gray-600
						dark:text-gray-300"
						>
							<thead
								class="text-xs text-gray-700 uppercase bg-gray-200
								dark:bg-gray-700 dark:text-gray-400"
							>
								<tr>
									{#each tableHeaders as header}
										<th scope="col" class="font-extrabold px-4 py-3">{header}</th>
									{/each}
									{#if specialBetsData[persona.person]}
										<th scope="col" class="font-extrabold px-4 py-3">Special Bets</th>
									{/if}
									{#if parseInt(persona.total_tails) > 0}
										<th scope="col" class="font-extrabold px-4 py-3">Tails</th>
									{/if}
									{#if parseInt(persona.total_fades) > 0}
										<th scope="col" class="font-extrabold px-4 py-3">Fades</th>
									{/if}
								</tr>
							</thead>
							<tbody>
								<tr
									class="w-full odd:bg-white odd:dark:bg-gray-900 even:bg-gray-200
							 	even:dark:bg-gray-800 border-b dark:border-gray-700 text-xs"
								>
									<th
										scope="row"
										class="min-w-[82px] px-4 py-3 font-medium text-black
										whitespace-nowrap dark:text-white border">{persona.record}</th
									>
									<td class="min-w-[82px] px-4 py-3 border"
										>{getBetTypeStats(persona.person, 'spread')}</td
									>
									<td class="min-w-[82px] px-4 py-3 border"
										>{getBetTypeStats(persona.person, 'totals')}</td
									>
									{#if specialBetsData[persona.person]}
										<td
											class="min-w-[82px] px-4 py-3 cursor-pointer hover:bg-gray-100 hover:text-gray-700
											dark:hover:bg-gray-700 transition-all duration-300 ease-in-out border"
											on:click={() => (specialBetOpen = persona.person)}
										>
											{specialBetsData[persona.person].reduce((acc, obj) => acc + obj.wins, 0)} -
											{specialBetsData[persona.person].reduce(
												(acc, obj) => acc + obj.totalGames,
												0
											) -
												specialBetsData[persona.person].reduce((acc, obj) => acc + obj.wins, 0) -
												specialBetsData[persona.person].reduce((acc, obj) => acc + obj.pushes, 0)}
											{specialBetsData[persona.person].reduce((acc, obj) => acc + obj.pushes, 0)
												? ` - ${specialBetsData[persona.person].reduce(
														(acc, obj) => acc + obj.pushes,
														0
												  )}`
												: ''}
										</td>
									{/if}
								</tr>
							</tbody>
						</table>
					</div>

					{#if specialBetOpen === persona.person}
						<div transition:slide={{ duration: 300 }}>
							<div class="flex flex-row justify-between mt-2 px-1">
								<h2 class="text-md">Special Bets</h2>
								<button class="pr-3" on:click={() => (specialBetOpen = undefined)}>I</button>
							</div>
							<div class="w-full overflow-x-auto rounded-md">
								<table
									class="w-full text-sm text-left rtl:text-right text-gray-600
							dark:text-gray-300"
								>
									<thead
										class="text-xs text-gray-700 uppercase bg-gray-200
								dark:bg-gray-700 dark:text-gray-400"
									>
										<th scope="col" class="font-extrabold px-4 py-3">Special Bet</th>
										<th scope="col" class="font-extrabold px-4 py-3">Record</th>
										<th scope="col" class="font-extrabold px-4 py-3">Results</th>
									</thead>
									<tbody>
										{#each specialBetsData[persona.person] as bet}
											<tr
												class="w-full odd:bg-white odd:dark:bg-gray-900 even:bg-gray-100
							 				even:dark:bg-gray-800 border-b dark:border-gray-700 text-xs"
											>
												<th
													scope="row"
													class="min-w-[82px] px-4 py-3 font-medium text-black
										whitespace-nowrap dark:text-white border">{bet.specialBet}</th
												>
												<td class="min-w-[82px] px-4 py-3 border font-semibold"
													>{bet.wins} -
													{bet.totalGames - bet.wins - bet.pushes}
													{bet.pushes ? `- ${bet.pushes}` : ''}</td
												>
												<td class="min-w-[82px] px-4 py-3 border">
													{#await getSpecialBetDetails(persona.person, bet.specialBet)}
														<p>...Loading</p>
													{:then data}
														{#if data}
															<div class="flex flex-col gap-y-4">
																{#each data as betDetail}
																	<div
																		class="w-full flex justify-between items-center gap-x-4 text-xs"
																	>
																		<p class="w-1/3 font-semibold">{betDetail.description}</p>
																		<p class="w-2/3">
																			Week {betDetail.week}: {betDetail.result}
																		</p>
																	</div>
																{/each}
															</div>
														{/if}
													{:catch error}
														<p>Error: {error.message}</p>
													{/await}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- 

					{#if parseInt(persona.total_tails) > 0}
						<div class="flex gap-x-4">
							<p class=" text-[16px] leading-4">
								# of times Tailed:
								<span class="text-lg font-semibold ml-2 leading-4">{persona.total_tails}</span>
							</p>
							<p class=" text-[16px] leading-4">
								Tail win %:
								<span
									class={`text-lg font-semibold ml-2 leading-4 ${
										parseInt(persona.tails_pct) > 50
											? 'text-green-500 dark:text-green-300'
											: parseInt(persona.tails_pct) < 50
											? 'text-red-500 dark:text-red-300'
											: 'text-yellow-500 dark:text-yellow-300'
									}`}>{persona.tails_pct}{persona.tails_pct !== 'NaN' ? '%' : ''}</span
								>
							</p>
						</div>
					{/if}

					{#if parseInt(persona.total_fades) > 0}
						<div class="flex gap-x-4">
							<p class=" text-[16px] leading-4">
								# of times Faded:
								<span class="text-lg font-semibold ml-2 leading-4">{persona.total_fades}</span>
							</p>
							<p class=" text-[16px] leading-4">
								Fade win %:
								<span
									class={`text-lg font-semibold ml-2 leading-4 ${
										parseInt(persona.fades_pct) > 50
											? 'text-green-500 dark:text-green-300'
											: parseInt(persona.fades_pct) < 50
											? 'text-red-500 dark:text-red-300'
											: 'text-yellow-500 dark:text-yellow-300'
									}`}>{persona.fades_pct}{persona.fades_pct !== 'NaN' ? '%' : ''}</span
								>
							</p>
						</div>
					{/if}
					-->
				</div>
			</div>
		{/each}
	</div>

	<Race />
</div>

<AvatarModal bind:showModal imgSrc={profilePic} />
