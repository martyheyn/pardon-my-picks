<script lang="ts">
	import type { PageData } from './$types';
	// import { page } from '$app/stores';
	export let data: PageData;

	$: ({ person, spreads } = data);
</script>

<div>
	<h1>Individual Person {person}</h1>

	<p>This Page is under construction / Not sure if it is even needed</p>
</div>
