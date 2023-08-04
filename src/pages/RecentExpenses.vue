<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, onMounted, ref } from 'vue'

const infoStore = useInfoStore()
const { expenses, groupId } = storeToRefs(infoStore)
const offset = ref(0)
const count = ref(50)
const categoryOpts = ref(null)

const columns = [
   {
      name: 'category',
      required: false,
      label: 'Category',
      sortable: true,
      field: 'category',
      format: (cat) => cat.name,
   },
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
      sortable: true,
      format: (val) => new Date(val).toLocaleDateString('en-US'),
   },
   {
      name: 'cost',
      label: 'Cost',
      field: 'cost',
      sortable: true,
      format: (val) => `$${val}`,
   },
   {
      name: 'createdby',
      label: 'Created By',
      field: 'created_by',
      sortable: true,
      format: (val) => val.first_name,
   },
]

watch(groupId, (newVal, oldVal) => {
   // console.log('group id updated: ', newVal)
   groupId.value = newVal
   getExpenses()
})

async function getExpenses() {
   console.log('doing get expenses')
   await fetch(
      `/api/splitwise/expenses?group_id=${groupId.value}&limit=${count.value}`
   )
      .then((res) => res.json())
      .then((data) => {
         console.log(data)
         infoStore.expenses = data.expenses.filter(
            (expense) => expense.deleted_at === null
         )
      })
}

async function loadMore() {
   offset.value += count.value
   await fetch(
      `/api/splitwise/expenses?group_id=${groupId.value}&limit=${count.value}&offset=${offset.value}`
   )
      .then((res) => res.json())
      .then((data) => {
         infoStore.expenses = infoStore.expenses.concat(
            data.expenses.filter((expense) => expense.deleted_at === null)
         )
      })
}

async function getCategories() {
   await fetch(`api/splitwise/get_categories`)
      .then((res) => res.json())
      .then((data) => {
         let reduced = data.categories.reduce((acc, cur) => {
            let subcats = cur.subcategories.map((subcat) => {
               return {
                  id: subcat.id,
                  name: subcat.name,
               }
            })
            return [...acc, ...subcats]
         }, [])

         categoryOpts.value = reduced
      })
}

onMounted(() => {
   if (groupId.value !== -1) {
      getExpenses()
   }

   getCategories()
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
         :rows="expenses"
         :columns="columns"
         color="orange"
         row-key="id"
         class="col-11 col-md-8">
         <template v-slot:top>
            <q-btn color="primary" label="Load More" @click="loadMore" />
         </template>
      </q-table>

      <!-- <pre>
      {{ categoryOpts }}
      </pre> -->
   </div>
</template>
