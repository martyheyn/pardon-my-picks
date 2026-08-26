<script lang="ts">
	let { placement = 'right', text }: { placement?: string; text: string } = $props();

	let placementClasses = $derived.by(() => {
		switch (placement) {
			case 'right':
				return 'top-[20%] left-16';
			case 'left':
				return 'top-[20%] left-0';
			case 'top':
				return 'top-0 -right-1/2';
			case 'bottom':
				return '-bottom-0 -right-1/2';
			default:
				return placement;
		}
	});
</script>

<div
	class={`absolute ${placementClasses} bg-black bg-opacity-100 text-white
	 rounded-md z-[999] transition-all duration-300 ease-in-out delay-100 opacity-0 -translate-x-44
	  group-hover:opacity-100 group-hover:-translate-x-0`}
>
	<div class="relative w-full h-full">
		<p class="px-6 py-2">{text}</p>
	</div>
</div>
