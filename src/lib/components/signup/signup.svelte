<script lang="ts">
	export let signupValues: {
		username: string;
		password: string;
		confirmPassword?: string;
	} = {
		username: '',
		password: '',
		confirmPassword: ''
	};
</script>

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
