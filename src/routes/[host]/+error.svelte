<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="max-w-6xl font-paragraph">
	<div
		class="pb-2 border-b border-b-black border-opacity-10 dark:border-white dark:border-opacity-100"
	>
		<h1 class="font-header text-2xl sm:text-3xl">
			{$page.status === 404 ? 'Nobody here by that name' : 'Something went wrong'}
		</h1>
	</div>

	{#if $page.error?.hosts?.length}
		<p class="mt-6">Try one of these:</p>
		<div class="flex flex-wrap gap-3 mt-4">
			{#each $page.error.hosts as host (host.slug)}
				<a href={`/${host.slug}`} class="btn-primary">{host.displayName}</a>
			{/each}
		</div>
	{/if}

	<a href="/" class="inline-block mt-8 underline">Go back home</a>
</div>
