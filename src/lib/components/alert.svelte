<script lang="ts">
	import { fly } from 'svelte/transition';

	export let text = '';
	export let alertType: 'error' | 'success' | undefined = undefined;

	let color: string;

	switch (alertType) {
		case 'error':
			color = 'bg-red-100 text-red-800';
			break;
		case 'success':
			color = 'bg-green-100 text-green-800';
			break;
		default:
			color = 'bg-gray-100 text-gray-800';
			break;
	}
</script>

<div class={`px-4 py-3 ${color} rounded-md`} transition:fly={{ x: -50, duration: 300, delay: 100 }}>
	{text}
</div>
