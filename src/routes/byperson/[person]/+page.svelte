<script lang="ts">
	import type { PageData } from './$types';
	// import { page } from '$app/stores';
	export let data: PageData;

	$: ({ person, spreads } = data);
</script>

<div>Individual Person</div>
