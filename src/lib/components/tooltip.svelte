<script lang="ts">
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
			placement = '-bottom-0 -right-1/2';
			arrowPlacement = '-top-1 right-1/2 rotate-45';
			break;
	}
</script>

<div
	class={`absolute ${placement} bg-black bg-opacity-100 text-white
	 rounded-md z-[999] transition-all duration-300 ease-in-out delay-100 opacity-0 -translate-x-8
	  group-hover:opacity-100 group-hover:translate-x-0`}
>
	<div class="relative w-full h-full">
		<p class="px-6 py-2">{text}</p>
	</div>
</div>
