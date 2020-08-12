<template>
	<div ref="dom" class="charts chart-pie"></div>
</template>

<script>
import echarts from 'echarts';
import tdTheme from '../assets/Theme.json';
import evenBus from '@/libs/evenBus';
echarts.registerTheme('tdTheme', tdTheme);
export default {
	name: 'Chart',
	props: {
		// eslint-disable-next-line vue/require-prop-type-constructor
		optionData: Array | Object,
		// eslint-disable-next-line vue/require-prop-type-constructor
		index: String | Number,
		type: {
			type: String,
			default: undefined,
		},
	},
	data() {
		return {
			dom: null,
		};
	},
	mounted() {
		this.initChart();
	},
	methods: {
		initChart() {
			this.$nextTick(() => {
				if (this.optionData) {
					this.dom = echarts.init(this.$refs.dom, 'tdTheme');
					this.dom.setOption(this.optionData);
					this.index > -1 && this.$store.commit('addChartInstance', { index: this.index, chart: this.dom, option: this.optionData });
					// this.dom.showLoading({ text: '数据正在加载中' });
				}
			});
		},
	},
};
</script>
<style lang="scss" scoped>
.charts {
	width: 100%;
	height: 100%;
	display: inline-block;
	position: relative;
}
</style>
