<template>
	<div id="app">
		<div id="content">

			<grid-layout :layout.sync="layout" :col-num="parseInt(colNum)" :row-height="rowHeight" :is-draggable="draggable" :is-resizable="resizable" :is-mirrored="mirrored" :prevent-collision="preventCollision" :vertical-compact="true" :use-css-transforms="true" :responsive="responsive" @layout-mounted="layoutMountedEvent">
				<grid-item v-for="item in layout" :key="item.i" :isDraggable="item.draggable" :static="item.static" :index="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" @resized="resized" @container-resized="containerResized" @moved="moved" class="grid-item">
					<div class="header">
						<div class="title" @mouseover="item.draggable=true" @mouseout="item.draggable=false">测试</div>
						<div class="operate-btn">
							<button type="ios-trash-outline" class="remove" title="删除" @click="removeItem(item)">删除</button>
						</div>
					</div>
					<CardRender class="echart-card" :index="item.i" :displayType="item.displayType" />
				</grid-item>
			</grid-layout>

		</div>
	</div>
</template>

<script>
import GridItem from '../components/GridItem.vue';
import GridLayout from '../components/GridLayout.vue';
import CardRender from '../components/CardRender';
import { getDocumentDir, setDocumentDir } from '../helpers/DOM';
import { setColumnsAndRows } from '@/libs/helper';
import { on, off, debounce } from '@/libs/helper';
export default {
	name: 'app',
	components: {
		GridLayout,
		GridItem,
		CardRender,
	},
	data() {
		return {
			layout: [],
			draggable: true,
			resizable: true,
			mirrored: false,
			responsive: true,
			preventCollision: false,
			rowHeight: 30,
			colNum: 12,
			index: 0,
		};
	},
	mounted: function() {
		on(window, 'resize', debounce(this.resizeCharts, 500));
		this.$once('hook:beforeDestroy', () => {
			off(window, 'resize', debounce(this.resizeCharts, 500));
		});
		setTimeout(() => {
			this.startObserver();
		}, 500);
	},
	methods: {
		resizeCharts() {
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
		move: function(i, newX, newY) {
			// console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
		},
		resize: function(i, newH, newW, newHPx, newWPx) {},
		moved: function(i, newX, newY) {
			// console.log("### MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
		},
		resized: function(i, newH, newW, newHPx, newWPx) {
			i > -1 && this.$store.dispatch('resizeChart', i);
		},
		containerResized: function(i, newH, newW, newHPx, newWPx) {
			// console.log("### CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
		},

		layoutMountedEvent: function(colNum) {
			this.createLayoutData(colNum);
		},
		layoutReadyEvent: function(newLayout) {
			// console.log("Ready layout: ", newLayout)
		},
		layoutUpdatedEvent: function(newLayout) {
			// console.log("Updated layout: ", newLayout)
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
						console.log();
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
.header {
	height: 30px;
	line-height: 30px;
	display: flex;
	text-align: center;
	.title {
		flex: 1;
	}
	.operate-btn {
		flex-basis: 50px;
	}
}
</style>
