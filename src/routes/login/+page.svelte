<script lang="ts">
	import { enhance } from '$app/forms';
	import { cubicOut } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import AlertFlash from '$lib/components/alert.svelte';
	import type { Alert } from '$lib/utils/alert';
	import type { Writable } from 'svelte/store';
	import { getContext } from 'svelte';

	import { navigating } from '$app/stores';

	export let data;

	const alert: Writable<Alert> = getContext('alert');

	const { form, errors } = superForm(data.form);

	$: if ($errors && $errors._errors) {
		alert.set({
			text: $errors._errors[0],
			alertType: 'error'
		});
	}

	const lastPage = $navigating?.from?.route.id;
</script>

<div class="w-full h-full flex justify-center">
	<div
		class="max-w-sm bg-slate-300 bg-opacity-50 rounded-md flex-auto flex flex-col gap-y-2 h-full px-12 py-6"
		in:fly={{
			x: lastPage === '/register' ? 100 : 0,
			y: lastPage !== '/register' ? 50 : 0,
			duration: 500,
			delay: lastPage ? 100 : 500,
			easing: cubicOut
		}}
	>
		<h2 class="text-xl font-header">Log In</h2>

		<div class="font-paragraph mt-2">
			<p class="text-sm">Log in to do stuff.</p>

			<div class="pt-2">
				<AlertFlash />
			</div>

			<form class="flex flex-col gap-y-2 mt-2" method="post" use:enhance>
				<label for="username" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Username</span>
					<input
						id="username"
						name="username"
						type="text"
						class="mt-[2px] py-2 indent-2 border focus:outline-none
						focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						aria-invalid={$errors.username ? 'true' : undefined}
						bind:value={$form.username}
					/>
					{#if $errors.username}
						<p in:slide={{ duration: 300 }} class="text-red-500 text-xs">
							{$errors.username}
						</p>
					{/if}
				</label>

				<label for="password" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Password</span>
					<input
						id="password"
						name="password"
						type="password"
						class="mt-[2px] py-2 indent-2 border focus:outline-none
						focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out
						"
						aria-invalid={$errors.password ? 'true' : undefined}
						bind:value={$form.password}
					/>
					{#if $errors.password}
						<p in:slide={{ duration: 300 }} class="text-red-500 text-xs">
							{$errors.password}
						</p>
					{/if}
				</label>

				<button
					class="bg-primary dark:bg-[#1f1f1f] text-white py-2 mt-1 rounded-md
					 hover:bg-primaryHover transition-all duration-200 ease-in-out"
					type="submit">Log In</button
				>

				<p class="text-xs text-gray-500 flex gap-x-2">
					Don't have an account?
					<a href="/register" class=""> <p class="text-blue-500">Sign Up</p></a>
				</p>
			</form>
		</div>
	</div>
</div>
