<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		personaAvatarPath,
		personasLabelToCamelCase,
		camelCaseToLabel
	} from '../utils/matching-format';

	$: ({ week } = $page.params);

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

	// TODO: do it by points down instead of record when small
	// TODO: figure out small way to do it
</script>

<div
	class="rounded-md border border-black border-opacity-20 shadow-lg px-4 md:px-8 py-4 md:col-span-3 flex flex-col gap-y-2 max-w-6xl overflow-x-auto"
>
	<div class="flex justify-center items-center w-full">
		<h1 class="text-xl font-semibold font-header">Race to the Stage</h1>
	</div>
	<table class="w-full">
		<tr class="">
			<th class="text-left font-paragraph" />
			{#each Array.from({ length: week && parseInt(week) < lastWeekWithData ? parseInt(week) : lastWeekWithData }, (_, i) => i + 1) as i}
				<th class="text-center pb-1">{i}</th>
			{/each}
		</tr>

		<tr>
			<th class="text-left font-semibold text-lg font-header">Main Act</th>
		</tr>

		{#each mainActWeeklyDataByPersonArr as mainActByPerson, i}
			<tr class="">
				<td
					class="flex gap-x-4 py-2 items-center border-b border-b-gray-300 border-opacity-60 shadow-sm min-w-[80px] w-[115px] md:w-full max-w-[140px]"
				>
					<a href={Object.values(mainActByPerson)[0].link} class="w-8 h-8">
						<img src={Object.values(mainActByPerson)[0].img} alt="avatar" class="rounded-full" />
					</a>
					<p>{camelCaseToLabel(Object.keys(mainActByPerson)[0])}</p>
				</td>
				{#each week ? Object.values(mainActByPerson)[0].data.slice(0, parseInt(week)) : Object.values(mainActByPerson)[0].data as weekData}
					<td
						class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 rounded-md text-center min-w-[50px]"
					>
						{weekData.record}
					</td>
				{/each}
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
					class="flex gap-x-4 py-2 items-center border-b border-b-gray-300 border-opacity-60 shadow-sm min-w-[80px] w-[115px] md:w-full max-w-[140px]"
				>
					<a href={Object.values(openerByPerson)[0].link} class="w-8 h-8">
						<img src={Object.values(openerByPerson)[0].img} alt="avatar" class="rounded-full" />
					</a>
					<p>{camelCaseToLabel(Object.keys(openerByPerson)[0])}</p>
				</td>
				{#each week ? Object.values(openerByPerson)[0].data.slice(0, parseInt(week)) : Object.values(openerByPerson)[0].data as weekData}
					<td
						class="text-xs shadow-sm bg-opacity-60 border border-gray-300 border-opacity-60 w-fit rounded-md text-center min-w-[50px]"
					>
						{weekData.record}
					</td>
				{/each}
			</tr>
		{/each}
	</table>
</div>
