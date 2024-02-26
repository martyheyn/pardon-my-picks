<script lang="ts">
	let signupValues: {
		username: string;
		password: string;
		confirmPassword: string;
	} = {
		username: '',
		password: '',
		confirmPassword: ''
	};
</script>

<div class="w-full h-full flex justify-center overflow-hidden">
	<div
		class="max-w-sm bg-slate-300 bg-opacity-50 rounded-md flex-auto flex flex-col gap-y-2 h-full px-12 py-6"
	>
		<h2 class="text-xl font-header">Sign Up</h2>

		<div class="font-paragraph mt-2">
			<p class="text-sm">Register an account fade & tail the boys or make your own picks.</p>

			<form class="flex flex-col gap-y-3 mt-3">
				<label for="username" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Username</span>
					<input
						id="username"
						type="text"
						class="mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						bind:value={signupValues.username}
					/>
				</label>

				<label for="password" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Password</span>
					<input
						id="password"
						type="password"
						class="mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						bind:value={signupValues.password}
					/>
				</label>

				<label for="confirmPassword" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Confirm Password</span>
					<input
						id="confirmPassword"
						type="confirmPassword"
						class="mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						bind:value={signupValues.confirmPassword}
					/>
				</label>

				<button
					class="bg-primary dark:bg-[#1f1f1f] text-white py-2 mt-1 rounded-md hover:bg-primaryHover transition-all duration-200 ease-in-out"
					type="submit">Sign Up</button
				>

				<p class="text-xs text-gray-500">
					Got an account already?
					<button class=""> <p class="text-blue-500">Log In</p></button>
				</p>
			</form>
		</div>
	</div>
</div>
