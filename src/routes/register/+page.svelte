<script lang="ts">
	import { enhance } from '$app/forms';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	import { navigating } from '$app/stores';

	const lastPage = $navigating?.from?.route.id;
</script>

<div class="w-full h-full flex justify-center overflow-hidden">
	<div
		class="max-w-sm bg-slate-300 bg-opacity-50 rounded-md flex-auto flex flex-col gap-y-2 h-full px-12 py-6"
		in:fly={{
			x: lastPage === '/login' ? -100 : 0,
			y: lastPage !== '/login' ? 50 : 0,
			duration: 500,
			delay: lastPage ? 100 : 500,
			easing: cubicOut
		}}
	>
		<h2 class="text-xl font-header">Sign Up</h2>

		<div class="font-paragraph mt-2">
			<p class="text-sm">Register an account fade & tail the boys or make your own picks.</p>

			<form class="flex flex-col gap-y-3 mt-3" method="POST" use:enhance>
				<label for="username" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Username</span>
					<input
						id="username"
						name="username"
						type="text"
						class="mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
					/>
				</label>

				<label for="password" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Password</span>
					<input
						id="password"
						name="password"
						type="password"
						class="mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
					/>
				</label>

				<label for="confirmPassword" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Confirm Password</span>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="confirmPassword"
						class="mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
					/>
				</label>

				<button
					class="bg-primary dark:bg-[#1f1f1f] text-white py-2 mt-1 rounded-md hover:bg-primaryHover transition-all duration-200 ease-in-out"
					type="submit">Sign Up</button
				>

				<p class="text-xs text-gray-500 flex gap-x-2">
					Got an account already?
					<a href="/login" class=""> <p class="text-blue-500">Log In</p></a>
				</p>
			</form>
		</div>
	</div>
</div>
