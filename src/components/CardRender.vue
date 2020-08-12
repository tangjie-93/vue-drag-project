<template>
	<div class="render-container">
		<template v-if="!data">
			暂无数据
		</template>
		<template v-else>
			<template v-if="displayType!=='table'">
				<EChart :optionData="data" :index='index' :type="displayType" />
			</template>

			<template v-else>
				<Table :columns="data.columns" :data="data.data"></Table>
			</template>
		</template>

	</div>
</template>

<script>
import { createOptionData } from '@/libs/helper';
import { BarChart, LineChart, PieChart, CustomTable } from '@/libs/chartHelper';
export default {
	name: 'CradRender',
	props: {
		index: String,
		displayType: String,
	},
	data() {
		return {
			data: null,
		};
	},
	mounted() {
		console.log('cardrender');
		this.$eventBus.$on('initData', this.initData);
		// this.initData();
	},
	beforeDestroy() {
		this.$eventBus.$off('initData', this.initData);
	},
	components: {
		EChart: () => import('./Echarts'),
	},
	methods: {
		initData(index) {
			if (this.index === index) {
				console.log(index);
				//构建数据
				const option = createOptionData();
				this.data = this.createChartDataByChartType(this.displayType, option);
			}
		},
		// 创建图表数据
		createChartDataByChartType(type, data) {
			const obj = {
				pie: new PieChart(),
				line: new LineChart(),
				bar: new BarChart(),
				table: new CustomTable(),
			};
			const chartInstance = obj[type];
			const option = chartInstance.createOption('测试', data);
			return option;
		},
	},
};
</script>
<style lang="scss" scoped>
.render-container {
	width: 100%;
	height: calc(100% - 30px);
}
</style>
