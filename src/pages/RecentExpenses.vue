<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, onMounted, ref } from 'vue'

const infoStore = useInfoStore()
const { expenses, groupId, currentGroup, userData } = storeToRefs(infoStore)
const loading = ref(false)
const offset = ref(0)
const categoryOpts = ref(null)
const visibleColumns = ref(['description', 'date', 'cost', 'createdby', 'share'])

const pagination = ref({
   page: 1,
   rowsPerPage: 10,
})

const filters = ref({
   showDeleted: false,
   showPayments: false,
   hideDeleted: true,
   hidePayment: true,
   createdBy: [],
   dateRange: { from: null, to: null },
   hideCommented: false,
   commented: 'all',
})

const filterCreatedByOptions = ref([])

const columns = [
   {
      name: 'category',
      required: false,
      label: 'Category',
      sortable: true,
      field: 'category',
      sort: (a, b) => a.name.localeCompare(b.name),
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
      sort: (a, b) => a.first_name.localeCompare(b.first_name),
      format: (val) => val.first_name,
   },
   {
      name: 'type',
      label: 'type',
      field: 'description',
      sortable: false,
      format: (val) => (val === 'Payment' ? 'payment' : ''),
   },
   {
      name: 'share',
      label: 'Your Share',
      field: 'users',
      sortable: false,
      format: (users) => {
         let user = users.find((user) => user.user_id === userData.value.id)
         return user ? `$${user.owed_share}` : ''
      },
   },
]

const showDialog = ref(false)
const dialogContent = ref(null)

const refreshFilterOpts = () => {
   let members = currentGroup.value.members

   filterCreatedByOptions.value = members.map((member) => {
      return {
         label: member.first_name,
         value: member.first_name,
      }
   })
}

watch(groupId, (newVal, oldVal) => {
   // groupId.value = newVal
   // categoryOpts.value = null
   expenses.value = []
   refreshFilterOpts()
   requestExpenses(100)
})

const filterMethod = (rows, terms, cols, getCellValue) => {
   return rows.filter((row) => {
      if (terms.hideDeleted && row.deleted_at) return false
      if (!terms.showDeleted && row.deleted_at) return false
      if (!terms.showPayments && row.payment) return false
      if (terms.hidePayment && row.payment) return false
      let createdBy = row.created_by
      if (terms.createdBy.length > 0 && !terms.createdBy.includes(createdBy.first_name))
         return false

      let date = new Date(row.date)
      if (terms.dateRange.from && date <= new Date(terms.dateRange.from)) return false
      if (terms.dateRange.to && date >= new Date(terms.dateRange.to)) return false
      if (terms.hideCommented && row.comments_count > 0) return false
      if (terms.commented !== 'all') {
         if (terms.commented === 'yes' && row.comments_count === 0) return false
         if (terms.commented === 'no' && row.comments_count > 0) return false
      }

      return true
   })
}

const rowClick = (row) => {
   showDialog.value = true
   dialogContent.value = row
}

async function requestExpenses(count) {
   loading.value = true

   let data = await fetch(
      `/api/splitwise/expenses?group_id=${groupId.value}&limit=${count}&offset=${offset.value}`
   ).then((res) => res.json())

   let returned = data.expenses.length
   let adjustedNewExpenses = data.expenses.map((expense) => {
      // let category = categoryOpts.value.find((cat) => cat.id === expense.category.id)
      let category = expense.category
      if (!category || !category.id) {
         return expense
      }
      let foundCategory = categoryOpts.value.find((cat) => cat.id === category.id)
      expense.category = { ...expense.category, icon: foundCategory.icon }
      return expense
      // return { ...expense, category }
   })
   // let filtered = data.expenses.filter(
   //    (expense) => expense.deleted_at === null && expense.description !== 'Payment'
   // )
   expenses.value = [...expenses.value, ...adjustedNewExpenses]
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
                  icon: subcat.icon,
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
   if (currentGroup.value) {
      refreshFilterOpts()
   }
   getCategories()
})
</script>

<template>
   <q-banner class="bg-green-9 text-white" v-if="groupId === -1">
      <span class="text-weight-medium">select a group in the sidebar</span>
   </q-banner>
   <div v-else class="q-py-xl full-width row wrap justify-center items-start q-gutter-md">
      <div class="col-11 mb-md q-gutter-sm bg-grey-2 row items-center justify-between">
         <div class="row items-center q-gutter-md wrap">
            <q-toggle size="sm" v-model="filters.showDeleted" label="Deleted" color="orange" />

            <q-toggle size="sm" v-model="filters.showPayments" label="Payments" color="orange" />

            <q-btn-toggle
               class="q-ml-lg"
               size="sm"
               v-model="filters.commented"
               :options="[
                  { label: 'With Comments', value: 'yes' },
                  { label: 'Without Comments', value: 'no' },
                  { label: 'All', value: 'all' },
               ]" />

            <q-btn icon="event" color="green-8" size="sm">
               <q-popup-edit
                  title="Date Range"
                  v-model="filters.dateRange"
                  v-slot="scope"
                  auto-save>
                  <q-date v-model="scope.value" range />
               </q-popup-edit>
               <span v-if="filters.dateRange.from && filters.dateRange.to" class="q-ml-sm">
                  {{ filters.dateRange.from }} - {{ filters.dateRange.to }}
               </span>
            </q-btn>

            <div class="row items-center">
               <div class="text-bold q-mr-sm">Created By:</div>
               <q-option-group
                  inline
                  dense
                  v-model="filters.createdBy"
                  :options="filterCreatedByOptions"
                  type="checkbox" />
            </div>
         </div>

         <div class="q-pa-sm"></div>
      </div>

      <q-table
         flat
         bordered
         title="Recent Group Expenses"
         :loading="loading"
         :rows="expenses"
         :columns="columns"
         :pagination="pagination"
         :filter="filters"
         :filter-method="filterMethod"
         :visible-columns="visibleColumns"
         color="orange"
         row-key="id"
         class="col-11">
         <template v-slot:top>
            <div>
               <q-toggle v-model="visibleColumns" val="category" label="Category" size="xs" />
               <q-toggle v-model="visibleColumns" val="date" label="Date" size="xs" />
               <q-toggle v-model="visibleColumns" val="cost" label="Cost" size="xs" />
               <q-toggle v-model="visibleColumns" val="createdby" label="Created By" size="xs" />
               <q-toggle v-model="visibleColumns" val="share" label="Your Share" size="xs" />
            </div>
         </template>
         <template v-slot:body="props">
            <q-tr :props="props" @click="rowClick(props.row)">
               <q-td v-for="col in props.cols" :key="col.name" :props="props">{{ col.value }}</q-td>
            </q-tr>
         </template>
      </q-table>
      <div class="col-12 row justify-center">
         <q-btn flat color="orange" @click="loadMore" :disable="loading">load more</q-btn>
      </div>
   </div>

   <q-dialog v-model="showDialog">
      <q-card>
         <pre>
               {{ dialogContent }}
            </pre
         >
      </q-card>
   </q-dialog>
</template>
