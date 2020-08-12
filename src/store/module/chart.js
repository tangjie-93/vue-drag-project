export default {
  state: {
    chartInstanceObj: {},
    // 当前视图内可见图表
    visibleChartInstanceArr: [],
    isresize: false// 是否调用了resize
  },
  mutations: {
    addChartInstance (state, { index, chart, option }) {
      state.chartInstanceObj[index] = { chart, option }
    },
    removeChartInstance (state, index) {
      state.chartInstanceObj[index] = null
      delete state.chartInstanceObj[index]
    },
    resizeSingleChart (state, index) {
      console.log(state.chartInstanceObj[index]);
      const chartInstanceObj = state.chartInstanceObj[index]
      chartInstanceObj && chartInstanceObj.chart.resize()
    },
    initChart (state, index) {
      const visibleChartInstanceArr = state.visibleChartInstanceArr;
      const isExist = visibleChartInstanceArr.includes(index);
      if (!isExist) visibleChartInstanceArr.push(index);
    },
    clearInvisibleChartInstance (state, index) {
      const visibleChartInstanceArr = state.visibleChartInstanceArr
      const curIndex = visibleChartInstanceArr.indexOf(index)
      curIndex > -1 && visibleChartInstanceArr.splice(curIndex, 1)
    },
    clearAllVisibleChartInstance (state) {
      state.visibleChartInstanceArr = []
    },
    resizeChart ({ commit }, index) {
      setTimeout(() => {
        commit('resizeSingleChart', index)
      }, 300)
    },
    resizeAllCharts ({ state, commit }) {
      state.isresize = true;
      Object.values(state.visibleChartInstanceArr).forEach(index => {
        setTimeout(() => {
          commit('resizeSingleChart', index)
        }, 300)
      })
    }
  },
  actions: {
    resizeChart ({ commit }, index) {
      setTimeout(() => {
        commit('resizeSingleChart', index)
      }, 10)
    },
    resizeAllCharts ({ state, commit }) {
      console.log("resize")
      state.isresize = true;
      Object.values(state.visibleChartInstanceArr).forEach(index => {
        setTimeout(() => {
          commit('resizeSingleChart', index)
        }, 10)
      })
    }
  }
}
