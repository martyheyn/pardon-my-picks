<script lang="ts">
	// redirect to current week
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';

	const currWeek: Writable<number> = getContext('currWeek');
	const currYear: Writable<number> = getContext('currYear');
	console.log("$currWeek", $currWeek)

	onMount(async () => {
		try {
		const weeklyPickMadeRes = await fetch(`/api/picks-made`);
		const weeklyPickMade = await weeklyPickMadeRes.json();

		currWeek.set(weeklyPickMade.weeklyPmtPicks ? $currWeek : Number($currWeek) - 1);
		} catch (err) {
			console.error("Failed to fetch weekly picks:", err);
		}

		console.log(`/${$currYear}/${$currWeek}`);
		goto(`/${$currYear}/${$currWeek}`);
	})
</script>
