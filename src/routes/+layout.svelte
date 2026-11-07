<script lang="ts">
	import '../app.css';
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';

	// create store
	import { onMount, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { page } from '$app/stores';
	import { sideNavItems } from '$lib/utils/sidenav-tree.svelte';

	import Sidenav from '$lib/components/structure/sidenav.svelte';
	import Topnav from '$lib/components/structure/topnav.svelte';
	import type { Alert, PageMeta } from '$lib/utils/types';
	import type { Page } from '@sveltejs/kit';
	import { PUBLIC_CURRENT_YEAR } from '$env/static/public';
	import { getCurrentWeek } from '$lib/utils/nfl-week';

	let { data, children }: { data: PageData; children?: Snippet } = $props();

	// pages can set their own link preview by returning `meta` from load (host pages do) -
	// everything else gets the site-wide one
	const DEFAULT_META: PageMeta = {
		title: 'Pardon My Picks - Weekly Football Picks',
		description: 'Weekly football picks by Pardon My Take.',
		url: 'https://pardonmypicks.com',
		image: {
			url: 'https://pardonmypicks.com/pmp_screenshot.png',
			width: 1200,
			height: 630,
			alt: 'Pardon My Picks'
		}
	};

	let pageMeta = $derived($page.data.meta);
	let meta = $derived(pageMeta ?? DEFAULT_META);

	const sideNavCollasped = writable(true);
	const currYear = writable(Number(PUBLIC_CURRENT_YEAR));
	const currWeek = writable(getCurrentWeek(Number(PUBLIC_CURRENT_YEAR)));
	const screenWidth = writable(0);
	const active = writable('');
	const fullPageHeight = writable(0);
	const alert: Writable<Alert> = writable({
		text: '',
		alertType: undefined
	});

	setContext('sideNavCollasped', sideNavCollasped);
	setContext('currWeek', currWeek);
	setContext('currYear', currYear);
	setContext('screenWidth', screenWidth);
	setContext('active', active);
	setContext('fullPageHeight', fullPageHeight);
	setContext('alert', alert);

	let scrollY: number = $state(0);
	let sidenavElement: HTMLElement | undefined = $state();

	let mobile = $derived($screenWidth < 640);

	const setSidenavActive = (currentPage: Page<Record<string, string>, string | null>) => {
		const route = currentPage.route.id;

		if (route && !currentPage.params.year && !currentPage.params.week) {
			active.set(route);
			return;
		}

		if (currentPage.params && currentPage.params.year && currentPage.params.week) {
			active.set(`/week`);
			return;
		}
	};

	$effect(() => {
		if ($page.route) {
			if ($page.route.id?.includes('week')) {
				active.set('Week');
			}
			if ($page.route.id?.includes('stats')) {
				active.set('Stats');
			}
		}
	});

	$effect(() => {
		setSidenavActive($page);
	});

	// Inject the Analytics functionality
	inject({ mode: dev ? 'development' : 'production' });

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
	<title>{pageMeta ? `${pageMeta.title} | Pardon My Picks` : 'Pardon My Picks'}</title>

	<!-- Meta Description -->
	<meta name="description" content={meta.description} />

	<!-- Keywords (Note: Google doesn't rely heavily on meta keywords, but they can still be used) -->
	<meta name="keywords" content="Pardon My Take, Football Picks, NFL Picks, Weekly Picks" />

	<!-- Canonical URL -->
	<link rel="canonical" href={meta.url} />

	<!-- Open Graph Meta Tags (for social media and search engines) -->
	<meta property="og:url" content={meta.url} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={meta.image.url} />
	<meta property="og:image:width" content={`${meta.image.width}`} />
	<meta property="og:image:height" content={`${meta.image.height}`} />
	<meta property="og:image:alt" content={meta.image.alt} />
	<meta property="og:site_name" content="Pardon My Picks" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image.url} />
	<meta name="twitter:image:alt" content={meta.image.alt} />
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
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
