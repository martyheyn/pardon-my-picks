<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fly, slide } from 'svelte/transition';
	import { quadInOut } from 'svelte/easing';

	import {
		personaAvatarPath,
		personasLabelToCamelCase,
		camelCaseToLabel
	} from '../utils/matching-format';
	import type { Writable } from 'svelte/store';

	import Icon from './icon.svelte';

	$: ({ week } = $page.params);

	let screenWidth: Writable<number> = getContext('screenWidth');

	type weeklyPersonDataType = {
		[key: string]: {
			img: string;
			link: string;
			data: any[];
		};
	};

	let weeklyDataByPerson: weeklyPersonDataType = {
		bigCat: {
			img: personaAvatarPath('Big Cat'),
			link: '/byperson/#big-cat',
			data: []
		},
		pft: {
			img: personaAvatarPath('PFT'),
			link: '/byperson/#pft-commenter',
			data: []
		},
		hank: {
			img: personaAvatarPath('Hank'),
			link: '/byperson/#handsome-hank',
			data: []
		},
		jake: {
			img: personaAvatarPath('Jake'),
			link: '/byperson/#cake-marsh',
			data: []
		},
		max: {
			img: personaAvatarPath('Max'),
			link: '/byperson/#bat-girl',
			data: []
		},
		memes: {
			img: personaAvatarPath('Memes'),
			link: '/byperson/#memes',
			data: []
		}
	};

	type resWeeklyDataByPersonType = {
		person: string;
		week: number;
		_count: {
			winner: number;
		};
		_sum: {
			push: number;
			winner: number;
		};
	};

	let mainActWeeklyDataByPersonArr: weeklyPersonDataType[] = [];
	let mainActVar: weeklyPersonDataType[] = [];
	let openerWeeklyDataByPersonArr: weeklyPersonDataType[] = [];
	let openerVar: weeklyPersonDataType[] = [];
	let lastWeekWithData: number;

	onMount(async () => {
		const response = await fetch(`/api/race-results`);
		let data: resWeeklyDataByPersonType[] = await response.json();
		// console.log(data);

		if (data) {
			data.forEach((x) => {
				// add the previous week's record to the current week
				// TODO: could be a reduce function

				let wins =
					x.week === 1
						? x._sum.winner
						: x._sum.winner +
						  weeklyDataByPerson[personasLabelToCamelCase(x.person)].data[x.week - 2].wins;
				let losses =
					x.week === 1
						? x._count.winner - x._sum.winner - x._sum.push
						: x._count.winner -
						  (x._sum.winner + x._sum.push) +
						  weeklyDataByPerson[personasLabelToCamelCase(x.person)].data[x.week - 2].losses;
				let pushes =
					x.week === 1
						? x._sum.push
						: x._sum.push +
						  weeklyDataByPerson[personasLabelToCamelCase(x.person)].data[x.week - 2].pushes;
				let record = `${wins}-${losses}-${pushes}`;

				let recordByWeek = {
					week: x.week,
					wins: wins,
					losses: losses,
					pushes: pushes,
					record: record
				};

				weeklyDataByPerson[personasLabelToCamelCase(x.person)].data.push(recordByWeek);
			});
		}

		for (const x in weeklyDataByPerson) {
			if (x === 'bigCat' || x === 'pft' || x === 'hank') {
				mainActVar.push({ [x]: weeklyDataByPerson[x] });
			} else {
				openerVar.push({ [x]: weeklyDataByPerson[x] });
			}
		}

		// for some reason I have to assign this and push it into an array for it to be reactive in the HTML
		mainActWeeklyDataByPersonArr = mainActVar;
		openerWeeklyDataByPersonArr = openerVar;
		lastWeekWithData = mainActWeeklyDataByPersonArr[0].bigCat.data.length;
	});

	let dataExpanded = false;

	// when screen width gets below, reset dataExpanded reset to false
	$: if ($screenWidth < 600) {
		dataExpanded = false;
	} else {
		dataExpanded = true;
	}

	// TODO: do it by points down instead of record when small
</script>

<div
	class="rounded-md border border-black border-opacity-20 dark:border-white dark:border-opacity-100 shadow-lg px-4 md:px-8 py-4 md:col-span-3 flex flex-col gap-y-2 max-w-6xl overflow-x-auto"
>
	<div class="flex justify-center items-center w-full">
		<h1 class="text-xl font-semibold font-header">Race to the Stage</h1>
	</div>
	<table class="w-full">
		<tr class="">
			<th class="text-left font-paragraph" />
			{#if $screenWidth < 600}
				<th class="text-center pb-1" />
			{/if}

			{#each Array.from({ length: week && parseInt(week) < lastWeekWithData ? parseInt(week) : !dataExpanded ? 1 : lastWeekWithData }, (_, i) => i + 1) as i}
				<th class="text-center pb-1">{i}</th>
			{/each}
		</tr>

		<tr>
			<th class="text-left font-semibold text-lg font-header">Main Act</th>
		</tr>

		{#each mainActWeeklyDataByPersonArr as mainActByPerson, i}
			<tr class="">
				<td
					class="flex gap-x-4 py-2 items-center border-b border-b-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 shadow-sm min-w-[80px] w-[115px] md:w-full max-w-[140px]"
				>
					<a href={Object.values(mainActByPerson)[0].link} class="w-8 h-8">
						<img src={Object.values(mainActByPerson)[0].img} alt="avatar" class="rounded-full" />
					</a>
					<p>{camelCaseToLabel(Object.keys(mainActByPerson)[0])}</p>
				</td>

				{#if $screenWidth < 600 && !dataExpanded}
					<td
						class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] cursor-pointer hover:font-bold transition-bold duration-200 ease-out"
						on:click={() => (dataExpanded = true)}>. . .</td
					>
				{:else if $screenWidth < 600 && dataExpanded}
					<td
						class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]"
						on:click={() => (dataExpanded = false)}
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-black cursor-pointer rotate-[180deg] w-full flex justify-center`}
							width="24px"
							height="24px"
							iconName="arrow"
						/>
					</td>
				{/if}

				{#if dataExpanded}
					{#each week ? Object.values(mainActByPerson)[0].data.slice(0, parseInt(week)) : Object.values(mainActByPerson)[0].data as weekData}
						<td
							class={`text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]`}
							transition:fly={{ duration: 300, x: 100, easing: quadInOut }}
						>
							{weekData.record}
						</td>
					{/each}
				{:else}
					{#each Object.values(mainActByPerson)[0].data.slice(Object.values(mainActByPerson)[0].data.length - 1, Object.values(mainActByPerson)[0].data.length) as weekData}
						<td
							class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]"
							transition:fly={{ duration: 300, x: 100, easing: quadInOut }}
						>
							{weekData.record}
						</td>
					{/each}
				{/if}
			</tr>
		{/each}
	</table>

	<table class="w-full mb-2">
		<tr>
			<th class="text-left font-semibold text-lg font-header whitespace-nowrap">Opening Act</th>
		</tr>

		{#each openerWeeklyDataByPersonArr as openerByPerson, i}
			<tr class="">
				<td
					class="flex gap-x-4 py-2 items-center border-b border-b-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 shadow-sm min-w-[80px] w-[115px] md:w-full max-w-[140px]"
				>
					<a href={Object.values(openerByPerson)[0].link} class="w-8 h-8">
						<img src={Object.values(openerByPerson)[0].img} alt="avatar" class="rounded-full" />
					</a>
					<p>{camelCaseToLabel(Object.keys(openerByPerson)[0])}</p>
				</td>

				{#if $screenWidth < 600 && !dataExpanded}
					<td
						class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] cursor-pointer hover:font-bold transition-bold duration-200 ease-out"
						on:click={() => (dataExpanded = true)}>. . .</td
					>
				{:else if $screenWidth < 600 && dataExpanded}
					<td
						class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]"
						on:click={() => (dataExpanded = false)}
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-black cursor-pointer rotate-[180deg] w-full flex justify-center`}
							width="24px"
							height="24px"
							iconName="arrow"
						/>
					</td>
				{/if}

				{#if dataExpanded}
					{#each week ? Object.values(openerByPerson)[0].data.slice(0, parseInt(week)) : Object.values(openerByPerson)[0].data as weekData}
						<td
							class={`text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]`}
							transition:fly={{ duration: 300, x: 100, easing: quadInOut }}
						>
							{weekData.record}
						</td>
					{/each}
				{:else}
					{#each Object.values(openerByPerson)[0].data.slice(Object.values(openerByPerson)[0].data.length - 1, Object.values(openerByPerson)[0].data.length) as weekData}
						<td
							class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]"
							transition:fly={{ duration: 300, x: 100, easing: quadInOut }}
						>
							{weekData.record}
						</td>
					{/each}
				{/if}
			</tr>
		{/each}
	</table>
</div>
