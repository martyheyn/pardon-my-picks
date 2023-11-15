<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { fade, slide } from 'svelte/transition';
	import { quintInOut } from 'svelte/easing';

	import Icon from '../icon.svelte';
	import { sideNavItems } from '../../utils/sidenav-tree';
	import Tooltip from '../tooltip.svelte';

	// Retrieve user store from context
	const sideNavCollasped: Writable<boolean> = getContext('sideNavCollasped');
	export let mobile: boolean;
	export let scrollY: number;

	const toggleSideNav = () => {
		sideNavCollasped.update((value) => !value);

		// close open subNav if closing sideNav
		if (sideNavCollasped) {
			sideNavItems.forEach((navItem, i) => {
				if (navItem.subItemsOpen) {
					sideNavItems[i].subItemsOpen = false;
				}
			});
		}
	};

	let active = '';
	let sideNavHeight: number;

	onMount(() => {
		// get current year
		const currentYear = new Date().getFullYear();
		if ($page.route.id?.includes('year')) {
			if ($page.params.year === currentYear.toString()) {
				active = 'Week';
			} else {
				active = 'History';
			}
		}

		if ($page.route.id?.includes('person')) {
			active = 'Person';
		}

		if ($page.route.id?.includes('stats')) {
			active = 'Stats';
		}
	});

	const handleItemClick = (label: string) => {
		active = label;

		// if mobile close sidenav and open items
		if (mobile) {
			if (sideNavCollasped) {
				sideNavItems.forEach((navItem, i) => {
					if (navItem.subItemsOpen) {
						sideNavItems[i].subItemsOpen = false;
					}
				});
			}
			sideNavCollasped.set(true);
		}
	};
</script>

<div
	class={`fixed top-0 z-10 ${
		$sideNavCollasped ? 'w-14' : sideNavHeight > 800 ? 'w-[164px] sm:w-44' : 'w-40'
	} ${mobile && $sideNavCollasped ? 'h-[56px]' : 'h-screen'} ${
		mobile && $sideNavCollasped && scrollY > 50 ? 'bg-none' : 'bg-[#18314FFF] dark:bg-[#1f1f1f]'
	} shadow-[0.063rem 0 1.25rem 0 #8690a3] transition-all duration-500 ease-in-out text-white`}
	id="elementToCheck"
>
	<div
		class={`h-14 w-full flex ${$sideNavCollasped ? 'justify-center' : 'justify-end pr-3'} ${
			mobile && $sideNavCollasped && scrollY > 50
				? 'bg-[#18314FFF] dark:bg-[#1f1f1f] rounded-full border-2 border-slate-300 hover:bg-[#2a4f7b] hover:dark:bg-[#424141] translate-x-2 translate-y-2'
				: ''
		} transition-all duration-300 ease-in-out cursor-pointer`}
	>
		{#if !$sideNavCollasped}
			<p
				class={`w-full flex justify-center items-center font-header`}
				in:fade={{ delay: 350, duration: 300, easing: quintInOut }}
				out:fade={{ duration: 300, easing: quintInOut }}
			>
				Sup ...
			</p>
		{/if}

		{#if mobile}
			<button class={`cursor-pointer h-full flex items-center`} on:click={toggleSideNav}>
				<Icon
					class={`transition-all duration-300 ease-in-out fill-white`}
					width="24px"
					height="24px"
					iconName="hambuger"
				/>
			</button>
		{:else}
			<button
				class={`cursor-pointer h-full flex items-center transition-all duration-300 ease-in-out`}
				on:click={toggleSideNav}
			>
				<Icon
					class={`${
						$sideNavCollasped ? '' : 'rotate-180'
					} transition-all duration-300 ease-in-out fill-none`}
					width="24px"
					height="24px"
					iconName="arrow"
				/>
			</button>
		{/if}
	</div>

	<ul
		class={`list-none m-0 pt-[1px] flex flex-col items-center border-t border-t-white border-opacity-10 ${
			mobile && $sideNavCollasped ? 'hidden' : 'block'
		}`}
		bind:clientHeight={sideNavHeight}
	>
		{#each sideNavItems as navItem}
			<li
				class="w-full py-2 hover:bg-[#b9bab6] hover:dark:bg-[#424141] relative group flex justify-between items-center h-full font-header"
			>
				{#if $sideNavCollasped}
					<Tooltip text={navItem.label} placement="right" />
				{/if}

				<a
					class={`w-full flex items-center h-12 no-underline transition-all duration-300 ease-in-out pl-[14px] relative`}
					href={navItem.route}
					on:click={() => handleItemClick(navItem.label)}
				>
					<div
						class={`w-2 h-full bg-yellow-400 absolute left-0 top-0 rounded-r-md transition-all duration-300 ease-in-out ${
							active === navItem.label ? 'opacity-100' : 'opacity-0'
						}`}
					/>

					<Icon
						class="text-base w-8 min-w-[2rem] my-2 text-center cursor-pointer fill-none"
						iconName={navItem.icon}
						width="32px"
						height="32px"
					/>

					<div
						class={`${
							$sideNavCollasped ? 'opacity-0 delay-0' : 'opacity-100 delay-300'
						} transition-all duration-300 ease-in-out w-full`}
					>
						<p class={`ml-6`}>
							{navItem.label}
						</p>
					</div>
				</a>

				{#if navItem.subItems}
					<button
						on:click={() => (navItem.subItemsOpen = !navItem.subItemsOpen)}
						class={`${$sideNavCollasped ? 'opacity-0 delay-0' : 'opacity-100 delay-300'} pr-3`}
					>
						<Icon
							class={`${
								navItem.subItemsOpen ? 'rotate-[270deg]' : 'rotate-90'
							} transition-all duration-300 ease-in-out fill-none`}
							width="20px"
							height="20px"
							iconName="arrow"
						/>
					</button>
				{/if}
			</li>

			<!-- Submenu -->
			{#if navItem.subItemsOpen}
				<div class="pt-.5 pl-2 w-full" transition:slide={{ duration: 400, easing: quintInOut }}>
					{#each navItem.subItems as subItem}
						<li
							class={`w-full py-2 hover:text-yellow-400 transition-all duration-100 ease-linear relative font-paragraph ${
								subItem.route === `/${$page.params.year}/${$page.params.week}`
									? 'text-yellow-300'
									: ''
							}`}
						>
							<a
								class={`w-full flex items-center justify-center no-underline transition-all duration-300 ease-in-out relative`}
								href={subItem.route}
							>
								<div class={`w-full flex items-cente lg:justify-between h-full pl-6`}>
									<p class={``}>
										<span class="px-3">-</span>{subItem.label}
									</p>
								</div>
							</a>
						</li>
					{/each}
				</div>
			{/if}
		{/each}
	</ul>
</div>
