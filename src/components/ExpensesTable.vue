<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useInfoStore } from 'src/stores/userinfo'
import { onMounted, ref, watch } from 'vue'
import { QTableProps } from 'quasar'
import { useRouter } from 'vue-router'

const infoStore = useInfoStore()
const router = useRouter()
const props = withDefaults(
   defineProps<{
      rowClickRoute?: string
      loading?: boolean
      expensesType?: 'group' | 'user'
   }>(),
   { expensesType: 'group' }
)

const { expenses, userExpenses, userData, currentGroup } = storeToRefs(infoStore)

const categoryOpts = ref(null)
const visibleColumns = ref(['description', 'date', 'cost', 'createdby', 'share'])

const columnOptions = ref([
   { value: 'description', label: 'Description' },
   { value: 'date', label: 'Date' },
   { value: 'cost', label: 'Cost' },
   { value: 'createdby', label: 'Created By' },
   { value: 'share', label: 'Your Share' },
   { value: 'category', label: 'Category' },
])

const rowClick = (row) => {
   router.push(`${props.rowClickRoute || '/expense'}/${row.id}`)
}

const columns: QTableProps['columns'] = [
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

const pagination = ref({ page: 1, rowsPerPage: 150 })

const filters = ref({
   showDeleted: false,
   showPayments: false,
   hideDeleted: true,
   hidePayment: true,
   createdBy: [],
   dateRange: { from: null, to: null },
   dateRangeString: '',
   hideCommented: false,
   commented: 'all',
})

const filterCreatedByOptions = ref([])

const filterMethod = (rows, terms, cols, getCellValue) => {
   return rows.filter((row) => {
      if (terms.hideDeleted && row.deleted_at) return false
      if (!terms.showDeleted && row.deleted_at) return false
      if (!terms.showPayments && row.payment) return false
      if (terms.hidePayment && row.payment) return false
      let createdBy = row.created_by
      if (terms.createdBy.length > 0 && !terms.createdBy.includes(createdBy.first_name))
         return false

      if (terms.dateRange) {
         let date = new Date(row.date)
         let { from, to } = terms.dateRange
         if (from && date <= new Date(from)) return false
         if (to && date >= new Date(to)) return false
      }

      if (terms.hideCommented && row.comments_count > 0) return false
      if (terms.commented !== 'all') {
         if (terms.commented === 'yes' && row.comments_count === 0) return false
         if (terms.commented === 'no' && row.comments_count > 0) return false
      }

      return true
   })
}

const refreshFilterOpts = () => {
   let members = currentGroup.value.members

   filterCreatedByOptions.value = members.map((member) => {
      return {
         label: member.first_name,
         value: member.first_name,
      }
   })
}

watch(currentGroup, refreshFilterOpts)
onMounted(refreshFilterOpts)
</script>

<template>
   <q-table
      flat
      bordered
      :rows="expensesType === 'user' ? userExpenses : expenses"
      :columns="columns"
      :pagination="pagination"
      :filter="filters"
      :filterMethod="filterMethod"
      :visibleColumns="visibleColumns"
      :loading="loading"
      color="primary"
      row-key="id"
      class="col-11">
      <template v-slot:top>
         <q-btn icon="filter_list" label="Filters" class="q-mr-sm">
            <q-menu>
               <q-list>
                  <q-item tag="label">
                     <q-item-section>
                        <q-item-label>Show Deleted Items</q-item-label>
                     </q-item-section>
                     <q-item-section side>
                        <q-toggle size="sm" v-model="filters.showDeleted" />
                     </q-item-section>
                  </q-item>
                  <q-item tag="label">
                     <q-item-section>
                        <q-item-label>Show Payments</q-item-label>
                     </q-item-section>
                     <q-item-section side>
                        <q-toggle size="sm" v-model="filters.showPayments" />
                     </q-item-section>
                  </q-item>

                  <q-item>
                     <q-item-section side>
                        <q-btn icon="event" color="green-8" size="md">
                           <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="filters.dateRange" range minimal />
                           </q-popup-proxy>
                        </q-btn>
                     </q-item-section>
                     <q-item-section>
                        <div class="flex q-gutter-xs">
                           <q-input
                              dense
                              v-model="filters.dateRange.from"
                              label="From"
                              mask="date"
                              hide-bottom-space
                              :rules="[
                                 (v) => /^-?[\d]+\/[0-1]\d\/[0-3]\d$/.test(v) || 'Invalid date',
                              ]">
                           </q-input>
                           <q-input
                              dense
                              v-model="filters.dateRange.to"
                              label="To"
                              mask="date"
                              hide-bottom-space
                              :rules="[
                                 (v) => /^-?[\d]+\/[0-1]\d\/[0-3]\d$/.test(v) || 'Invalid date',
                              ]">
                           </q-input>
                        </div>
                     </q-item-section>
                  </q-item>
                  <q-separator spaced />
                  <q-item-label header>Comments</q-item-label>
                  <q-item tag="label" dense>
                     <q-item-section side>
                        <q-radio size="xs" v-model="filters.commented" val="yes" />
                     </q-item-section>
                     <q-item-section>
                        <q-item-label>With Comments</q-item-label>
                     </q-item-section>
                  </q-item>
                  <q-item tag="label" dense>
                     <q-item-section side>
                        <q-radio size="xs" v-model="filters.commented" val="no" />
                     </q-item-section>
                     <q-item-section>
                        <q-item-label>Without Comments</q-item-label>
                     </q-item-section>
                  </q-item>
                  <q-item tag="label" dense>
                     <q-item-section side>
                        <q-radio size="xs" v-model="filters.commented" val="all" />
                     </q-item-section>
                     <q-item-section>
                        <q-item-label>All</q-item-label>
                     </q-item-section>
                  </q-item>

                  <q-separator spaced />
                  <q-item-label header>Created By</q-item-label>
                  <q-item dense v-for="(creator, i) in filterCreatedByOptions" :key="i" tag="label">
                     <q-item-section side>
                        <q-checkbox size="sm" v-model="filters.createdBy" :val="creator.value" />
                     </q-item-section>
                     <q-item-section>
                        <q-item-label>{{ creator.label }}</q-item-label>
                     </q-item-section>
                  </q-item>
               </q-list>
            </q-menu>
         </q-btn>

         <q-btn label="Columns" icon="list">
            <q-menu>
               <q-list>
                  <q-item v-for="(col, i) in columnOptions" :key="i" tag="label" dense>
                     <q-item-section side>
                        <q-toggle size="sm" v-model="visibleColumns" :val="col.value" />
                     </q-item-section>
                     <q-item-section>
                        <q-item-label>{{ col.label }}</q-item-label>
                     </q-item-section>
                  </q-item>
               </q-list>
            </q-menu>
         </q-btn>
      </template>
      <template v-slot:body="props">
         <q-tr :props="props" @click="rowClick(props.row)">
            <q-td v-for="col in props.cols" :key="col.name" :props="props">{{ col.value }}</q-td>
         </q-tr>
      </template>
   </q-table>
</template>

<style scoped lang="scss"></style>
