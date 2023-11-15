<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quadInOut } from 'svelte/easing';
	import Icon from '../icon.svelte';

	let showSocials = false;
</script>

<div
	class="bg-[#18314FFF] dark:bg-[#1f1f1f] ml-14 h-14 flex justify-center items-center relative text-white"
>
	<h2 class=" text-lg pr-12 lg:pr-32 font-header transition-all duration-300 ease-in-out">
		Pardon My Picks
	</h2>

	<div class="absolute right-4 lg:right-12 top-[8px] transition-all duration-300 ease-in-out">
		<button class="cursor-pointer" on:click={() => (showSocials = !showSocials)}>
			<img
				class="w-10 h-10 rounded-[20px] border-2 border-white"
				src="$lib/assets/pmt-icon.jpg"
				alt=""
			/>
		</button>
	</div>

	{#if showSocials}
		<div
			class="absolute right-0 top-14 bg-[#18314FFF] dark:bg-[#1f1f1f] z-50"
			transition:fly={{ x: 100, duration: 300, easing: quadInOut }}
		>
			<ul class="">
				<li
					class="py-1.5 hover:bg-[#2f5583] hover:dark:bg-[#424141] pr-6 pl-3 border-b border-b-white border-t border-t-white border-opacity-30"
				>
					<a
						href="https://twitter.com/PardonMyTake"
						class="flex gap-x-4 items-center"
						target="_blank"
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-white`}
							width="20px"
							height="20px"
							iconName="twitter"
						/>
						Twitter</a
					>
				</li>
				<li
					class="py-1.5 hover:bg-[#2f5583] hover:dark:bg-[#424141] pr-6 pl-3 border-b border-b-white border-opacity-30"
				>
					<a
						href="https://www.youtube.com/@PardonMyTakePodcast"
						class="flex gap-x-4 items-center"
						target="_blank"
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-white`}
							width="20px"
							height="20px"
							iconName="youtube"
						/>
						Youtube</a
					>
				</li>
				<li
					class="py-1.5 hover:bg-[#2f5583] hover:dark:bg-[#424141] pr-6 pl-3 border-b border-b-white border-opacity-30"
				>
					<a
						href="https://www.instagram.com/pardonmytake/"
						class="flex gap-x-4 items-center"
						target="_blank"
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-white`}
							width="20px"
							height="20px"
							iconName="instagram"
						/>
						Instagram</a
					>
				</li>
				<li
					class="py-1.5 hover:bg-[#2f5583] hover:dark:bg-[#424141] pr-6 pl-3 border-b border-b-white border-opacity-30"
				>
					<a
						href="https://open.spotify.com/show/5ss1pqMFqWjkOpt6Ag0fZW?si=c44b4e44e8c04e90&nd=1"
						target="_blank"
						class="flex gap-x-4 items-center"
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-white`}
							width="20px"
							height="20px"
							iconName="spotify"
						/>
						Spotify</a
					>
				</li>

				<li
					class="py-1.5 hover:bg-[#2f5583] hover:dark:bg-[#424141] pr-6 pl-3 border-b border-b-white border-opacity-30"
				>
					<a
						href="https://podcasts.apple.com/us/podcast/pardon-my-take/id1089022756"
						target="_blank"
						class="flex gap-x-4 items-center"
					>
						<Icon
							class={`transition-all duration-300 ease-in-out fill-white`}
							width="20px"
							height="20px"
							iconName="apple"
						/>
						Apple</a
					>
				</li>
			</ul>
		</div>
	{/if}
</div>
