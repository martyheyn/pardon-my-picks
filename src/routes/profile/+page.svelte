<script lang="ts">
	import { slide } from 'svelte/transition';
	import Icon from '../../lib/components/icon.svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	let editting = false;
	let infoDisplayed = false;
	let disableSave = false;
	let avatar, fileinput;

	const handleEdit = () => {
		disableSave = true;
		// Save changes if editting
		if (editting) {
			console.log(`save to db here`);
		}

		editting = !editting;

		setTimeout(() => {
			disableSave = false;
		}, 1000);
	};

	const onFileSelected = (e: any) => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (e) => {
			avatar = e.target && e.target.result;
		};
	};
</script>

<div class="flex flex-col gap-y-4">
	<div class="border border-black border-opacity-50 w-28 h-28 rounded-full group">
		<!-- <img src="" alt=""> -->
		<div class="w-full h-full rounded-full relative overflow-hidden">
			<form method="post" use:enhance enctype="multipart/form-data" class="w-full h-full">
				<label
					for="file"
					class="absolute -bottom-6 left-0 w-full h-1/2 bg-gray-300 bg-opacity-90 rounded-b-full
                    cursor-pointer opacity-0 group-hover:opacity-100 transition-all
                    duration-300 ease-in-out translate-y-4 group-hover:translate-y-0"
				>
					<div class="w-full h-full flex justify-center mt-1">
						<Icon
							class={`transition-all duration-300 ease-in-out cursor-pointer rounded-full ${
								editting ? '' : 'hover:scale-110'
							}`}
							width="24px"
							height="24px"
							iconName="upload"
						/>
					</div>
				</label>
				<input
					style="display:none"
					id="file"
					name="fileToUpload"
					disabled={editting}
					type="file"
					accept=".jpg, .jpeg, .png"
					on:change={(e) => onFileSelected(e)}
					bind:this={fileinput}
				/>
			</form>
		</div>
	</div>

	<div
		class="max-w-2xl border border-black border-opacity-50 rounded-md px-6 py-4 mt-4 flex flex-col gap-y-4"
	>
		<div class="flex">
			<h2 class="text-xl font-semibold">Profile Details</h2>
		</div>

		<div class="w-full flex flex-row gap-x-8">
			<div class="flex-1 flex flex-col justify-between">
				<label for="username" class="block text-sm font-medium text-gray-600"
					><span class="pl-1">Username</span>
				</label>

				{#if editting}
					<input
						id="username"
						name="username"
						type="text"
						class="mt-1 py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
						value={data.user.username}
					/>
				{:else}
					<p
						class="mt-1 bg-stone-50 py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
					>
						{data.user.username}
					</p>
				{/if}
			</div>

			<div class="flex-1">
				<label for="email" class="block text-sm font-medium text-gray-600">
					<div class="flex justify-between items-center pr-2">
						<span class="pl-1">Email</span>
						<button on:click={() => (infoDisplayed = !infoDisplayed)}>
							<Icon
								class={`transition-all duration-300 ease-in-out cursor-pointer rounded-full  hover:scale-110 `}
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
						class="text-xs py-1 px-[2px] text-slate-600"
						transition:slide={{ duration: 300, delay: 100 }}
					>
						In case you forget your password and want to reset it, please enter email. Otherwise,
						chill
					</p>
				{/if}

				{#if editting}
					<input
						id="email"
						name="email"
						type="email"
						class="mt-1 py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
					/>
				{:else}
					<p
						class="mt-1 bg-stone-50 py-2 indent-2 border focus:outline-none focus:border-blue-300 w-full rounded-md transition duration-150 ease-in-out"
					>
						Test Email
					</p>
				{/if}
			</div>
		</div>

		<button
			on:click={handleEdit}
			disabled={disableSave}
			class={`w-fit text-white ${
				disableSave ? 'bg-gray-400' : 'bg-primary hover:bg-primaryHover'
			} border rounded-md px-4 py-1.5 transition-all duration-200 ease-in-out`}
			>{editting ? 'Save Changes' : 'Edit Profile'}</button
		>
	</div>
</div>
