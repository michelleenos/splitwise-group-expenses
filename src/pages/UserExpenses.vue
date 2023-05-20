<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, onMounted } from 'vue'

const infoStore = useInfoStore()

const { groupId, userExpenses } = storeToRefs(infoStore)

const columns = [
   {
      name: 'description',
      required: true,
      label: 'Name',
      align: 'left',
      field: 'description',
      sortable: true,
   },
   {
      name: 'date',
      label: 'Date',
      field: 'date',
      format: (val) => new Date(val).toLocaleDateString('en-US'),
      sortable: true,
   },
   {
      name: 'cost',
      label: 'Cost',
      field: 'cost',
      format: (val) => `$${val}`,
   },
   {
      name: 'created',
      label: 'Created',
      field: 'created_at',
      format: (val) => {
         let date = new Date(val)
         let dateString = date.toLocaleDateString('en-US')
         let time = date.toLocaleTimeString('en-US', { timeStyle: 'short' })
         return `${dateString} - ${time}`
      },
      sortable: true,
   },
]

onMounted(() => {
   infoStore.setUserExpenses()
})

watch(groupId, (newVal, oldVal) => {
   console.log('group id updated: ', newVal)
   infoStore.setUserExpenses()
})
</script>

<template>
   <q-page>
      <q-banner class="bg-green-9 text-white" v-if="groupId === -1">
         <span class="text-weight-medium">select a group in the sidebar</span>
      </q-banner>
      <div class="q-py-xl full-width row wrap justify-center items-start" v-else>
         <q-table
            flat
            bordered
            title="Your recent expenses in this group"
            table-header-class="bg-amber-12"
            :rows="userExpenses"
            :columns="columns"
            :pagination="{ rowsPerPage: 10 }"
            color="orange"
            row-key="id"
            class="col-11 col-md-8" />
      </div>
   </q-page>
</template>
