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

	$: console.log('formData', form);

	$: personData.sort((a, b) => {
		return (
			sortOrder[a.person as keyof typeof sortOrder] - sortOrder[b.person as keyof typeof sortOrder]
		);
	});

	// TODO:: indexing would be more efficeint
	// format
	// { "Big Cat": { spread: '11 - 5 -3', total: '11 - 6' } }
	const getBetTypeStats = (persona: string, type: string) => {
		const betTypeStats = typeBets.filter(
			(spread) => spread.person === persona && spread.type === type
		)[0];

		return betTypeStats.record;
	};

	// get specialBet by person
	const getSpecialBets = (persona: string) => {
		return specialBets.filter((bet) => bet.person === persona);
	};

	let showSpecialBetDetials: { person: string; indx: number } | undefined;
	let specialBetDetails: any;

	const getSpecialBetDetails = async (person: string, specialBet: string, indx: number) => {
		if (
			showSpecialBetDetials &&
			showSpecialBetDetials.person === person &&
			showSpecialBetDetials.indx === indx
		) {
			showSpecialBetDetials = undefined;
			return;
		}

		try {
			const res = await fetch(`/api/special-bet-details?person=${person}&specialBet=${specialBet}`);
			const data = await res.json();

			showSpecialBetDetials = { person, indx };

			specialBetDetails = data;
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
					<p class=" text-[16px] leading-4">
						2023 NFL Season:
						<span class="text-lg font-semibold ml-2 leading-4">{persona.record}</span>
					</p>

					<p class="text-[16px] leading-4">
						Spread:
						<span class="text-lg font-semibold ml-2 leading-4"
							>{getBetTypeStats(persona.person, 'spread')}</span
						>
					</p>

					<p class="text-[16px] leading-4">
						Totals:
						<span class="text-lg font-semibold ml-2 leading-4"
							>{getBetTypeStats(persona.person, 'totals')}</span
						>
					</p>

					{#if getSpecialBets(persona.person)}
						{#each getSpecialBets(persona.person) as bet, i}
							<div class="flex flex-row gap-4 items-center">
								<p class="text-[16px] leading-4">
									{specialBetsLabel(bet.specialBet || '')}:
									<span class="text-lg font-semibold ml-2 leading-4"
										>{bet._sum.winner} - {bet._sum.winner && bet._sum.push
											? bet._count.winner - bet._sum.winner - bet._sum.push
											: bet._sum.winner !== null
											? bet._count.winner - bet._sum.winner
											: ''}
										{bet._sum.push ? ` - ${bet._sum.push}` : ''}</span
									>
								</p>
								<button
									class=""
									on:click={() => getSpecialBetDetails(bet.person, bet.specialBet || '', i)}
								>
									<Icon
										class={`transition-all duration-300 ease-in-out fill-black cursor-pointer mt-[1px] ${
											showSpecialBetDetials &&
											showSpecialBetDetials.person === bet.person &&
											showSpecialBetDetials.indx === i
												? 'rotate-[270deg]'
												: 'rotate-[90deg]'
										}`}
										width="16px"
										height="16px"
										iconName="arrow"
									/>
								</button>
							</div>

							{#if showSpecialBetDetials && showSpecialBetDetials.person === bet.person && showSpecialBetDetials.indx === i && specialBetDetails}
								<div
									class="flex flex-col gap-y-2 ml-2"
									transition:slide={{ duration: 300, easing: quadInOut }}
								>
									{#each specialBetDetails as betDetail}
										<a href={`/2023/${betDetail.week}`}>
											<div class="flex flex-row gap-x-2">
												<p class="font-semibold mr-1">Week {betDetail.week}:</p>
												<p class="mr-1">{betDetail.description},</p>
												<p class="">{betDetail.result}</p>
											</div>
										</a>
									{/each}
								</div>
							{/if}
						{/each}
					{/if}

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
				</div>
			</div>
		{/each}
	</div>

	<Race />
</div>

<AvatarModal bind:showModal imgSrc={profilePic} />
