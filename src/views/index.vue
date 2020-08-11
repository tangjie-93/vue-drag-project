<template>
	<div id="container">
		<div id="content">
			<grid-layout :layout.sync="layout" :col-num="parseInt(colNum)" :row-height="rowHeight" :is-draggable="draggable" :is-resizable="resizable" :is-mirrored="mirrored" :prevent-collision="preventCollision" :vertical-compact="true" :use-css-transforms="true" :responsive="responsive" @layout-updated="layoutUpdatedEvent" @layout-mounted="layoutMountedEvent">
				<grid-item v-for="item in layout" :key="item.i" :isDraggable="item.draggable" :index="item.i" :static="item.static" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" @resized="resized" class="grid-item">
					<div class="header">
						<div class="title" @mouseover="item.draggable=true" @mouseout="item.draggable=false">测试</div>
						<div class="operate-btn">
							<button type="ios-trash-outline" class="remove" title="删除" @click="removeItem(item)">删除</button>
						</div>
					</div>
					<CardRender class="echart-card" :index="item.i" :displayType="item.displayType" />
				</grid-item>
			</grid-layout>
			<hr />
		</div>
	</div>
</template>

<script>
import GridItem from '../components/GridItem.vue';
import GridLayout from '../components/GridLayout.vue';
import { getDocumentDir, setDocumentDir } from '../helpers/DOM';
import { setColumnsAndRows, createMetricData } from '@/libs/helper';
import { BarChart, LineChart, PieChart, CustomTable } from '@/libs/chartHelper';

import { on, off } from '@/libs/helper';
import evenBus from '@/libs/evenBus';
export default {
	name: 'index',
	components: {
		GridLayout,
		GridItem,
		CardRender: () => import('../components/CardRender'),
	},
	data() {
		return {
			layout: [],
			draggable: true,
			resizable: true,
			mirrored: false,
			responsive: true,
			preventCollision: false,
			rowHeight: 20,
			colNum: 12,
			index: 0,
		};
	},
	mounted: function() {
		console.log('mounted');
		on(window, 'resize', this.resizeCharts);
		this.$once('hook:beforeDestroy', () => {
			off(window, 'resize', this.resizeCharts);
		});
		setTimeout(() => {
			this.startObserver();
		}, 5000);
	},
	methods: {
		resizeCharts() {
			console.log('resize');
			this.$store.dispatch('resizeAllCharts');
		},
		removeItem: function(item) {
			//console.log("### REMOVE " + item.i);
			this.layout.splice(this.layout.indexOf(item), 1);
		},
		addItem: function() {
			// let self = this;
			//console.log("### LENGTH: " + this.layout.length);
			let item = { x: 0, y: 0, w: 2, h: 2, i: this.index + '', whatever: 'bbb' };
			this.index++;
			this.layout.push(item);
		},
		resized(i) {
			console.log(i);
			i > -1 && this.$store.dispatch('resizeChart', i);
		},
		layoutMountedEvent: function(colNum) {
			this.colNum = colNum;
			this.createLayoutData(this.colNum);
		},
		layoutUpdatedEvent() {
			console.log('layoutUpdatedEvent');
			this.resizeCharts();
		},
		// 构建布局数据
		createLayoutData(colNum = 12) {
			const { perItemWidth, itemCountPerRow } = setColumnsAndRows(colNum);
			const totalItemCount = 30;
			// this.$store.commit('getGraphItemCount', 30);
			let count = 0;
			// 放置几层
			const rowCount = parseInt(totalItemCount / itemCountPerRow);
			const types = ['line', 'bar']; // line', 'bar',
			const layoutData = [];
			// 放置多少层
			for (let p = 0; p <= rowCount; p++) {
				// 放置多少列
				for (let j = 0; j < itemCountPerRow && count < totalItemCount; j++, count++) {
					const displayType = types[count % 2];
					const tempObj = {
						id: Math.random(),
						x: j * perItemWidth,
						y: p * perItemWidth,
						w: perItemWidth,
						h: 10,
						i: '' + count,
						resizable: false,
						draggable: false,
						static: false,
						displayType,
					};
					layoutData.push(tempObj);
				}
			}
			this.layout = layoutData;
		},

		startObserver() {
			// 避免监听多次
			this.io && this.io.disconnect();
			const callback = entries => {
				entries.forEach(item => {
					const index = item.target.getAttribute('index');
					if (item.isIntersecting) {
						// console.log(index);
						this.$store.commit('initChart', index);
						this.$eventBus.$emit('initData', index);
						// this.io.unobserve(item.target); // 停止观察当前元素 避免不可见时候再次调用callback函数
					} else {
						// console.log(index)
						// 清除不可见的
						this.$store.commit('clearInvisibleChartInstance', index);
					}
				});
			};
			this.io = new IntersectionObserver(callback);
			const gridItems = document.querySelectorAll('.grid-item');
			gridItems.forEach(item => {
				this.io.observe(item);
			});
		},
	},
};
</script>
<style lang="scss">
.operate-btn {
	position: absolute;
	top: 5px;
	right: 5px;
	z-index: 1000;
	// display: none;
	.ivu-icon {
		margin: 0 5px;
		&:hover {
			cursor: pointer;
		}
	}
	.remove {
		font-size: 16px;
	}
}
.vue-grid-item:hover .operate-btn {
	display: inline-block;
}
.title {
	height: 40px;
	font-size: 18px;
	line-height: 40px;
	text-align: center;
	font-weight: bold;
	font-family: 'sans-serif';
}
.metric-table {
	max-height: calc(100% - 40px);
	min-height: 150px;
	width: 100%;
	overflow: auto;
}
#content {
	position: absolute;
	width: 100%;
	height: 100%;
	padding: 30px;
	box-sizing: border-box;
	overflow: auto;
}
.vue-grid-layout {
	height: 100% !important;
	width: 100%;
	overflow: auto;
}
.title {
	height: 30px;
	cursor: move;
}
</style>
