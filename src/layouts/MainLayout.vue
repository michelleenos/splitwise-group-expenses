<template>
	<router-view />
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
	data: function () {
		return {
			test: 'hi',
		}
	},
	name: 'MainLayout',
})
</script>
