<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
	import { linear, quadInOut } from 'svelte/easing';
	import type { ActionData, PageData } from './$types';
	import AlertFlash from '$lib/components/alert.svelte';
	import type { Writable } from 'svelte/store';
	import type { Alert } from '$lib/utils/types';
	import { getContext } from 'svelte';
	import {
		FIRST_POST_HOUR_ET,
		MAX_POST_LENGTH,
		PICKS_QUIET_MINUTES,
		cleanFadeLine,
		fadeLineLength
	} from '$lib/utils/x-bot';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const alert: Writable<Alert> = getContext('alert');

	$effect(() => {
		if (form) {
			alert.set({
				text: form.message,
				alertType: form.success ? 'success' : 'error'
			});
		}
	});

	// what's in the box. Follows the saved line whenever the page reloads after a save or a clear
	let line = $state('');
	$effect(() => {
		line = data.savedLine ?? '';
	});

	// the same count the server checks when the line is saved
	let length = $derived(fadeLineLength(data.week, cleanFadeLine(line)));
</script>

<div
	class=""
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
	<div
		class="flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100 max-w-6xl"
	>
		<h1 class="font-header text-2xl sm:text-3xl">Week {data.week} fade post on X</h1>
	</div>

	<div class="my-4 max-w-6xl" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
		<AlertFlash />
	</div>

	<div class="flex flex-col gap-y-6 max-w-2xl">
		{#if data.locked}
			<section class="flex flex-col gap-y-2">
				<p>This week's post can't change any more: {data.locked.reason}.</p>
				{#if data.locked.text}
					<p class="whitespace-pre-line rounded-md border border-black/10 dark:border-white/20 p-4">
						{data.locked.text}
					</p>
				{/if}
				{#if data.locked.url}
					<a href={data.locked.url} target="_blank" rel="noreferrer" class="w-fit underline">
						See it on X
					</a>
				{/if}
			</section>
		{:else}
			<section class="flex flex-col gap-y-2">
				<h2 class="text-xl font-semibold">What will post</h2>
				{#if data.preview}
					<p class="whitespace-pre-line rounded-md border border-black/10 dark:border-white/20 p-4">
						{data.preview}
					</p>
				{:else}
					<p>No week {data.week} picks yet. A line saved now is used once they're in.</p>
				{/if}
				<p class="text-sm opacity-70">
					It goes out {PICKS_QUIET_MINUTES} minutes after the last pick is entered (never before
					{FIRST_POST_HOUR_ET}am ET), so save your line before then.
				</p>
			</section>

			<form
				method="POST"
				action="?/saveLine"
				use:enhance={() =>
					async ({ update }) =>
						update({ reset: false })}
				class="flex flex-col gap-y-3"
			>
				<input type="hidden" name="week" value={data.week} />
				<label for="line" class="font-semibold">Your middle line</label>
				<textarea
					id="line"
					name="line"
					rows="3"
					bind:value={line}
					placeholder={data.defaultLine ?? ''}
					class="py-2 px-2 w-full text-black bg-[#fcfeff]! border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out"
				></textarea>
				<p class="text-sm" class:text-red-500={length > MAX_POST_LENGTH}>
					{length} / {MAX_POST_LENGTH} characters
				</p>
				{#if data.defaultLine}
					<p class="text-sm opacity-70">Default: {data.defaultLine}</p>
				{/if}

				<div class="flex gap-x-3">
					<button
						class="w-fit px-4 py-1.5 rounded-md bg-lightRed hover:bg-lightRedHover dark:bg-darkRed dark:hover:bg-darkRedHover text-white transition-all duration-300 ease-in-out"
						type="submit"
					>
						Save
					</button>
					{#if data.savedLine}
						<button
							class="w-fit px-4 py-1.5 rounded-md border border-black/20 dark:border-white/40 transition-all duration-300 ease-in-out"
							type="submit"
							formaction="?/clearLine"
						>
							Use the default
						</button>
					{/if}
				</div>
			</form>
		{/if}
	</div>
</div>
