<script lang="ts">
	export let width: string = '100%';
	export let placement: string = 'right';
	export let text: string;
	let arrowPlacement: string;

	$: switch (placement) {
		case 'right':
			placement = 'top-[20%] left-16';
			arrowPlacement = 'top-[36%] rotate-45 -left-1';
			break;
		case 'left':
			placement = 'top-[20%] left-0';
			arrowPlacement = 'top-[36%] rotate-45 -right-1';
			break;
		case 'top':
			placement = 'top-0 -right-1/2';
			arrowPlacement = '-bottom-1 rotate-270';
			break;
		case 'bottom':
			placement = 'bottom-0 -right-1/2';
			arrowPlacement = '-top-1 right-1/2 rotate-45';
			break;
	}
</script>

<div
	class={`tooltip w-[${width}] absolute ${placement} bg-black bg-opacity-100 text-white rounded-sm z-40 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100`}
>
	<!-- Left-pointing arrow -->
	<div class="relative w-full h-full">
		<div class={`absolute w-2 h-2 bg-black bg-opacity-90 transform ${arrowPlacement} z-0`} />
		<p class="px-6 py-2">{text}</p>
	</div>
</div>
