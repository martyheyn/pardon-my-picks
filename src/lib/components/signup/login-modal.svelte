<script lang="ts">
	export let loginModalInfo: {
		header: string;
		description: string;
		footer: string;
		alt: string;
		nextStep: number;
	};

	let loginValues: {
		username: string;
		password: string;
	} = {
		username: '',
		password: ''
	};

	let signupValues: {
		username: string;
		password: string;
		confirmPassword: string;
	} = {
		username: '',
		password: '',
		confirmPassword: ''
	};

	export let loginStep: number;
</script>

<div class="flex flex-col gap-y-2">
	<!-- <slot name="header" /> -->
	<h2 class="text-xl font-header">{loginModalInfo.header}</h2>

	<div class="border-b border-black border-opacity-75" />

	<div class="font-paragraph mt-2">
		<p>{loginModalInfo.description}</p>

		<form class="flex flex-col gap-y-3 mt-3">
			{#if loginStep === 1}
				<label for="username" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Username</span>
					<input
						id="username"
						type="text"
						class="text-gray-800 mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						bind:value={loginValues.username}
					/>
				</label>

				<label for="password" class="block text-sm font-medium text-gray-600"
					><span class="pl-[2px]">Password</span>
					<input
						id="password"
						type="password"
						class="text-gray-800 mt-[2px] py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						bind:value={loginValues.password}
					/>
				</label>
			{:else}
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
			{/if}
			<button
				class="bg-primary dark:bg-[#1f1f1f] text-white py-2 mt-1 rounded-md hover:bg-primaryHover transition-all duration-200 ease-in-out"
				type="submit">{loginModalInfo.header}</button
			>

			<p class="text-xs text-gray-500">
				{loginModalInfo.footer}
				<button class="" on:click={() => (loginStep = loginModalInfo.nextStep)}>
					<p class="text-blue-500">{loginModalInfo.alt}</p></button
				>
			</p>
		</form>
	</div>
</div>
