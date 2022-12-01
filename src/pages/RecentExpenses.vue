<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

const infoStore = useInfoStore()
const { expenses, groupId } = storeToRefs(infoStore)

const columns = [
	{
		name: 'description',
		required: true,
		label: 'Name',
		align: 'left',
		field: 'description',
		sortable: false,
	},
	{
		name: 'date',
		label: 'Date',
		field: 'date',
		format: (val) => new Date(val).toLocaleDateString('en-US'),
	},
	{
		name: 'cost',
		label: 'Cost',
		field: 'cost',
		format: (val) => `$${val}`,
	},
	{
		name: 'createdby',
		label: 'Created By',
		field: 'created_by',
		format: (val) => val.first_name,
	},
]

if (groupId.value !== -1) {
	infoStore.getExpenses()
}

watch(groupId, (newVal, oldVal) => {
	console.log('group id updated: ', newVal)
	infoStore.getExpenses()
})
</script>

<template>
	<q-banner class="bg-green-9 text-white" v-if="groupId === -1">
		<span class="text-weight-medium">select a group in the sidebar</span>
	</q-banner>
	<div class="q-py-xl full-width row wrap justify-center items-start" v-else>
		<q-table
			flat
			bordered
			title="Recent Group Expenses"
			table-header-class="bg-amber-12"
			:rows="expenses"
			:columns="columns"
			color="orange"
			row-key="id"
			class="col-11 col-md-8" />
	</div>
</template>
