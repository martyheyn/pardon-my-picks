<script lang="ts">
	import '../app.css';
	import type { PageData } from './$types';
	export let data: PageData;

	// create store
	import { getContext, onMount, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { page } from '$app/stores';
	import { sideNavItems } from '$lib/utils/sidenav-tree';

	import Sidenav from '$lib/components/structure/sidenav.svelte';
	import Topnav from '$lib/components/structure/topnav.svelte';
	import type { Alert } from '$lib/utils/types';
	import type { Page } from '@sveltejs/kit';
	import { PUBLIC_CURRENT_WEEK, PUBLIC_CURRENT_YEAR } from '$env/static/public';

	const sideNavCollasped = writable(true);
	const currYear = writable(PUBLIC_CURRENT_YEAR);
	const currWeek = writable(PUBLIC_CURRENT_WEEK);
	const screenWidth = writable(0);
	const active = writable('');
	const fullPageHeight = writable(0);
	const alert: Writable<Alert> = writable({
		text: '',
		alertType: undefined
	});

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
	setContext('currYear', currYear);
	setContext('screenWidth', screenWidth);
	setContext('active', active);
	setContext('fullPageHeight', fullPageHeight);
	setContext('alert', alert);

	let scrollY: number;

	$: mobile = $screenWidth < 640;

	const setSidenavActive = (page: Page<Record<string, string>, string | null>) => {
		const route = $page.route.id;

		if (route && !page.params.year && !page.params.week) {
			active.set(route);
			return;
		}

		if (page.params && page.params.year && page.params.week) {
			active.set(`/week`);
			return;
		}
	};
	$: $page.route.id, setSidenavActive($page);

	// Inject the Analytics functionality
	inject({ mode: dev ? 'development' : 'production' });

	let sidenavElement: HTMLElement;

	onMount(() => {				
		// close sidenav subitems onmount if open
		sideNavItems.forEach((navItem, i) => {
			if (navItem.subItemsOpen) {
				navItem.subItemsOpen = false;
				sideNavItems[i].subItemsOpen = false;
			}
		});

		const handleClickOutside = (event: MouseEvent) => {
			if ($sideNavCollasped) return;
			if (sidenavElement && !sidenavElement.contains(event.target as Node)) {
				sideNavItems.forEach((navItem, i) => {
					if (navItem.subItemsOpen) {
						sideNavItems[i].subItemsOpen = false;
						if (navItem.subItems) {
							navItem.subItems.forEach((subItem) => {
								if (subItem.subItemsOpen) {
									subItem.subItemsOpen = false;
								}
							});
						}
					}
				});
				sideNavCollasped.set(true);
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
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
	<meta property="og:image" content="https://pardonmypicks.com/pmp_screenshot.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pardon My Picks" />
	<meta property="og:site_name" content="Pardon My Picks" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Pardon My Picks - Weekly Football Picks" />
	<meta name="twitter:description" content="Weekly football picks by Pardon My Take." />
	<meta name="twitter:image" content="https://pardonmypicks.com/pmp_screenshot.png" />
</svelte:head>

<svelte:window bind:innerWidth={$screenWidth} bind:scrollY bind:innerHeight={$fullPageHeight} />

<!-- only render app if screen width is not undefined, not have jumpy navbar -->
{#if $screenWidth}
	<div class="min-h-screen dark:text-white m-0 p-0">
		<Topnav user={data.user} />

		<div bind:this={sidenavElement}>
			<Sidenav user={data.user} {scrollY} {sideNavItems} />
		</div>

		<div
			class={` ${
				$sideNavCollasped
					? 'w-[calc(100vw - 64px)]'
					: 'w-[calc(100vw - 64px)] lg:w-[calc(100vw - 224px)] lg:ml-40'
			} ${
				mobile ? 'ml-0' : 'ml-14 '
			} z-0 relative transition-all duration-500 ease-in-out bg-opacity-5 overflow-x-hidden `}
		>
			<div
				class={`${
					$page.route.id?.includes('register') || $page.route.id?.includes('login')
						? 'p-4'
						: 'p-4 sm:p-8'
				} bg-slate-100 dark:bg-[#2d2d2d] transition-all duration-500 ease-in-out z-0
				 scroll-smooth h-full overflow-y-auto`}
				style="min-height: calc(100vh - 56px);"
			>
				<slot />
			</div>
		</div>
	</div>
{/if}
