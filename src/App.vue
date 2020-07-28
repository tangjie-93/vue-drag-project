<template>
  <div id="app">
    <dragComponent />
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {
    dragComponent: () => import('./components/index.vue')
  },
  data () {
    return {
      name: 'james',
      age: 27,
      obj: {
        name: 'james',
        age: 27
      }
    }
  }
}
</script>

<style>
body{
  margin:0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
