<script>
	import MetricAmount from '$comps/elements/metrics/MetricAmount.svelte';
	import MetricProgress from '$comps/elements/metrics/MetricProgress.svelte';
</script>

<div class="space-y-4">
	<h2 class="text-center text-xl leading-none font-medium">Savings</h2>
	<div class="flex gap-4">
		<MetricAmount amount="R 12 345 678.90" label="Projected" icon="pie-chart" class="flex-1" />
		<MetricAmount amount="R 12,345.67" label="Actual" icon="bank" class="flex-1" />
	</div>
	<h2 class="text-center text-xl leading-none font-medium">Incomes</h2>
	<div class="flex gap-4">
		<MetricAmount amount="R 12 345 678.90" label="Salary" icon="calendar-range" class="flex-1" />
		<MetricAmount amount="R 12,345.67" label="Once-off" icon="money" class="flex-1" />
	</div>
	<h2 class="text-center text-xl leading-none font-medium">Expenses</h2>
	<div class="flex flex-wrap justify-center gap-4">
		<MetricAmount amount="R 12 345 678.90" label="Fixed" icon="lock" class="w-[calc(50%-0.5rem)]" />
		<MetricAmount amount="R 12,345.67" label="Variable" icon="arrows-up-down" class="w-[calc(50%-0.5rem)]" />
		<MetricAmount amount="R 12,345.67" label="Incidental" icon="exclamation-triangle" class="w-[calc(50%-0.5rem)]" />
	</div>
    <h2 class="text-center text-xl leading-none font-medium">Budget Usage</h2>
    <div class="grid grid-cols-3 gap-4">
		<MetricProgress percentage={75} label="Electricity" icon="bolt" />
		<MetricProgress percentage={90} label="Groceries" icon="cart" />
		<MetricProgress percentage={25} label="Petrol" icon="flame" />
	</div>
</div>
