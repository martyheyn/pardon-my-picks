<script lang="ts">
	// redirect to current week
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';

	const currWeek: Writable<number> = getContext('currWeek');

	onMount(async () => {
		goto(`/2023/${$currWeek}`);
	});
</script>
