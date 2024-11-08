<script lang="ts">
	import Icon from './icon.svelte';

	export let betType: string;

	let betText: string;
	$: switch (betType) {
		case 'lunder':
			betText = "L'Under";
			break;
		case 'gunder':
			betText = "G'Under";
			break;
		case 'timezone':
			betText = 'Timezone';
			break;
		case 'huh':
			betText = 'Huh ???';
		case 'thanksgiving':
			betText = 'Thanksgiving';
			break;
		case 'holiday':
			betText = 'Holiday';
		case 'malikWillis':
			betText = 'Malik Willis';
			break;
	}
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
