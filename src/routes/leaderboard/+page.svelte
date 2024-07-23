<script lang="ts">
	import type { PageData } from './$types';
	import { linear, quadInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	export let data: PageData;

	$: console.log(data);

	let selectedStats = 'wins';
</script>

<div
	class=""
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
	<div
		class="hidden md:flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header">Leaderboard</h1>
	</div>

	<div class="card px-0 xs:my-2 md:my-4">
		<div class="border-b dark:border-white dark:border-opacity-100 text-center pt-3">
			<h2 class="text-2xl font-header mb-4">Leaderboard</h2>

			<div class="grid grid-cols-3 mt-2">
				<button
					class={`w-full h-full hover:bg-darkHover transition-all duration-300 ease-in-out
                     cursor-pointer py-4 rounded-md ${
												selectedStats === 'wins'
													? 'text-blue-200 underline underline-offset-4 bg-darkHover'
													: 'text-white'
											}`}
					on:click={() => (selectedStats = 'wins')}
				>
					Wins
				</button>
				<button
					class={`w-full h-full hover:bg-darkHover transition-all duration-300 ease-in-out
                     cursor-pointer py-4 rounded-md ${
												selectedStats === 'tails'
													? 'text-blue-200 underline underline-offset-4 bg-darkHover'
													: 'text-white'
											}`}
					on:click={() => (selectedStats = 'tails')}
				>
					Tails
				</button>
				<button
					class={`w-full h-full hover:bg-darkHover transition-all duration-300 ease-in-out
                     cursor-pointer py-4 rounded-md ${
												selectedStats === 'fades'
													? 'text-blue-200 underline underline-offset-4 bg-darkHover'
													: 'text-white'
											}`}
					on:click={() => (selectedStats = 'fades')}
				>
					Fades
				</button>
			</div>
		</div>

		<div class="my-2 mx-4 flex justify-center items-center border border-white rounded-md">Dd</div>
	</div>
</div>
