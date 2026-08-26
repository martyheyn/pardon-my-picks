<script lang="ts">
	import type { PageData } from './$types';
	import { fade, slide } from 'svelte/transition';

	import Icon from '$lib/components/icon.svelte';
	import { quadInOut } from 'svelte/easing';
	import { PUBLIC_CURRENT_YEAR } from '$env/static/public';

	let { data }: { data: PageData } = $props();

	let { yearsMaxWeek } = $derived(data);

	let selectedYear = $state(Number(PUBLIC_CURRENT_YEAR));

	const weekNumbers = (max: number) => Array.from({ length: max }, (_, i) => i + 1);
</script>

<div class="max-w-2xl" in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}>
	<div
		class="flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header">History</h1>
	</div>

	{#each yearsMaxWeek as yearWeek}
		<div
			class="my-4 flex flex-col gap-y-4 border border-black dark:border-white rounded-md px-4 py-2"
		>
			<div class="flex justify-between items-center">
				<h4 class="font-header text-xl">{yearWeek.year}</h4>

				<button onclick={() => (selectedYear = yearWeek.year)}>
					<Icon
						class={`${
							selectedYear === yearWeek.year ? 'rotate-[270deg]' : 'rotate-90'
						} transition-all duration-300 ease-in-out`}
						width="28px"
						height="28px"
						iconName="arrow"
					/>
				</button>
			</div>

			{#if selectedYear === yearWeek.year}
				<div class="grid grid-cols-4 gap-y-3" transition:slide={{ duration: 300 }}>
					{#each weekNumbers(yearWeek._max.week ? yearWeek._max.week : 18) as weekNum}
						<div class="font-paragraph dark:text-blue-100 hover:text-darkMuteTextColor">
							<a href={`${yearWeek.year}/${weekNum}`}>
								Week {weekNum}
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
