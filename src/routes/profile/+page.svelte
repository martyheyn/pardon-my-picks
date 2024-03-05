<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import Icon from '../../lib/components/icon.svelte';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import AlertFlash from '$lib/components/alert.svelte';
	import type { Alert } from '$lib/utils/alert';
	import { callAlert } from '$lib/utils/alert';

	export let data: PageData;
	export let form: ActionData;

	$: ({ user } = data);

	let editting = false;
	let infoDisplayed = false;
	let disableSave = false;
	let avatar;
	let alert: Alert;
	let fileinput: HTMLInputElement;

	const handleEdit = () => {
		disableSave = true;

		editting = !editting;

		setTimeout(() => {
			disableSave = false;
		}, 500);
	};

	const onFileSelected = (e: Event) => {
		console.log('file selected', e);
		let image = (e.target as HTMLInputElement)?.files?.[0];
		if (!image) return;

		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (e) => {
			avatar = image;
		};

		// submit the form
		if (fileinput.form) {
			fileinput.form.submit();
		}
	};

	// update alert based on form response
	// TODO:: clean this up, maybe put it in a function somewhere else
	$: {
		if (form) {
			alert = callAlert(form.message, form.success);
			setTimeout(() => {
				alert = { text: undefined, alertType: undefined };
			}, 3000);
		}
	}

	$: console.log('formData', form);
</script>

<div class="flex flex-col gap-y-4">
	<div class="border border-black border-opacity-50 w-28 h-28 rounded-full group">
		<!-- <img src="" alt=""> -->
		<div class="w-full h-full rounded-full relative overflow-hidden">
			<form
				method="POST"
				action="?/uploadPic"
				use:enhance
				enctype="multipart/form-data"
				class="w-full h-full"
			>
				<label
					for="avatar"
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
					id="avatar"
					name="avatar"
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
		<!-- add breadcrumb for when it saves correctly -->
		{#if alert && alert.text}
			<AlertFlash text={alert.text} alertType={alert.alertType} />
		{/if}

		<div class="flex">
			<h2 class="text-xl font-semibold">Profile Details</h2>
		</div>

		<form
			method="POST"
			action="?/updateUserData"
			use:enhance={() => {
				handleEdit();
			}}
			class="w-full h-full"
		>
			<div class="w-full flex flex-row gap-x-8">
				<div class="flex-1">
					<label for="username" class="block text-sm font-medium text-gray-600">
						<div class="flex justify-between items-center pr-2">
							<span class="pl-1">Username</span>
						</div>
					</label>
					<input
						id="username"
						name="username"
						type="text"
						class={`mt-1 py-2 indent-2 border focus:outline-none focus:border-blue-300 
						w-full rounded-md transition duration-150 ease-in-out ${editting ? '' : 'bg-stone-50'}`}
						disabled={!editting}
						bind:value={user.username}
					/>
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
							class="text-xs py-1 px-[2px] text-red-400"
							transition:slide={{ duration: 300, delay: 100 }}
						>
							In case you forget your password and want to reset it, please enter email. Otherwise,
							chill
						</p>
					{/if}

					<input
						id="email"
						name="email"
						type="email"
						class={`mt-1 py-2 indent-2 border focus:outline-none focus:border-blue-300 
						w-full rounded-md transition duration-150 ease-in-out ${editting ? '' : 'bg-stone-50'}`}
						disabled={!editting}
						bind:value={user.email}
					/>
				</div>
			</div>

			<div class={`flex ${editting ? 'justify-end' : 'justify-start'}`}>
				{#if !editting}
					<button
						in:fly={{ x: -40, duration: 300, delay: 750 }}
						on:click={handleEdit}
						disabled={disableSave}
						class={`mt-4 w-fit text-white ${
							disableSave ? 'bg-gray-400' : 'bg-primary hover:bg-primaryHover'
						} border rounded-md px-4 py-1.5 transition-all duration-200 ease-in-out`}
						>Edit Profile</button
					>
				{:else}
					<button
						in:fly={{ x: 40, duration: 300, delay: 100 }}
						disabled={disableSave}
						class={`mt-4 w-fit text-white ${
							disableSave ? 'bg-gray-400' : 'bg-primary hover:bg-primaryHover'
						} border rounded-md px-4 py-1.5 transition-all duration-200 ease-in-out`}
						>Save Profile</button
					>
				{/if}
			</div>
		</form>
	</div>
</div>
