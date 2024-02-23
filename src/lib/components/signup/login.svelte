<script lang="ts">
	export let loginValues = {
		username: '',
		password: ''
	};

	$: console.log(`here login inputs`);

	// 2 renders here, why?
	$: console.log(`inputValues in Login comp: ${loginValues.username} ${loginValues.password}`);
</script>

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
