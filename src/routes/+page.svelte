<script lang="ts">
	import { browser } from '$app/environment';
	// redirect to current week
	import { goto } from '$app/navigation';
	import { redirect } from '@sveltejs/kit';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';

	const currWeek: Writable<number> = getContext('currWeek');

	onMount(() => {
		goto(`/2023/${$currWeek}`);
	});
</script>
