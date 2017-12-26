<template>
	<input :id="this.id + '-flyte-picker'" class="flyte-picker"/>
</template>

<script>
	import flatpickr from 'flatpickr';

	export default {
		props: ['id', 'config', 'value'],

		data() {
			let fp = this;

			let config = _.extend({
				dateFormat:  'Y-m-d',
				altFormat:   'm/d/Y',
				altInput:    true,
				defaultDate: this.value || new Date().reset(),
				minDate:     new Date().reset(),
				maxDate:     new Date().reset().addMonths(18),
				onChange(selectedDates, dateStr, instance) {
					fp.$emit('input', dateStr);
					fp.$emit('change', selectedDates, dateStr);

					if (fp.isUserSelect) {
						fp.$emit('select', selectedDates, dateStr);
					}
				},

			}, this.config);

			return {
				isUserSelect: false,
				fpConfig:     config,
				flatpickr:    null
			};
		},

		mounted() {
			//Initialize the flatpickr instance on the flyte-picker input element
			this.flatpickr = flatpickr(this.$el, this.fpConfig);

			//Give the altInput field the id of the original element (in case there is a label pointing to it)
			if (this.flatpickr.altInput) {
				//set id to the alt input
				this.flatpickr.altInput.id = this.id;
			}

			//Any changes made at this point presumably were from the user changing the dates.
			this.isUserSelect = true;
		},

		watch: {
			config: {
				deep: true,
				handler(newConfig) {
					for (let c in newConfig) {
						this.flatpickr.set(c, newConfig[c]);
					}
				}
			},

			value(newValue) {
				if (newValue) {
					//The onChange method will get triggered here, so make sure we do not send the select event
					this.isUserSelect = false;

					if (!(newValue instanceof Date)) {
						//Make sure we are setting the correct day (casting to Date from string at the wrong time may fuck up)
						newValue = new Date(newValue).tzCorrect();
					}

					this.flatpickr.setDate(newValue);

					this.isUserSelect = true;
				}
			}
		}
	}
</script>
