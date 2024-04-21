<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ odds } = data);
	$: console.log('odds', odds);
</script>

<div class="p-4">
	<h1>Place your picks here</h1>

	<div
		class="grid grid-cols-1 md:grid-cols-8 my-8 md:gap-x-6 lg:gap-x-12 gap-y-6 md:gap-y-12 max-w-6xl font-paragraph transition-all duration-300 ease-in-out"
	>
		<div class=" md:col-span-2">dd</div>
		<div class="md:col-span-6">
			<div
				class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 transition-all ease-in-out duration-300"
			>
				<div class="card">d</div>
				<div class="card">d</div>
			</div>
		</div>
	</div>
</div>
