<script lang="ts">
	import '../app.css';

	// create store
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	import Sidenav from '../components/structure/sidenav.svelte';
	import Topnav from '../components/structure/topnav.svelte';

	const sideNavCollasped = writable(true);
	const currWeek = writable(11);
	const screenWidth = writable(0);

	setContext('sideNavCollasped', sideNavCollasped);
	setContext('currWeek', currWeek);
	setContext('screenWidth', screenWidth);

	let fullPageHeight: number;
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
	<meta name="Pardon My Tale Weekly Football Picks" />
	<title>Pardon My Picks</title>
</svelte:head>

<svelte:window bind:innerWidth={$screenWidth} bind:scrollY bind:innerHeight={fullPageHeight} />

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
