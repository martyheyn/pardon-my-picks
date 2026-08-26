<script lang="ts">
	import Icon from './icon.svelte';

	let { betType }: { betType: string } = $props();

	let betText = $derived.by(() => {
		switch (betType) {
			case 'lunder':
				return "L'Under";
			case 'gunder':
				return "G'Under";
			case 'timezone':
				return 'Timezone';
			case 'huh':
				return 'Huh ???';
			case 'thanksgiving':
				return 'Thanksgiving';
			case 'holiday':
				return 'Holiday';
			case 'malikWillis':
				return 'Malik Willis';
			case 'spunder':
				return "Sp'Under";
		}
	});
</script>

<div class="">
	<p
		class="flex justify-center items-center gap-x-2 text-sm font-semibold bg-slate-300 bg-opacity-70 px-4 py-1.5 rotate-[15deg] md:rotate-[32.5deg] rounded-md"
	>
		{#if betText === 'Malik Willis'}
			<img
				class={`transition-all duration-300 ease-in-out w-6 h-6`}
				src={`/specials/${betType}.png`}
				alt="Malik Willis"
			/>
		{:else}
			<Icon
				class={`transition-all duration-300 ease-in-out ${
					betType !== 'lunder' ? '[fill-rule:evenodd] [clip-rule:evenodd]' : ''
				}`}
				width="24px"
				height="24px"
				iconName={betType}
			/>
		{/if}
		{betText} Bet
	</p>
</div>
