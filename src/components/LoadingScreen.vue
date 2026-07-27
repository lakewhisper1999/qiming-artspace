<template>
  <HomeTransition @done="onDone" />
</template>

<script setup>
import HomeTransition from './HomeTransition.vue'

const emit = defineEmits(['done'])

const onDone = () => {
  emit('done')
}
</script>
