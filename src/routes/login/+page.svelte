<script lang="ts">
	import { enhance } from '$app/forms';
	import { cubicOut } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import AlertFlash from '$lib/components/alert.svelte';
	import type { Alert } from '$lib/utils/types';
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

	// wanted to implement ui rate limiting on btns
	let disableSubmit = false;
	$: if ($errors && $errors._errors && $errors._errors[0].includes('rate limit')) {
		disableSubmit = true;
		setTimeout(() => {
			disableSubmit = false;
		}, 60000);
	}

	const lastPage = $navigating?.from?.route.id;
</script>

<div class="w-full h-full flex justify-center">
	<div
		class="max-w-sm bg-slate-300 dark:bg-[#3c3c3c] bg-opacity-50 rounded-md flex-auto flex flex-col gap-y-2 h-full px-12 py-6"
		in:fly={{
			x: lastPage === '/register' || lastPage === '/reset-password' ? 100 : 0,
			y: lastPage === '/register' || lastPage === '/reset-password' ? 0 : 50,
			duration: 500,
			delay: lastPage ? 100 : 500,
			easing: cubicOut
		}}
	>
		<h2 class="text-xl font-header">Log In</h2>

		<div class="font-paragraph mt-2">
			<p class="text-sm">Log in to do stuff.</p>

			{#if $errors && $errors._errors}
				<div class="pt-2" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
					<AlertFlash />
				</div>
			{/if}

			<form class="flex flex-col gap-y-3 mt-4" method="post" use:enhance>
				<label for="username" class="block text-sm font-medium text-gray-600 dark:text-white"
					><span class="pl-[2px]">Username</span>
					<input
						id="username"
						name="username"
						type="text"
						class="mt-[2px] py-2 indent-2 border focus:outline-none dark:text-dark
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

				<label for="password" class="block text-sm font-medium text-gray-600 dark:text-white"
					><span class="pl-[2px]">Password</span>
					<input
						id="password"
						name="password"
						type="password"
						class={`mt-[2px] py-2 indent-2 border focus:outline-none dark:text-dark
						 w-full rounded-md transition duration-150 ease-in-out
						${
							$form.password.length > 0 && $form.password.length < 6
								? 'focus:border-red-300 border-red-300'
								: 'focus:border-blue-300'
						}`}
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
					class={`${
						!disableSubmit
							? 'bg-primary hover:bg-primaryHover cursor-pointer'
							: 'bg-gray-600 cursor-not-allowed'
					} dark:bg-[#1f1f1f] text-white
					 py-2 mt-1 rounded-md transition-all duration-200 ease-in-out`}
					type="submit"
					disabled={disableSubmit}>Log In</button
				>
				{#if disableSubmit}
					<p in:slide={{ duration: 300 }} class="text-red-500 text-xs">
						You have reached the maximum login attempts. Please try again in 1 minute.
					</p>
				{/if}

				<div class="flex flex-col gap-y-1.5">
					<div class="text-xs text-gray-500 dark:text-white flex gap-x-2">
						<p>Don't have an account?</p>
						<a href="/register" class="">
							<span class="text-blue-500 dark:text-blue-200">Sign Up</span></a
						>
					</div>

					<!-- <div class="text-xs text-gray-500 dark:text-white flex gap-x-2">
						<p>Forgot your password??</p>
						<a href="/reset-password" class="">
							<span class="text-blue-500 dark:text-blue-200">Reset Password</span></a
						>
					</div> -->
				</div>
			</form>
		</div>
	</div>
</div>
