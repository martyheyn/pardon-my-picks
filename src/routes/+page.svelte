<script lang="ts">
	import { browser } from '$app/environment';

	// redirect to current week
	import { goto } from '$app/navigation';
	import { redirect } from '@sveltejs/kit';

	$: if (browser) {
		goto('/2023/9');
	} else {
		redirect(301, '/2023/9');
	}
</script>
