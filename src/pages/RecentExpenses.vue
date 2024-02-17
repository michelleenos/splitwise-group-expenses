<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, onMounted, ref } from 'vue'

const infoStore = useInfoStore()
const { expenses, groupId } = storeToRefs(infoStore)
const loading = ref(false)
const offset = ref(0)
const categoryOpts = ref(null)

const pagination = ref({
   page: 1,
   rowsPerPage: 10,
})

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
      sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
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
   groupId.value = newVal
   categoryOpts.value = null
   expenses.value = []
   requestExpenses(100)
})

async function requestExpenses(count) {
   loading.value = true

   let data = await fetch(
      `/api/splitwise/expenses?group_id=${groupId.value}&limit=${count}&offset=${offset.value}`
   ).then((res) => res.json())

   let returned = data.expenses.length
   let filtered = data.expenses.filter(
      (expense) => expense.deleted_at === null && expense.description !== 'Payment'
   )
   expenses.value = [...expenses.value, ...filtered]
   offset.value += returned

   loading.value = false
}

async function loadMore() {
   await requestExpenses(100)
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
   if (groupId.value !== -1 && expenses.value.length === 0) {
      loadMore()
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
         :loading="loading"
         :rows="expenses"
         :columns="columns"
         :pagination="pagination"
         color="orange"
         row-key="id"
         class="col-11 col-md-8">
         <template v-slot:pagination="scope">
            <span class="text-small">
               {{
                  scope.pagination.rowsPerPage * scope.pagination.page -
                  scope.pagination.rowsPerPage +
                  1
               }}
               -
               {{
                  scope.pagination.rowsPerPage * scope.pagination.page -
                  scope.pagination.rowsPerPage +
                  scope.pagination.rowsPerPage
               }}
               of
               {{ expenses.length }}
            </span>
            <q-btn
               flat
               color="orange"
               icon="first_page"
               v-if="scope.pagesNumber > 2"
               @click="scope.firstPage" />
            <q-btn
               flat
               color="orange"
               icon="chevron_left"
               @click="scope.prevPage"
               :disable="scope.isFirstPage" />
            <q-btn flat color="orange" icon="chevron_right" @click="scope.nextPage" />
            <q-btn
               flat
               color="orange"
               icon="last_page"
               @click="scope.lastPage"
               :disable="scope.isLastPage" />
            <q-btn flat color="orange" @click="loadMore" :disable="loading">load more</q-btn>
         </template>
      </q-table>

      <!-- <pre>
      {{ categoryOpts }}
      </pre> -->
   </div>
</template>
