<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';

	import { camelCaseToLabel } from '../utils/matching-format';
	import type { Writable } from 'svelte/store';

	import Icon from './icon.svelte';
	import type { weeklyPersonDataType } from '../../routes/api/race-results/+server';

	let { raceYear: raceYearProp }: { raceYear: number | undefined } = $props();

	let { week, year } = $derived($page.params);
	let raceYear = $derived(year ? Number(year) : raceYearProp);

	let screenWidth: Writable<number> = getContext('screenWidth');

	let mainActWeeklyDataByPersonArr: weeklyPersonDataType[] = $state([]);
	let mainActVar: weeklyPersonDataType[] = [];
	let openerWeeklyDataByPersonArr: weeklyPersonDataType[] = $state([]);
	let openerVar: weeklyPersonDataType[] = [];
	let fullGroupData: weeklyPersonDataType[] = $state([]);
	let groupVar: weeklyPersonDataType[] = [];
	let lastWeekWithData: number = $state(0);

	const getRaceData = async (weekParam: string | undefined, raceYearParam: number | undefined) => {
		mainActVar = [];
		openerVar = [];
		groupVar = [];

		let data: weeklyPersonDataType;
		try {
			const response = await fetch(`/api/race-results?week=${weekParam}&year=${raceYearParam}`);
			data = await response.json();
		} catch (err) {
			console.error('Failed to fetch race results:', err);
			return;
		}

		if (raceYearParam === 2023) {
			for (const x in data) {
				if (x === 'bigCat' || x === 'pft' || x === 'hank') {
					mainActVar.push({ [x]: data[x] });
				} else {
					openerVar.push({ [x]: data[x] });
				}
			}

			// for some reason I have to assign this and push it into an array for it to be reactive in the HTML
			mainActWeeklyDataByPersonArr = mainActVar;
			openerWeeklyDataByPersonArr = openerVar;

			// TODO: Make this more dynamic
			// had to change it because Max & Memes picked
			if (openerWeeklyDataByPersonArr.length < 3) return;
			lastWeekWithData =
				openerWeeklyDataByPersonArr[0][Object.keys(openerWeeklyDataByPersonArr[0])[0]].data.length;
		} else {
			for (const x in data) {
				groupVar.push({ [x]: data[x] });
			}
			fullGroupData = groupVar;

			// had to change it because Max & Memes picked
			if (fullGroupData.length < 3) return;
			lastWeekWithData = fullGroupData[0][Object.keys(fullGroupData[0])[0]].data.length;
		}
	};

	let dataExpanded = $state(true);

	// when screen width gets below, reset dataExpanded reset to false
	$effect(() => {
		if ($screenWidth < 600 && week > '2') {
			dataExpanded = false;
		} else {
			dataExpanded = true;
		}
	});

	$effect(() => {
		getRaceData(week, raceYear);
	});
</script>

{#if Number(week) > 1}
	<div
		class="flex flex-col gap-y-2 max-w-6xl overflow-x-auto rounded-md border border-black
	border-opacity-20 dark:border-white dark:border-opacity-100 shadow-lg px-4 md:px-8 py-4 md:col-span-3"
	>
		<div class="flex flex-col justify-center items-center w-full">
			<h1 class="text-xl font-semibold font-header">
				{raceYear === 2024 ? '4 Weddings and a Funeral' : 'Race to the Bottom'}
				<span class="ml-1.5">{raceYear}</span>
			</h1>
		</div>

		{#if raceYear === 2023}
			<table class="w-full">
				<caption
					class={`text-lg font-semibold font-header mt-2 mb-4 ${
						dataExpanded ? 'text-center mr-0' : 'text-right mr-12'
					}`}>Week</caption
				>
				<thead>
					<tr class="">
						<th class="text-left font-paragraph"></th>
						{#if $screenWidth < 600}
							<th class="text-center pb-1"></th>
						{/if}

						{#each !dataExpanded && week ? [week] : !dataExpanded && !week ? [lastWeekWithData] : Array.from({ length: week && parseInt(week) < lastWeekWithData ? parseInt(week) : lastWeekWithData }, (_, i) => i + 1) as i}
							<th class="text-center pb-1 min-w-[50px]">{i}</th>
						{/each}
					</tr>
				</thead>

				<tbody>
					<tr>
						<th class="text-left font-semibold text-lg font-header">Main Act</th>
					</tr>

					{#each mainActWeeklyDataByPersonArr as mainActByPerson}
						<tr class="">
							<td
								class="flex gap-x-2 py-2 items-center shadow-sm w-[120px] text-xs sm:text-base
					border-b border-b-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100"
							>
								<a href={Object.values(mainActByPerson)[0].link} class="w-8 h-8">
									<img
										src={Object.values(mainActByPerson)[0].img}
										alt="avatar"
										class="rounded-full"
									/>
								</a>
								<p class="">{camelCaseToLabel(Object.keys(mainActByPerson)[0])}</p>
							</td>

							{#if $screenWidth < 600 && !dataExpanded}
								<td
									class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100
							 rounded-md text-center min-w-[50px] cursor-pointer hover:font-bold transition-bold duration-200 ease-out"
									onclick={() => (dataExpanded = true)}>. . .</td
								>
							{:else if $screenWidth < 600 && dataExpanded}
								<td
									class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100
							 rounded-md text-center min-w-[50px] max-w-[52px]"
									onclick={() => (dataExpanded = false)}
								>
									<Icon
										class={`transition-all duration-300 ease-in-out fill-black cursor-pointer w-full flex justify-center hover:scale-110`}
										width="24px"
										height="24px"
										iconName="arrow"
									/>
								</td>
							{/if}

							{#if dataExpanded}
								{#each week ? Object.values(mainActByPerson)[0].data.slice(0, week ? parseInt(week) : lastWeekWithData) : Object.values(mainActByPerson)[0].data as weekData}
									<td
										class={`text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] max-w-[52px] transition-all duration-300 ease-in-out`}
									>
										<p class="py-[2px] font-semibold">{weekData.points}</p>
										<p class="py-[2px]">{weekData.record}</p>
									</td>
								{/each}
							{:else}
								{#each Object.values(mainActByPerson)[0].data.slice(week ? parseInt(week) - 1 : lastWeekWithData - 1, week ? parseInt(week) : lastWeekWithData) as weekData}
									<td
										class={`text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]`}
									>
										<p class="py-[2px] font-semibold">{weekData.points}</p>
										<p class="py-[2px]">{weekData.record}</p>
									</td>
								{/each}
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>

			<table class="w-full mb-2">
				<tbody>
					<tr>
						<th class="text-left font-semibold text-lg font-header whitespace-nowrap"
							>Opening Act</th
						>
					</tr>

					{#each openerWeeklyDataByPersonArr as openerByPerson}
						<tr class="">
							<td
								class="flex gap-x-4 py-2 items-center border-b border-b-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 shadow-sm w-[120px]"
							>
								<a href={Object.values(openerByPerson)[0].link} class="w-8 h-8">
									<img
										src={Object.values(openerByPerson)[0].img}
										alt="avatar"
										class="rounded-full"
									/>
								</a>
								<p>{camelCaseToLabel(Object.keys(openerByPerson)[0])}</p>
							</td>

							{#if $screenWidth < 600 && !dataExpanded}
								<td
									class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] cursor-pointer hover:font-bold transition-bold duration-200 ease-out"
									onclick={() => (dataExpanded = true)}>. . .</td
								>
							{:else if $screenWidth < 600 && dataExpanded}
								<td
									class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] max-w-[52px]"
									onclick={() => (dataExpanded = false)}
								>
									<Icon
										class={`transition-all duration-300 ease-in-out fill-black cursor-pointer w-full flex justify-center hover:scale-110`}
										width="24px"
										height="24px"
										iconName="arrow"
									/>
								</td>
							{/if}

							{#if dataExpanded}
								{#each week ? Object.values(openerByPerson)[0].data.slice(0, week ? parseInt(week) : lastWeekWithData) : Object.values(openerByPerson)[0].data as weekData}
									<td
										class={`text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]`}
									>
										<p class="py-[2px] font-semibold">{weekData.points}</p>
										<p class="py-[2px]">{weekData.record}</p>
									</td>
								{/each}
							{:else}
								{#each Object.values(openerByPerson)[0].data.slice(week ? parseInt(week) - 1 : lastWeekWithData - 1, week ? parseInt(week) : lastWeekWithData) as weekData}
									<td
										class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] max-w-[52px]"
									>
										<p class="py-[2px] font-semibold">{weekData.points}</p>
										<p class="py-[2px]">{weekData.record}</p>
									</td>
								{/each}
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		{#if raceYear !== 2023}
			<table class="w-full mb-2">
				<caption
					class={`text-lg font-semibold font-header mt-2 mb-4 ${
						dataExpanded ? 'text-center mr-0' : 'text-right mr-12'
					}`}>Week</caption
				>
				<thead>
					<tr class="">
						<th class="text-left font-paragraph"></th>
						{#if $screenWidth < 600}
							<th class="text-center pb-1"></th>
						{/if}

						{#each !dataExpanded && week ? [lastWeekWithData] : Array.from({ length: week && parseInt(week) < lastWeekWithData ? parseInt(week) : lastWeekWithData }, (_, i) => i + 1) as i}
							<th class="text-center pb-1 min-w-[50px]">{i}</th>
						{/each}
						<th class="text-center pb-2"></th>
					</tr>
				</thead>

				<tbody>
					{#each fullGroupData as personRecord}
						<tr class="">
							<td
								class="flex gap-x-4 py-2 items-center border-b border-b-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 shadow-sm w-[120px]"
							>
								<a href={Object.values(personRecord)[0].link} class="w-8 h-8">
									<img src={Object.values(personRecord)[0].img} alt="avatar" class="rounded-full" />
								</a>
								<p>{camelCaseToLabel(Object.keys(personRecord)[0])}</p>
							</td>

							{#if Number(week) > 2}
								{#if $screenWidth < 600 && !dataExpanded}
									<td
										class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] cursor-pointer hover:font-bold transition-bold duration-200 ease-out"
										onclick={() => (dataExpanded = true)}>. . .</td
									>
								{:else if $screenWidth < 600 && dataExpanded}
									<td
										class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] max-w-[52px]"
										onclick={() => (dataExpanded = false)}
									>
										<Icon
											class={`transition-all duration-300 ease-in-out fill-black cursor-pointer w-full flex justify-center hover:scale-110`}
											width="24px"
											height="24px"
											iconName="arrow"
										/>
									</td>
								{/if}
							{/if}

							{#if dataExpanded}
								{#each week ? Object.values(personRecord)[0].data.slice(0, week ? parseInt(week) : lastWeekWithData) : Object.values(personRecord)[0].data as weekData}
									<td
										class={`text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px]`}
									>
										<p class="py-[2px] font-semibold">{weekData.points}</p>
										<p class="py-[2px]">{weekData.record}</p>
									</td>
								{/each}
							{:else}
								{#each [Object.values(personRecord)[0].data[lastWeekWithData - 1]] as weekData}
									<td
										class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 dark:border-white dark:border-opacity-100 rounded-md text-center min-w-[50px] max-w-[52px]"
									>
										<p class="py-[2px] font-semibold">{weekData.points}</p>
										<p class="py-[2px]">{weekData.record}</p>
									</td>
								{/each}
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{/if}
