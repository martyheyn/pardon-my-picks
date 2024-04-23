<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ odds } = data);
	$: console.log('odds', odds);
</script>

<div class="">
	<h1>Place your picks here</h1>

	<div
		class="grid grid-cols-1 md:grid-cols-2 my-8 md:gap-x-6 gap-y-6 max-w-6xl font-paragraph transition-all duration-300 ease-in-out"
	>
		{#if odds !== undefined}
			{#each odds as odd}
				<div class="card pb-4 pt-2 min-w-[360px]">
					<div class="grid grid-cols-8 gap-x-4">
						<div class="col-span-3 grid grid-rows-3 place-content-start w-full">
							<div />
							<div class="flex justify-start items-center">
								<p class="">{odd.away_team}</p>
							</div>
							<div class="flex justify-start items-center">
								<p class="">{odd.home_team}</p>
							</div>
						</div>

						<div class="w-full col-span-5 flex flex-row gap-x-6 justify-end">
							{#each odd.bookmakers[0].markets as bets}
								<div class="grid grid-rows-3 gap-y-4 place-content-center">
									<div class="flex justify-center items-center font-header font-semibold text-lg">
										{bets.key.charAt(0).toUpperCase() + bets.key.slice(1)}
									</div>
									{#each bets.outcomes as outcome}
										<div class="">
											<button
												class="w-full p-4 rounded-md bg-gray-200 hover:bg-gray-300 transition-all duration-300 ease-in-out"
												>{bets.key === 'spreads' && outcome.point > 0
													? `+${outcome.point}`
													: outcome.point}</button
											>
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
