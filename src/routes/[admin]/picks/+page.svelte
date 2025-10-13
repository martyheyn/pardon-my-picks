<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { fade, fly, slide } from 'svelte/transition';
	import { linear, quadInOut } from 'svelte/easing';
	import type { ActionData } from './$types';
	import AlertFlash from '$lib/components/alert.svelte';
    import { nflTeams } from '$lib/utils/matching-format'
	import type { Writable } from 'svelte/store';
	import type { Alert } from '$lib/utils/types';
	import { getContext } from 'svelte';

	export let form: ActionData;

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

    const personas = [
        'Big Cat', 'PFT', 'Memes', 'Hank', 'Max', 'Zach'
    ]
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
        action="?/addPicks"
        use:enhance
        class="flex flex-col gap-y-8 justify-center"
    >
        <div class="flex gap-x-4">
            <label for="commenceTimeFrom">commenceTimeFrom</label>
            <input class="text-black/60" type="date" name="commenceTimeFrom" id="commenceTimeFrom" value="2025-09-01">
        </div>

        <div class="flex gap-x-4">
            <label for="commenceTimeTo">commenceTimeTo</label>
            <input class="text-black/60" type="date" name="commenceTimeTo" id="commenceTimeTo" value="2025-09-01">
        </div>
        {#each personas as person}
            <div class="flex flex-col gap-y-4 justify-center-center">
                <h1 class="text-3xl font-bold">{person}</h1>

                <div class="flex flex-col gap-y-4">
                    <input type="hidden" name="person" value={person}>
                    <div class="flex flex-row gap-x-4 items-center">
                        <p>Spread:</p>
                        <input type="hidden" name="betType" value="spreads">
                        <label for="team-name" class="block text-sm font-semibold text-gray-800 flex-1">
                            <select  name="teamName" id="team-name-select" class="py-2 w-full text-black !bg-[#fcfeff] indent-2 border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out">
                                <option value="">--Choose Team--</option>
                                {#each nflTeams as team}
                                    <option value={team}>{team}</option>
                                {/each}
                            </select>
                        </label>
                        <input type="hidden" name="overUnder" value={null}>
                        <label for="points" class="block text-sm font-semibold text-gray-800 flex-1">
                            <input
                                
                                id="points"
                                name="points"
                                type="text"
                                placeholder="Points"
                                class="py-2 w-full text-black !bg-[#fcfeff] indent-2 border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out"
                            />
                        </label>
                    </div>

                    <div class="flex flex-row gap-x-4 items-center">
                        <input type="hidden" name="person" value={person}>
                        <p>Total:</p>
                        <input type="hidden" name="betType" value="totals">
                        <label for="team-name" class="block text-sm font-semibold text-gray-800 flex-1">
                            <select  name="teamName" id="team-name-select" class="py-2 w-full text-black !bg-[#fcfeff] indent-2 border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out">
                                <option value="">--Choose Team--</option>
                                {#each nflTeams as team}
                                    <option value={team}>{team}</option>
                                {/each}
                            </select>
                        </label>
                        <label for="over-under" class="block text-sm font-semibold text-gray-800 flex-1">
                            <select  name="overUnder" id="over-under-select" class="py-2 w-full text-black !bg-[#fcfeff] indent-2 border focus:outline-none focus:border-blue-300 rounded-md transition duration-150 ease-in-out">
                                <option value="">--Over / Under--</option>
                                    <option value="under">Under</option>
                                    <option value="over">Over</option>
                            </select>
                        </label>
                        <label for="points" class="block text-sm font-semibold text-gray-800 flex-1">
                            <input
                                
                                id="points"
                                name="points"
                                type="text"
                                placeholder="Points"
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
    </form>
</div>