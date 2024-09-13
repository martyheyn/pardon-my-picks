<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { getContext, onDestroy } from 'svelte';
	import type { Alert } from '$lib/utils/types';
	import { fly } from 'svelte/transition';

	const alert: Writable<Alert> = getContext('alert');

	export let ms = 3000;
	let visible: boolean = false;
	let timeout: number | undefined;

	let color: string;

	$: switch ($alert.alertType) {
		case 'error':
			color = 'bg-lightRed dark:bg-darkRed dark:text-white';
			break;
		case 'success':
			color = 'bg-lightGreen dark:bg-darkGreen dark:text-white';
			break;
		default:
			color = 'bg-gray-100 text-gray-800';
			break;
	}

	const onMessageChange = (message: string | undefined, ms: number) => {
		clearTimeout(timeout);
		if (!message) {
			// hide Alert if message is empty
			visible = false;
		} else {
			visible = true;
			if (ms > 0)
				timeout = window.setTimeout(() => {
					alert.set({ text: undefined, alertType: undefined });
					visible = false;
				}, ms); // and hide it after ms milliseconds
		}
	};

	$: onMessageChange($alert.text, ms); // whenever the alert store or the ms props changes run onMessageChange

	onDestroy(() => clearTimeout(timeout)); // make sure we clean-up the timeout
</script>

{#if visible}
	<div
		class={`px-4 py-3 ${color} rounded-md`}
		transition:fly={{ x: -50, duration: 300, delay: 50 }}
	>
		{$alert.text}
	</div>
{/if}
