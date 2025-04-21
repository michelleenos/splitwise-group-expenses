<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ExpensesTable from 'src/components/ExpensesTable.vue'

const infoStore = useInfoStore()
const { expenses, groupId, currentGroup } = storeToRefs(infoStore)
const loading = ref(false)
const route = useRoute()

const filterCreatedByOptions = ref([])

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
   expenses.value = []
   refreshFilterOpts()
   requestExpenses(500)
})

async function requestExpenses(count) {
   loading.value = true

   await infoStore.loadExpenses(count)
   loading.value = false
}

async function loadMore() {
   await requestExpenses(500)
}

onMounted(() => {
   if (groupId.value !== -1 && expenses.value.length === 0) {
      loadMore()
   }
   if (currentGroup.value) {
      refreshFilterOpts()
   }
})
</script>

<template>
   <q-banner class="bg-green-9 text-white" v-if="groupId === -1">
      <span class="text-weight-medium">select a group in the sidebar</span>
   </q-banner>
   <div v-else class="q-py-xl full-width row wrap justify-center items-start q-gutter-md">
      <ExpensesTable :rowClickRoute="'/recent-expenses/expense'" :loading="loading" />
      <!-- <q-table
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
                     <q-item
                        dense
                        v-for="(creator, i) in filterCreatedByOptions"
                        :key="i"
                        tag="label">
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
      </q-table> -->
      <div class="col-12 row justify-center">
         <q-btn flat @click="loadMore" :disable="loading">load more</q-btn>
      </div>
   </div>

   <div v-if="/recent-expenses\/expense\/\d+/gm.test(route.path)">
      MATCHED
      <router-view></router-view>
   </div>

   <!-- <q-dialog v-model="showDialog">
      <q-card>
         <pre>
               {{ dialogContent }}
            </pre
         >
      </q-card>
   </q-dialog> -->
</template>
