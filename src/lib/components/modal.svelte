<script lang="ts">
	export let showModal: boolean = false;

	let dialog: HTMLDialogElement;

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->

<dialog
	class="w-[50vw] border-none p-0 backdrop:blur-lg rounded-md overflow-x-hidden no-scrollbar transition-all duration-300 ease-in-out"
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		on:click|stopPropagation
		class="px-1.5 py-2 md:pb-8 md:px-8 md:py-8 w-full h-full transition-all duration-300 ease-in-out
		dark:border dark:border-slate-100 dark:bg-darkSecondary dark:text-white rounded-md"
	>
		<!-- svelte-ignore a11y-autofocus -->
		<button
			class=" absolute top-2.5 right-2.5 fill-slate-700 hover:fill-slate-600
			hover:scale-[1.04] transition-all duration-1500 ease-linear dark:fill-slate-100 dark:hover:fill-slate-200"
			autofocus
			on:click={() => dialog.close()}
		>
			<!-- <img src="/close.svg" alt="close svg" /> -->
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="16px" height="16px">
				<path
					class=""
					d="M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z"
				/></svg
			>
		</button>
		<slot />
	</div>
</dialog>

<style>
	dialog[open] {
		animation: zoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.4s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
