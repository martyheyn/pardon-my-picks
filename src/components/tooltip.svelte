<script lang="ts">
	export let width: string = '100%';
	export let placement: string = 'right';
	export let text: string;

	$: switch (placement) {
		case 'right':
			placement = 'top-[20%] left-16';
			break;
		case 'left':
			placement = 'top-[20%] left-0';
			break;
		case 'top':
			placement = 'top-0 right-1/2';
			break;
		case 'bottom':
			placement = 'bottom-0 right-1/2';
			break;
	}
</script>

<div
	class={`w-[${width}] absolute ${placement} bg-black bg-opacity-90 text-white rounded-sm z-40 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100`}
>
	<!-- <div class="relative w-full h-full">
		<div
			class={`before:absolute before:w-2 before:h-2 before:bg-black before:bg-opacity-90 before:-left-1 before:top-[36%]`}
		> -->
	<p class="px-6 py-2">{text}</p>
	<!-- </div>
	</div> -->
</div>
