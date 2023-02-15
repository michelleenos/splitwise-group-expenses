<script setup>
import { useInfoStore } from 'stores/userinfo-nango'
import { storeToRefs } from 'pinia'

const infoStore = useInfoStore()
const { groups, members } = storeToRefs(infoStore)

infoStore.getGroups()

function getGroup(id) {
   console.log(id)
   infoStore.getGroup(id)
}
</script>

<template>
   <q-page>
      <div class="q-pa-md full-width row wrap justify-center items-start">
         <div class="col-12 col-md-8 col-lg-6">
            <h2 class="text-subtitle1 text-uppercase text-bold">Your Groups</h2>
            <q-list bordered separator>
               <q-item clickable v-for="(group, i) in groups" :key="i" :to="`/group/${group.id}`">
                  <q-item-section>
                     <q-item-label>
                        {{ group.name }}
                     </q-item-label>
                  </q-item-section>
               </q-item>
            </q-list>
         </div>
      </div>
   </q-page>
</template>
