<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ id: string }>()
const expense = ref<any>()
const router = useRouter()

const show = ref(false)

async function getExpense() {
   await fetch(`/api/splitwise/get_expense/?expense_id=${props.id}`)
      .then((res) => {
         return res.json()
      })
      .then((data) => {
         expense.value = data.expense
      })
      .catch((err) => {
         console.error(err)
      })

   show.value = true
}

const onShowUpdate = () => {
   if (!show.value) {
      router.back()
   }
}

onMounted(() => {
   getExpense()
})
</script>

<template>
   <q-dialog v-model="show" @update:modelValue="onShowUpdate">
      <q-card>
         <q-card-section class="bg-grey-3">
            <h2 class="text-h3">Expense:</h2>
         </q-card-section>
         <q-separator />
         <q-card-section class="q-px-none">
            <q-list v-if="expense" dense>
               <q-item>
                  <q-item-section side>
                     <q-icon name="description" size="xs" />
                  </q-item-section>
                  <q-item-section>
                     <div>
                        <span class="text-weight-bold q-mr-sm">Description </span>
                        <span class="text-grey-7">{{ expense.description }}</span>
                     </div>
                  </q-item-section>
               </q-item>
               <q-item>
                  <q-item-section side>
                     <q-icon name="person" size="xs" />
                  </q-item-section>
                  <q-item-section>
                     <div>
                        <span class="text-weight-bold q-mr-sm">Created By </span>
                        <span class="text-grey-7">
                           {{ expense.created_by.first_name }}
                           {{ expense.created_by.last_name }}
                        </span>
                     </div>
                  </q-item-section>
               </q-item>

               <q-item>
                  <q-item-section side>
                     <q-icon name="attach_money" size="xs"></q-icon>
                  </q-item-section>
                  <q-item-section>
                     <div>
                        <span class="text-weight-bold q-mr-sm">Amount</span>
                        <span class="text-grey-9 text-h3">${{ expense.cost }}</span>
                     </div>
                  </q-item-section>
               </q-item>
            </q-list>
         </q-card-section>
      </q-card>
   </q-dialog>
</template>

<style scoped lang="scss"></style>
