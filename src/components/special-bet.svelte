<script lang="ts">
	import Icon from './icon.svelte';

	export let betType: string;

	let betText: string;
	$: switch (betType) {
		case 'lunder':
			betText = "L'Under";
			break;
		case 'timezone':
			betText = 'Timezone';
			break;
		case 'huh':
			betText = 'Huh ???';
		case 'thanksgiving':
			betText = 'Thanksgiving';
			break;
	}
</script>

<div class="">
	<p
		class="flex justify-center items-center gap-x-2 text-sm font-semibold bg-slate-300 bg-opacity-70 px-4 py-1.5 md:rotate-[32.5deg] rounded-md"
	>
		<Icon
			class={`transition-all duration-300 ease-in-out ${
				betType !== 'lunder' ? '[fill-rule:evenodd] [clip-rule:evenodd]' : ''
			}`}
			width="24px"
			height="24px"
			iconName={betType}
		/>
		{betText}
	</p>
</div>
