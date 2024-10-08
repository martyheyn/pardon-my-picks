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

	// const { form, errors } = superForm(data.form);
	const lastPage = $navigating?.from?.route.id;
</script>

<div class="w-full h-full flex justify-center">
	<div
		class="max-w-sm bg-slate-300 bg-opacity-50 rounded-md flex-auto flex flex-col gap-y-2 h-full px-12 py-6"
		in:fly={{
			x: lastPage === '/login' || lastPage === '/reset-password' ? -100 : 0,
			y: 0,
			duration: 500,
			delay: lastPage ? 100 : 500,
			easing: cubicOut
		}}
	>
		<h2 class="text-xl font-header">Reset Password</h2>

		<div class="font-paragraph mt-2">
			<p class="text-sm">
				If you entered your email into profile, enter it below to reset your password
			</p>

			<div class="pt-2" transition:fly={{ x: -50, duration: 300, delay: 50 }}>
				<AlertFlash />
			</div>

			<form class="flex flex-col gap-y-2 mt-2" method="post" use:enhance>
				<label for="email" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Email</span>
					<input
						id="email"
						name="email"
						type="text"
						class="mt-[2px] py-2 indent-2 border focus:outline-none
						focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						aria-invalid={$errors.email ? 'true' : undefined}
						bind:value={$form.email}
					/>
					{#if $errors.email}
						<p in:slide={{ duration: 300 }} class="text-red-500 text-xs">
							{$errors.email}
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
					disabled={disableSubmit}>Send Reset Link</button
				>
				{#if disableSubmit}
					<p in:slide={{ duration: 300 }} class="text-red-500 text-xs">
						You have reached the maximum attempts. Please try again in 1 minute.
					</p>
				{/if}

				<div class="flex flex-col gap-y-1">
					<p class="text-xs text-gray-500 flex gap-x-2">
						Don't have an account?
						<a href="/register" class=""> <p class="text-blue-500">Sign Up</p></a>
					</p>

					<p class="text-xs text-gray-500 flex gap-x-2">
						Got an Account?
						<a href="/login" class=""> <p class="text-blue-500">Log In</p></a>
					</p>
				</div>
			</form>
		</div>
	</div>
</div>
