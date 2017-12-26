<template>
	<div class="flyte-range-picker" @change="updateRange">
		<slot></slot>
	</div>
</template>

<script>
	export default {
		props:   [],
		data() {
			return {
				start:       null,
				end:         null,
				startPicker: null,
				endPicker:   null
			};
		},
		mounted() {
			for (let child of this.$children) {
				if (child.$vnode && child.$vnode.componentOptions.tag === 'flyte-picker') {
					if (this.start) {
						this.end = child;
						this.endPicker = child.$el._flatpickr;
						break;
					} else {
						this.start = child;
						this.startPicker = child.$el._flatpickr;
					}
				}
			}

			if (!this.end) {
				console.error("<flyte-range-picker> requires a start and end <flyte-picker> to be present in the default <slot>");
			}
		},
		methods: {
			updateRange(e) {
				//If the changed picker was the start of the range, we need to update the end picker to not allow selecting anything before the start date
				if (this.start.$el === e.target) {
					let startDate = this.startPicker.selectedDates[0].toString('yyyy-MM-dd');

					this.endPicker.open();
					this.endPicker.set('minDate', startDate);
					this.endPicker.jumpToDate(startDate);
				}
			}
		}
	}
</script>
