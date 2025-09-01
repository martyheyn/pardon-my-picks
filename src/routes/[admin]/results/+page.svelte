<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
	import { linear, quadInOut } from 'svelte/easing';
	import type { ActionData, PageData } from '../results/$types';
	import AlertFlash from '$lib/components/alert.svelte';
    import { mascotToFullName } from '$lib/utils/matching-format'
	import type { Writable } from 'svelte/store';
	import type { Alert } from '$lib/utils/types';
	import { getContext } from 'svelte';

	export let data: PageData;
	export let form: ActionData;

	$: ({ pmtWeeklyPicks } = data);
    $: console.log("pmtWeeklyPicks", pmtWeeklyPicks)

	const alert: Writable<Alert> = getContext('alert');

    const updateAlert = () => {
		if (form) {
			alert.set({
				text: form.message,
				alertType: form.success ? 'success' : 'error'
			});
		}
		return;
	};

	// alerts
	$: form, updateAlert();

    // ---> server data of team arr & id ---> list teams for inputs ---> lookup by gameId and insert data
</script>

<div
	class=""
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
    <div
		class="flex text-3xl pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100 max-w-6xl"
	>
		<h1 class="font-header text-2xl sm:text-3xl">Place this weeks picks here</h1>
	</div>

	<div class="my-4 max-w-6xl" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
		<AlertFlash />
	</div>

    <form
        method="POST"
        action="?/addLinks"
        use:enhance
        class="flex flex-col gap-y-6 justify-center"
    >
        {#if pmtWeeklyPicks && pmtWeeklyPicks?.length > 0}
            {#each pmtWeeklyPicks as team}
                <div class="flex flex-col gap-y-2 justify-center-center">
                    <h1 class="text-2xl font-semibold">{mascotToFullName[team.homeTeam]} vs {mascotToFullName[team.awayTeam]}</h1>

                    <input type="hidden" name="gameId" value={team.gameId}>
                    <div class="flex flex-col gap-y-4">
                        <div class="flex flex-row gap-x-4 items-center">
                            <label for="espnLink" class="block text-sm font-semibold text-gray-800 flex-1">
                                <input
                                    required
                                    id="espnLink"
                                    name="espnLink"
                                    type="text"
                                    placeholder="ESPN Link"
                                    class="py-2 w-full text-black !bg-[#fcfeff] indent-2 border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out"
                                />
                            </label>

                            <label for="youtubeLink" class="block text-sm font-semibold text-gray-800 flex-1">
                                <input
                                    required
                                    id="youtubeLink"
                                    name="youtubeLink"
                                    type="text"
                                    placeholder="Youtube Link"
                                    class="py-2 w-full text-black !bg-[#fcfeff] indent-2 border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div class="w-full h-[1px] bg-white/20" />
            {/each}

            <button class="w-fit px-4 py-1.5 rounded-md bg-lightRed hover:bg-lightRedHover dark:bg-darkRed dark:hover:bg-darkRedHover text-white transition-all duration-300 ease-in-out" type="submit">
                Submit
            </button>
        {/if}

    </form>
</div>