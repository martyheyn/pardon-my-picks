<script lang="ts">
	import '../app.css';

	// create store
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import Sidenav from '../components/structure/sidenav.svelte';
	import Topnav from '../components/structure/topnav.svelte';

	const sideNavCollasped = writable(true);
	const currWeek = writable(11);

	const darkMode = writable(false);

	function detectDarkMode() {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		darkMode.set(mediaQuery.matches);

		const updateDarkMode = (e: any) => darkMode.set(e.matches);

		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', updateDarkMode);
		} else if (mediaQuery.addListener) {
			mediaQuery.addListener(updateDarkMode);
		} else {
			// Fallback: Polling mechanism if listeners are not supported
			const interval = setInterval(() => {
				darkMode.set(mediaQuery.matches);
			}, 1000); // Check every second

			return () => clearInterval(interval);
		}

		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener('change', updateDarkMode);
			} else if (mediaQuery.removeListener) {
				mediaQuery.removeListener(updateDarkMode);
			}
		};
	}

	onMount(detectDarkMode);

	$: $darkMode = $darkMode; // This line triggers reactivity when the dark mode changes
	$: console.log('darkMode', $darkMode);

	setContext('sideNavCollasped', sideNavCollasped);
	setContext('currWeek', currWeek);

	let fullPageHeight: number;
	let screenWidth: number;
	let scrollY: number;
	$: mobile = screenWidth < 640;
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans&family=Kanit:wght@400;500&display=swap"
		rel="stylesheet"
	/>
	<meta name="Pardon My Tale Weekly Football Picks" />
	<title>Pardon My Picks</title>
</svelte:head>

<svelte:window bind:innerWidth={screenWidth} bind:scrollY />

<div class="min-h-screen dark:text-white" bind:clientHeight={fullPageHeight}>
	<Topnav />

	<Sidenav {mobile} {scrollY} />

	<div
		class={`${
			$sideNavCollasped
				? 'w-[calc(100vw - 64px)]'
				: 'w-[calc(100vw - 64px)] lg:w-[calc(100vw - 224px)] lg:ml-40'
		} ${
			mobile ? 'ml-0' : 'ml-14 '
		}z-0 relative top-0 transition-all duration-500 ease-in-out bg-opacity-5 overflow-x-hidden`}
	>
		<div class={`p-4 sm:p-8 bg-slate-100 dark:bg-[#2d2d2d] min-h-[${fullPageHeight - 56}px]`}>
			<slot />
		</div>
	</div>
</div>
