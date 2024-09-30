<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { User } from 'lucia';
	import { page } from '$app/stores';
	import { fade, slide } from 'svelte/transition';
	import { quintInOut } from 'svelte/easing';
	import { type sideNavItems } from '$lib/utils/sidenav-tree';

	import Icon from '../icon.svelte';
	import Tooltip from '../tooltip.svelte';

	export let user: User | null;

	// Retrieve user store from context
	const sideNavCollasped: Writable<boolean> = getContext('sideNavCollasped');
	const screenWidth: Writable<number> = getContext('screenWidth');
	const fullPageHeight: Writable<number> = getContext('fullPageHeight');
	const active: Writable<string> = getContext('active');
	$: mobile = $screenWidth && $screenWidth < 640;

	export let scrollY: number;
	export let sideNavItems: sideNavItems;

	const toggleSideNav = () => {
		sideNavCollasped.update((value) => !value);

		// close open subNav if closing sideNav
		if (sideNavCollasped) {
			sideNavItems.forEach((navItem, i) => {
				if (navItem.subItemsOpen) {
					navItem.subItemsOpen = false;
					sideNavItems[i].subItemsOpen = false;
				}
			});
		}
	};

	let sideNavHeight: number;

	const handleItemClick = (label: string) => {
		// set active store to label
		active.set(label);

		// if mobile close sidenav and open items
		if (mobile) {
			if (sideNavCollasped) {
				sideNavItems.forEach((navItem, i) => {
					if (navItem.subItemsOpen) {
						navItem.subItemsOpen = false;
						sideNavItems[i].subItemsOpen = false;
					}
				});
			}
			sideNavCollasped.set(true);
		}
	};

	const dayOfWeek = new Date().getDay();
	const pickemOpen = dayOfWeek !== 0 && dayOfWeek !== 1 && dayOfWeek !== 2;
	$: if (!pickemOpen) {
		sideNavItems = sideNavItems.filter((navItem) => navItem.label !== 'PickEm');
	}
</script>

<div
	class={`fixed top-0 bottom-0 ${$sideNavCollasped ? '' : 'overflow-y-auto'} z-50 ${
		$sideNavCollasped
			? 'w-14'
			: sideNavHeight > $fullPageHeight - 60 && !mobile
			? 'w-[164px] sm:w-44'
			: 'w-40'
	} ${mobile && $sideNavCollasped ? 'h-[56px]' : 'h-screen'}  ${
		mobile && $sideNavCollasped && scrollY > 50 ? 'bg-none' : 'bg-primary dark:bg-[#1f1f1f]'
	} shadow-[0.063rem 0 1.25rem 0 #8690a3] transition-all duration-500 ease-in-out text-white ${
		!mobile &&
		'scrollbar-thin scrollbar-thumb-[#8690a3] scrollbar-track-primary dark:scrollbar-thumb-[#8690a3] dark:scrollbar-track-[#1f1f1f]'
	}`}
>
	<button
		class={`h-14 w-full flex items-center ${
			$sideNavCollasped ? 'justify-center' : 'justify-end pr-3'
		} ${
			mobile && $sideNavCollasped && scrollY > 10
				? 'bg-primary dark:bg-[#1f1f1f] rounded-full border-2 border-slate-300 hover:bg-[#2a4f7b] hover:dark:bg-[#424141] translate-x-2 translate-y-2'
				: ''
		} transition-all duration-300 ease-in-out cursor-pointer relative`}
		on:click={toggleSideNav}
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
			<button class={`cursor-pointer h-full flex items-center`}>
				<Icon
					class={`transition-all duration-300 ease-in-out fill-white`}
					width="24px"
					height="24px"
					iconName="hambuger"
				/>
			</button>
		{:else}
			<button
				class={`cursor-pointer absolute top-1/2 -translate-y-1/2  ${
					$sideNavCollasped ? 'right-1/2 translate-x-1/2' : 'right-3'
				} transition-all duration-300 ease-in-out`}
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
	</button>

	<ul
		class={`list-none m-0 pt-[1px] flex flex-col items-center border-t border-t-white border-opacity-10 ${
			mobile && $sideNavCollasped ? 'hidden opacity-0' : 'block opacity-100'
		} transition-all duration-300 ease-in-out scrollbar-thin scrollbar-thumb-[#8690a3] scrollbar-track-primary dark:scrollbar-thumb-[#8690a3] dark:scrollbar-track-[#1f1f1f]`}
		bind:clientHeight={sideNavHeight}
	>
		{#each sideNavItems as navItem}
			<li
				class={`${
					navItem.label === 'Profile' && !user ? 'hidden' : 'block'
				} w-full py-2 hover:bg-[#b9bab6] hover:dark:bg-[#424141] relative 
				group flex justify-between items-center h-full font-header`}
			>
				{#if $sideNavCollasped}
					<Tooltip text={navItem.label} placement="right" />
				{/if}

				<a
					class={`w-full flex items-center h-12 no-underline transition-all duration-300 ease-in-out pl-[14px] relative`}
					href={navItem.label === 'Profile' && user
						? `${navItem.route}/${user.username}`
						: navItem.route}
				>
					<div
						class={`w-2 h-full bg-yellow-400 absolute left-0 top-0 rounded-r-md transition-all duration-300 ease-in-out ${
							$active === navItem.route
								? 'opacity-100'
								: $active === '/week' && navItem.label === 'Week'
								? 'opacity-100'
								: 'opacity-0'
						}`}
					/>

					<Icon
						class={`text-base w-8 min-w-[2rem] my-2 text-center cursor-pointer ${
							navItem.label === 'PickEm' ? 'fill-white' : 'fill-none'
						}`}
						iconName={navItem.icon}
						fillRule="evenodd"
						clipRule="evenodd"
						width="32px"
						height="32px"
					/>

					<div
						class={`${
							$sideNavCollasped
								? 'hidden opacity-0 delay-0'
								: 'block group-hover:opacity-100 group-hover:delay-300'
						} transition-all duration-300 ease-in-out w-full z-[999]`}
					>
						<p class={`ml-6`}>
							{navItem.label}
						</p>
					</div>
				</a>

				{#if navItem.subItems}
					<button
						on:click={() => !$sideNavCollasped && (navItem.subItemsOpen = !navItem.subItemsOpen)}
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
			{#if navItem.subItemsOpen && navItem.subItems}
				<div class="pt-.5 pl-2 w-full" transition:slide={{ duration: 400, easing: quintInOut }}>
					{#each navItem.subItems as subItem}
						<li
							class={`w-full py-2 hover:text-yellow-400 flex justify-between items-center
							transition-all duration-100 ease-linear relative font-paragraph ${
								subItem.route === `/${$page.params.year}/${$page.params.week}`
									? 'text-yellow-300'
									: ''
							}`}
						>
							<a
								class={`w-full flex items-center justify-center no-underline transition-all duration-300 ease-in-out relative`}
								href={subItem.route}
								on:click={() => handleItemClick(navItem.label)}
							>
								<div class={`w-full flex items-cente lg:justify-between h-full pl-6`}>
									<p class={``}>
										<span class="px-3">-</span>{subItem.label}
									</p>
								</div>
							</a>

							{#if subItem.subItems}
								<button
									on:click={() =>
										!$sideNavCollasped && (subItem.subItemsOpen = !subItem.subItemsOpen)}
									class={`${
										$sideNavCollasped ? 'opacity-0 delay-0' : 'opacity-100 delay-300'
									} pr-3`}
								>
									<Icon
										class={`${
											subItem.subItemsOpen ? 'rotate-[270deg]' : 'rotate-90'
										} transition-all duration-300 ease-in-out fill-none`}
										width="20px"
										height="20px"
										iconName="arrow"
									/>
								</button>
							{/if}
						</li>

						<!-- Submenu -->
						{#if subItem.subItemsOpen && subItem.subItems}
							<div
								class="pt-.5 pl-2 w-full"
								transition:slide={{ duration: 400, easing: quintInOut }}
							>
								{#each subItem.subItems as subSubItem}
									<li
										class={`w-full py-2 hover:text-yellow-400 flex justify-between items-center
										transition-all duration-100 ease-linear relative font-paragraph ${
											subSubItem.route === `/${$page.params.year}/${$page.params.week}`
												? 'text-yellow-300'
												: ''
										}`}
									>
										<a
											class={`w-full flex items-center justify-center no-underline transition-all duration-300 ease-in-out relative`}
											href={subSubItem.route}
											on:click={() => handleItemClick(navItem.label)}
										>
											<div class={`w-full flex items-cente lg:justify-between h-full pl-6`}>
												<p class={``}>
													<span class="px-3">-</span>{subSubItem.label}
												</p>
											</div>
										</a>
									</li>
								{/each}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		{/each}
	</ul>
</div>
