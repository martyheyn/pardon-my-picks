<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quadInOut } from 'svelte/easing';
	import Icon from '../icon.svelte';

	import SignInModal from '../modal.svelte';
	import LoginModal from '../signup/login-modal.svelte';
	import Login from '../signup/login.svelte';
	import Signup from '../signup/signup.svelte';

	let showSocials = false;
	let showModal = true;
	let loginStep = 1;
	let modalInfo: {
		header: string;
		description: string;
		footer: string;
		alt: string;
		nextStep: number;
	};

	$: if (loginStep === 1) {
		modalInfo = {
			header: 'Log In',
			description: 'Log in to view your picks and more.',
			footer: "Don't have an account?",
			alt: 'Sign up',
			nextStep: 2
		};
	} else {
		modalInfo = {
			header: 'Sign Up',
			description: 'Sign up to view your picks and more.',
			footer: 'Got an account already?',
			alt: 'Log in',
			nextStep: 1
		};
	}
</script>

<div
	class="bg-primary dark:bg-[#1f1f1f] ml-14 h-14 flex justify-center items-center relative text-white"
>
	<h2 class=" text-lg pr-12 lg:pr-24 font-header transition-all duration-300 ease-in-out">
		Pardon My Picks
	</h2>

	<div
		class="absolute right-4 lg:right-12 top-[8px] transition-all duration-300 ease-in-out flex gap-x-3"
	>
		<button
			class="border border-white rounded-md px-4 py-1.5 hover:bg-primaryHover transition-all duration-200 ease-in-out"
			on:click={() => (showModal = true)}>Log In</button
		>

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
			class="absolute right-0 top-14 bg-primary dark:bg-[#1f1f1f] z-50"
			transition:fly={{ y: -50, duration: 300, easing: quadInOut }}
		>
			<ul class="">
				<li
					class="py-1.5 hover:bg-[#2f5583] hover:dark:bg-[#424141] pr-6 pl-3 border-b border-b-white border-t border-t-white border-opacity-30"
				>
					<a
						href="https://twitter.com/PardonMyTake"
						class="flex gap-x-4 items-center"
						target="_blank"
						rel="noopener"
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
						rel="noopener"
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
						rel="noopener"
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
						rel="noopener"
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
						rel="noopener"
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

<SignInModal bind:showModal>
	<LoginModal bind:loginStep {modalInfo}>
		{#if loginStep === 1}
			<Login />
		{:else}
			<Signup />
		{/if}
	</LoginModal>
</SignInModal>
