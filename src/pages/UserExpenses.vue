<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, onMounted, ref } from 'vue'
import { getExpenses } from 'src/utils/api-requests'
import ExpensesTable from 'src/components/ExpensesTable.vue'

const infoStore = useInfoStore()

const { groupId, userExpenses, expenses } = storeToRefs(infoStore)

const loading = ref(true)

async function update() {
   loading.value = true
   await infoStore.setUserExpenses()
   loading.value = false
}

onMounted(async () => {
   // await infoStore.setUserExpenses()
   if (groupId.value !== -1) {
      await update()
   }
})

watch(groupId, async (newVal, oldVal) => {
   await update()
})
</script>

<template>
   <q-page>
      <q-banner class="bg-green-9 text-white" v-if="groupId === -1">
         <span class="text-weight-medium">select a group in the sidebar</span>
      </q-banner>
      <div class="q-py-xl full-width row wrap justify-center items-start" v-else>
         <ExpensesTable rowClickRoute="/user-expenses/expense" expensesType="user" />
      </div>
   </q-page>
</template>
