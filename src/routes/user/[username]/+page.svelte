<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import Icon from '../../../lib/components/icon.svelte';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import AlertFlash from '$lib/components/alert.svelte';
	import type { Alert } from '$lib/utils/types';
	import type { Writable } from 'svelte/store';
	import { getContext } from 'svelte';
	import { linear, quadInOut } from 'svelte/easing';
	import { PUBLIC_AWS_CLOUDFRONT_DISTRO } from '$env/static/public';

	import blankAvatar from '$lib/assets/blank_avatar.png';
	import { logo, teamLink } from '$lib/utils/matching-format';

	export let data: PageData;
	export let form: ActionData;

	$: ({ user, stats, picks, usersProfile } = data);

	const alert: Writable<Alert> = getContext('alert');
	const currWeek: Writable<number> = getContext('currWeek');

	let editting = false;
	let infoDisplayed = false;
	let disableSave = false;
	let selectedWeekPicks: number = $currWeek;
	// get all unique weeks from picks
	$: weekPicks = Array.from(new Set(picks.map((p) => p.week)));
	let photoKey: string | undefined;
	$: photoKey = user.avatar;

	let avatar: File | undefined;

	const handleEdit = () => {
		disableSave = true;

		editting = !editting;

		setTimeout(() => {
			disableSave = false;
		}, 500);
	};

	const onFileSelected = async (e: Event) => {
		console.log('file selected', e);
		let input = e.target as HTMLInputElement;
		let image = input.files?.[0];
		if (!image) return;

		const maxSize = parseInt(input.dataset.maxSize || '1048576', 10);
		if (image.size > maxSize) {
			alert.set({
				text: 'File size is too large. Please upload a file less than 1MB',
				alertType: 'error'
			});
			return;
		}

		avatar = image;
	};

	const updateProfilePic = () => {
		avatar = undefined;
	};

	const showWeekPicks = (weekNum: number) => {
		if (selectedWeekPicks === weekNum) {
			selectedWeekPicks = -999;
			return;
		}
		selectedWeekPicks = weekNum;
	};

	// update alert based on form response
	// TODO:: clean this up, maybe put it in a function somewhere else
	const updateAlert = () => {
		if (form) {
			alert.set({
				text: form.message,
				alertType: form.success ? 'success' : 'error'
			});
		}
		return;
	};
	// alerts
	$: form, updateAlert();
</script>

<div
	class="flex flex-col gap-y-4"
	in:fade={{ duration: 400, easing: quadInOut, delay: 200 }}
	out:fade={{ duration: 150, easing: linear }}
>
	<div class="flex flex-col gap-y-4">
		<h1 class="text-3xl font-semibold">{user.username}</h1>
		{#if usersProfile}
			<form
				method="POST"
				action={`?/uploadPic`}
				enctype="multipart/form-data"
				use:enhance={updateProfilePic}
				class="w-full h-full"
			>
				<div class="border border-black border-opacity-50 w-28 h-28 rounded-full group">
					<div class="w-full h-full rounded-full relative overflow-hidden">
						{#if photoKey}
							<img
								src={`${PUBLIC_AWS_CLOUDFRONT_DISTRO}${photoKey}`}
								alt="profile picture"
								class="w-full h-full object-cover z-10"
								aria-hidden="true"
							/>
						{:else}
							<img src={blankAvatar} alt="blank avatar" class="w-full h-full opacity-70 z-0" />
						{/if}

						<label
							for="avatar"
							class="absolute -bottom-6 left-0 w-full h-1/2 bg-gray-300 bg-opacity-90 rounded-b-full
                    cursor-pointer opacity-0 group-hover:opacity-100 transition-all
                    duration-300 ease-in-out translate-y-4 group-hover:translate-y-0 z-20"
						>
							<div class="w-full h-full flex justify-center mt-1">
								<Icon
									class={`transition-all duration-300 ease-in-out cursor-pointer rounded-full 
								${editting ? '' : 'hover:scale-110'}`}
									width="24px"
									height="24px"
									iconName="upload"
								/>
							</div>
						</label>
						<input
							style="display:none"
							id="avatar"
							name="avatar"
							disabled={editting}
							type="file"
							accept=".jpg, .jpeg, .png"
							data-max-size="1048576"
							on:change={(e) => onFileSelected(e)}
						/>
						<input type="hidden" name="photoKey" id="photoKey" bind:value={photoKey} />
					</div>
				</div>

				{#if avatar}
					<button
						in:fly={{ x: -40, duration: 300, delay: 100 }}
						disabled={disableSave}
						class={`mt-4 w-fit text-white z-20  ${
							disableSave ? 'bg-gray-400' : 'bg-primary hover:bg-primaryHover'
						} border rounded-md px-4 py-1.5 transition-all duration-200 ease-in-out`}
						>Save Avatar</button
					>
				{/if}
			</form>
		{:else}
			<div class="w-28 h-28 rounded-full relative overflow-hidden">
				{#if photoKey}
					<img
						src={`${PUBLIC_AWS_CLOUDFRONT_DISTRO}${photoKey}`}
						alt="profile picture"
						class="w-full h-full object-cover z-10"
						aria-hidden="true"
					/>
				{:else}
					<img src={blankAvatar} alt="blank avatar" class="w-full h-full opacity-70 z-0" />
				{/if}
			</div>
		{/if}
	</div>

	{#if form?.uploadPic}
		<div transition:fly={{ x: -50, duration: 300, delay: 50 }} class="max-w-2xl">
			<AlertFlash />
		</div>
	{/if}

	{#if usersProfile}
		<div class="max-w-2xl card">
			{#if !form?.uploadPic}
				<div
					class={`${!form?.uploadPic ? '-mb-4' : ''}`}
					transition:fly={{ x: -50, duration: 300, delay: 50 }}
				>
					<AlertFlash />
				</div>
			{/if}

			<div class="flex">
				<h2 class="text-xl font-semibold">Profile Details</h2>
			</div>

			<form method="POST" action="?/updateUserData" use:enhance={handleEdit} class="w-full h-full">
				<div class="w-full flex flex-row gap-x-8">
					<div class="flex-1">
						<label
							for="username"
							class="block text-sm font-medium text-muteTextColor dark:text-darkMuteTextColor"
						>
							<div class="flex justify-between items-center pr-2">
								<span class="pl-1">Username</span>
							</div>
						</label>
						<input
							id="username"
							name="username"
							type="text"
							class={`mt-1 py-2 indent-2 border focus:outline-none focus:border-blue-300 focus:dark:border-gray-300
						w-full rounded-md transition duration-150 ease-in-out dark:bg-dark focus:dark:bg-gray-600
						bg-stone-50`}
							disabled={!editting}
							bind:value={user.username}
						/>
					</div>

					<div class="flex-1">
						<label
							for="email"
							class="block text-sm font-medium text-muteTextColor dark:text-darkMuteTextColor"
						>
							<div class="flex justify-between items-center pr-2">
								<span class="pl-1">Email</span>
								<button on:click={() => (infoDisplayed = !infoDisplayed)} type="button">
									<Icon
										class={`transition-all duration-300 ease-in-out cursor-pointer rounded-full hover:scale-110 `}
										fillRule="evenodd"
										clipRule="evenodd"
										width="16px"
										height="16px"
										iconName="info"
									/>
								</button>
							</div>
						</label>
						{#if infoDisplayed}
							<p
								class="text-xs py-1 px-[2px] text-red-400"
								transition:slide={{ duration: 300, delay: 100 }}
							>
								In case you forget your password and want to reset it, please enter email.
								Otherwise, chill
							</p>
						{/if}

						<input
							id="email"
							name="email"
							type="email"
							class={`mt-1 py-2 indent-2 border focus:outline-none focus:border-blue-300 focus:dark:border-gray-300
						w-full rounded-md transition duration-150 ease-in-out dark:bg-dark focus:dark:bg-gray-600
						bg-stone-50`}
							disabled={!editting}
							bind:value={user.email}
						/>
					</div>
				</div>

				<div class={`flex ${editting ? 'justify-between' : 'justify-start'}`}>
					<button
						in:fly={{ x: -40, duration: 300, delay: 750 }}
						on:click={handleEdit}
						disabled={disableSave}
						class={`mt-4 ${disableSave && 'bg-gray-400'} btn-primary`}
						>{editting ? 'Cancel' : 'Edit Profile'}</button
					>
					{#if editting}
						<button
							in:fly={{ x: 40, duration: 300, delay: 100 }}
							disabled={disableSave}
							class={`mt-4 w-fit text-white ${disableSave && 'bg-gray-400'} btn-primary`}
							>Save Profile</button
						>
					{/if}
				</div>
			</form>
		</div>
	{/if}

	<div class="max-w-2xl card">
		<div class="flex">
			<h2 class="text-xl font-semibold">Stats</h2>
		</div>

		<div class="flex flex-row items-center gap-x-20">
			<div class="flex flex-col gap-y-2">
				<h2 class="text-lg mb-1 border-b border-black border-opacity-25">Tailed Picks</h2>

				<p class="text-[16px] leading-4">
					Total Tailed: <span class="text-lg font-semibold ml-2 leading-4">
						{stats?.tails.total}
					</span>
				</p>
				<p class="text-[16px] leading-4">
					Tail Record: <span class="text-lg font-semibold ml-2 leading-4">
						{stats?.tails.wins} - {stats?.tails.losses}
					</span>
				</p>
				<p class="text-[16px] leading-4">
					Tail Hit Rate: <span
						class={`text-lg font-semibold ml-2 leading-4 ${
							(stats?.tails.wins / stats.tails.total) * 100 > 50
								? 'text-green-500 dark:text-green-300'
								: (stats?.tails.wins / stats.tails.total) * 100 < 50
								? 'text-red-500 dark:text-red-300'
								: 'text-yellow-500 dark:text-yellow-300'
						}`}
					>
						{stats?.tails.total
							? `${((stats?.tails.wins / stats.tails.total) * 100).toFixed(2)} %`
							: 'NA'}
					</span>
				</p>
			</div>

			<div class="flex flex-col gap-y-2">
				<h2 class="text-lg mb-1 border-b border-black border-opacity-25">Faded Picks</h2>

				<p class="text-[16px] leading-4">
					Total Faded: <span class="text-lg font-semibold ml-2 leading-4">
						{stats?.fades.total}
					</span>
				</p>
				<p class="text-[16px] leading-4">
					Fade Record: <span class="text-lg font-semibold ml-2 leading-4">
						{stats?.fades.wins} - {stats?.fades.losses}
					</span>
				</p>
				<p class="text-[16px] leading-4">
					Fade Hit Rate: <span
						class={`text-lg font-semibold ml-2 leading-4 ${
							(stats?.fades.wins / stats.fades.total) * 100 > 50
								? 'text-green-500 dark:text-green-300'
								: (stats?.fades.wins / stats.fades.total) * 100 < 50
								? 'text-red-500 dark:text-red-300'
								: 'text-yellow-500 dark:text-yellow-300'
						}`}
					>
						{stats?.fades.total
							? `${((stats?.fades.wins / stats.fades.total) * 100).toFixed(2)} %`
							: 'NA'}
					</span>
				</p>
			</div>
		</div>
	</div>

	<div class="max-w-2xl card gap-y-1.5">
		<div class="flex">
			<h2 class="text-xl font-semibold mb-2">Picks</h2>
		</div>

		{#each weekPicks as week}
			<div
				class="my-.5 p-4 rounded-md border border-black border-opacity-20
					dark:border-white dark:border-opacity-100"
			>
				{#if week}
					<div
						class={`flex justify-between items-center ${
							selectedWeekPicks === week ? 'mb-1.5' : ''
						}`}
					>
						<h4 class="text-lg font-semibold">Week {week}</h4>
						<button on:click={() => showWeekPicks(week)}>
							<Icon
								class={`${
									selectedWeekPicks === week ? 'rotate-[270deg]' : 'rotate-90'
								} transition-all duration-300 ease-in-out`}
								width="28px"
								height="28px"
								iconName="arrow"
							/>
						</button>
					</div>
				{/if}

				{#if selectedWeekPicks === week}
					<div
						class="grid grid-cols-1 gap-2 md:gap-4 transition-all ease-in-out duration-300"
						transition:slide={{ duration: 300, easing: quadInOut }}
					>
						{#each picks as pick}
							{#if pick.week === week}
								<div
									class="rounded-md border border-gray-800 border-opacity-20 dark:border-white
								dark:border-opacity-60 shadow-lg px-4 lg:px-8 py-4 lg:py-6 flex flex-row gap-x-8
								justify-between items-center gap-y-4 font-paragraph relative transition-all duration-300 ease-in-out"
								>
									<div class=" max-w-64">
										<h4
											class={`py-2 px-4 text-lg shadow-lg dark:text-white ${
												pick.homeTeamScore === null || pick.homeTeamScore === undefined
													? 'bg-slate-300 bg-opacity-70'
													: pick.winner
													? 'bg-lightGreen dark:bg-darkGreen'
													: pick.push
													? 'bg-lightYellow dark:bg-darkYellow'
													: 'bg-lightRed dark:bg-darkRed'
											} w-fit rounded-md flex justify-start items-center`}
										>
											{pick.description}
										</h4>
									</div>

									<div class="flex justify-between gap-x-4 md:gap-x-8 items-center">
										<div class="flex flex-col items-center gap-2">
											<a href={`${teamLink[pick.awayTeam]}`} target="_blank" rel="noopener">
												<img src={logo[pick.awayTeam]} alt="helmet" class="w-10 h-10" />
											</a>
											{#if pick.homeTeamScore !== null && pick.awayTeamScore !== null}
												<p
													class={`${
														pick.homeTeamScore - pick.awayTeamScore > 0 ? '' : 'font-bold'
													} ${pick.isLive ? ' font-normal' : ''} text-lg`}
												>
													{pick.awayTeamScore}
												</p>
											{/if}
										</div>

										<div>
											<p class="font-semibold">@</p>
										</div>

										<div class="flex flex-col items-center gap-2">
											<a href={`${teamLink[pick.homeTeam]}`} target="_blank" rel="noopener">
												<img src={logo[pick.homeTeam]} alt="helmet" class="w-10 h-10" />
											</a>

											{#if pick.homeTeamScore !== null && pick.awayTeamScore !== null}
												<p
													class={`${
														!pick.isLive && pick.homeTeamScore - pick.awayTeamScore > 0
															? 'font-bold'
															: ''
													} text-lg`}
												>
													{pick.homeTeamScore}
												</p>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
