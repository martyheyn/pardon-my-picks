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

	export let data: PageData;

	$: ({ typeBets, specialBets, personData } = data);

	$: console.log('personData', personData);

	$: personData.sort((a, b) => {
		return (
			sortOrder[a.person as keyof typeof sortOrder] - sortOrder[b.person as keyof typeof sortOrder]
		);
	});

	// TODO:: indexing would be more efficeint
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

	<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-6xl my-6 font-paragraph">
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
									{specialBetsLabel(bet.specialBet)}:
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
									on:click={() => getSpecialBetDetails(bet.person, bet.specialBet, i)}
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
