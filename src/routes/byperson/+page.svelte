<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { personasLabelToslug, personaAvatarPath, sortOrder } from '../../utils/matching-format';
	import Race from '../../components/race.svelte';
	import AvatarModal from '../../components/avatar-modal.svelte';
	import { fade } from 'svelte/transition';
	import { linear, quadInOut } from 'svelte/easing';

	// const currWeek: Writable<number> = getContext('currWeek');

	// pass the currWeek as a param to the server
	// onMount(async () => {
	// 	if (!$currWeek || $currWeek < 1) return;
	// 	const response = await fetch(`api/byperson?currWeek=${$currWeek}`);
	// 	const data = await response.json();
	// 	console.log(data);
	// });

	export let data: PageData;

	$: ({ personas, spreads } = data);

	$: personas.sort((a, b) => {
		return (
			sortOrder[a.person as keyof typeof sortOrder] - sortOrder[b.person as keyof typeof sortOrder]
		);
	});

	// click in to get weekly stats
	const getBetTypeStats = (persona: string, type: string) => {
		const betTypeStats = spreads.filter(
			(spread) => spread.person === persona && spread.type === type
		)[0];

		return `${betTypeStats._sum.winner} - ${
			betTypeStats._sum.winner && betTypeStats._count.winner - betTypeStats._sum.winner
		} - ${betTypeStats._sum.push}
		`;
	};

	const getRecordPct = (persona: {
		_sum: {
			winner: number | null;
			push: number | null;
			fade: number | null;
			tail: number | null;
		};
		_count: {
			winner: number;
		};
	}) => {
		return parseFloat(
			`${
				persona._sum.winner && persona._sum.push
					? (persona._sum.winner / (persona._count.winner - persona._sum.push)) * 100
					: persona._sum.winner
					? (persona._sum.winner / persona._count.winner) * 100
					: ''
			}`
		);
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
		<h1 class="font-header">By Person</h1>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-6xl my-6 font-paragraph">
		{#each personas as persona}
			<div
				class="rounded-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 shadow-lg p-6 flex flex-col gap-y-2"
				id={personasLabelToslug(persona.person)}
			>
				<div class="flex justify-between items-start">
					<a
						href="/byperson/{personasLabelToslug(persona.person)}"
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

				<div class="flex flex-col gap-y-2">
					<p
						class={`text-4xl [text-shadow:1px_1px_1px_gray] dark:[text-shadow:1px_1px_1px_white] mb-1 ${
							getRecordPct(persona) > 50
								? 'text-green-500 dark:text-green-300'
								: getRecordPct(persona) < 50
								? 'text-red-500 dark:text-red-300'
								: 'text-yellow-500 dark:text-yellow-300'
						}`}
					>
						{getRecordPct(persona).toFixed(1)}%
					</p>
					<p class=" text-[16px] leading-4">
						2023 NFL Season:
						<span class="text-lg font-semibold ml-2 leading-4"
							>{persona._sum.winner} - {persona._sum.winner && persona._sum.push
								? persona._count.winner - persona._sum.winner - persona._sum.push
								: persona._sum.winner
								? persona._count.winner - persona._sum.winner
								: ''}
							{persona._sum.push ? ` - ${persona._sum.push}` : ''}</span
						>
					</p>

					<p class=" text-[16px] leading-4">
						Spread:
						<span class="text-lg font-semibold ml-2 leading-4"
							>{getBetTypeStats(persona.person, 'spread')}</span
						>
					</p>

					<p class=" text-[16px] leading-4">
						Totals:
						<span class="text-lg font-semibold ml-2 leading-4"
							>{getBetTypeStats(persona.person, 'totals')}</span
						>
					</p>

					<!-- <div class="flex gap-x-4">
						<p class=" text-[16px] leading-4">
							Tailed:
							<span class="text-lg font-semibold ml-2 leading-4">{persona._sum.tail}</span>
						</p>
						<p class=" text-[16px] leading-4">
							Faded:
							<span class="text-lg font-semibold ml-2 leading-4">{persona._sum.fade}</span>
						</p>
					</div> -->
				</div>
			</div>
		{/each}
	</div>

	<Race />
</div>

<AvatarModal bind:showModal imgSrc={profilePic} />
