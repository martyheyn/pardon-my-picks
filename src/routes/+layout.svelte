<script lang="ts">
	import '../app.css';

	// create store
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { page } from '$app/stores';

	import Sidenav from '$lib/components/structure/sidenav.svelte';
	import Topnav from '$lib/components/structure/topnav.svelte';

	const sideNavCollasped = writable(true);
	const currWeek = writable(17);
	const screenWidth = writable(0);
	const active = writable('');
	const fullPageHeight = writable(0);

	$: if ($page.route) {
		if ($page.route.id?.includes('week')) {
			active.set('Week');
		}
		if ($page.route.id?.includes('stats')) {
			active.set('Stats');
		}
	}

	setContext('sideNavCollasped', sideNavCollasped);
	setContext('currWeek', currWeek);
	setContext('screenWidth', screenWidth);
	setContext('active', active);
	setContext('fullPageHeight', fullPageHeight);

	let scrollY: number;

	$: mobile = $screenWidth < 640;

	// Inject the Analytics functionality
	inject({ mode: dev ? 'development' : 'production' });
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans&family=Kanit:wght@400;500&display=swap"
		rel="stylesheet"
	/>
	<!-- Page Title -->
	<title>Pardon My Picks</title>

	<!-- Meta Description -->
	<meta name="description" content="Weekly football picks by Pardon My Take." />

	<!-- Keywords (Note: Google doesn't rely heavily on meta keywords, but they can still be used) -->
	<meta name="keywords" content="Pardon My Take, Football Picks, NFL Picks, Weekly Picks" />

	<!-- Canonical URL -->
	<link rel="canonical" href="https://pardonmypicks.com" />

	<!-- Open Graph Meta Tags (for social media and search engines) -->
	<meta property="og:url" content="https://pardonmypicks.com" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Pardon My Picks - Weekly Football Picks" />
	<meta property="og:description" content="Weekly football picks by Pardon My Take." />
	<meta property="og:image" content="https://pardonmypicks.com/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pardon My Picks" />
	<meta property="og:site_name" content="Pardon My Picks" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Pardon My Picks - Weekly Football Picks" />
	<meta name="twitter:description" content="Weekly football picks by Pardon My Take." />
	<meta name="twitter:image" content="https://pardonmypicks.com/og-image.png" />
</svelte:head>

<svelte:window bind:innerWidth={$screenWidth} bind:scrollY bind:innerHeight={$fullPageHeight} />

<!-- only render app if screen width is not undefined, not have jumpy navbar -->
{#if $screenWidth}
	<div class="min-h-screen dark:text-white">
		<Topnav />

		<Sidenav {scrollY} />

		<div
			class={`${
				$sideNavCollasped
					? 'w-[calc(100vw - 64px)]'
					: 'w-[calc(100vw - 64px)] lg:w-[calc(100vw - 224px)] lg:ml-40'
			} ${
				mobile ? 'ml-0' : 'ml-14 '
			}z-0 relative top-0 transition-all duration-500 ease-in-out bg-opacity-5 overflow-x-hidden`}
		>
			<div
				class={`p-4 sm:p-8 bg-slate-100 dark:bg-[#2d2d2d] min-h-[91vh] transition-all duration-500 ease-in-out`}
			>
				<slot />
			</div>
		</div>
	</div>
{/if}
