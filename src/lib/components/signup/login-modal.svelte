<script lang="ts">
	export let modalInfo: {
		header: string;
		description: string;
		footer: string;
		alt: string;
		nextStep: number;
	};

	export let loginStep: number;
</script>

<div class="flex flex-col gap-y-2">
	<!-- <slot name="header" /> -->
	<h2 class="text-xl font-header">{modalInfo.header}</h2>

	<div class="border-b border-black border-opacity-75" />

	<div class="font-paragraph mt-2">
		<p>{modalInfo.description}</p>

		<div class="flex flex-col gap-y-3 mt-3">
			<slot />
			<button
				class="bg-primary dark:bg-[#1f1f1f] text-white py-2 mt-1 rounded-md hover:bg-primaryHover transition-all duration-200 ease-in-out"
				type="submit">{modalInfo.header}</button
			>

			<p class="text-xs text-gray-500">
				{modalInfo.footer}
				<button class="" on:click={() => (loginStep = modalInfo.nextStep)}>
					<p class="text-blue-500">{modalInfo.alt}</p></button
				>
			</p>
		</div>
	</div>
</div>
