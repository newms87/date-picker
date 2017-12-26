<template>
	<div class="flyte-multi-picker" :class="{'selection-disabled': disableSelection}">
		<div class="fp-control fp-left-arrow" @click="changeMonth(-1)">
			<i class="fa fa-chevron-left"></i>
		</div>

		<flyte-picker ref="pickers" v-for="picker in pickers" :id="picker.id" :key="picker.id" :config="picker.config" @change="onDateSelected"></flyte-picker>

		<div class="fp-control fp-right-arrow" @click="changeMonth(1)">
			<i class="fa fa-chevron-right"></i>
		</div>
	</div>
</template>

<script>
	export default {
		props: ['config', 'count', 'selected'],

		data() {
			let fmp = this, pickers = [];

			this.tzCorrectDates(this.selected);

			for (let i = 0; i < (this.count || 2); i++) {
				let defaults = {
					inline:      true,
					//For now this needs to be disabled, things get broken when trying to correct for date selection and disabling animation on the fly
					animate:     false,
					mode:        'multiple',
					defaultDate: this.selected || [],
					onMonthChange(selectedDates) {
						fmp.syncMonthsToPicker(i);
					},
					onYearChange() {
						fmp.syncMonthsToPicker(i);
					}
				};

				pickers.push({
					id:     _.uniqueId('picker-'),
					index:  i,
					config: defaults
				});
			}

			return {
				isSyncing:        false,
				cancelDateSelect: false,
				pickers:          pickers,
				selectedDates:    this.selected,
				disableSelection: !!this.config.disableSelection,
			}
		},
		mounted() {
			this.initFlyteMultiPicker();
		},

		watch: {
			selected() {
				this.tzCorrectDates(this.selected);

				this.selectedDates = this.selected;

				//Need to update all the pickers to have the new set of selected dates selected
				this.resetPickers();
			},

			config: {
				deep: true,
				handler() {
					this.applyConfig();
				}
			},
		},

		methods: {

			/**
			 * Sets up all the pickers to be syncrhonized with each other
			 */
			initFlyteMultiPicker() {
				for (let picker of this.pickers) {
					picker.flatpickr = document.getElementById(picker.id + '-flyte-picker')._flatpickr;
				}

				this.applyConfig();

				//set all the months based off the first picker
				this.syncMonthsToPicker(0);
			},

			/**
			 * Set all the pickers to the selected Dates
			 */
			onDateSelected(selectedDates, dateStr) {
				//XXX: This is set to indicate a user clicked on a prev / next month day and we should ignore this selection
				if (this.cancelDateSelect || this.disableSelection) {
					this.cancelDateSelect = false;
					this.resetPickers();
					return;
				}

				this.selectedDates = selectedDates;

				//Setting dates will change the month of the picker, so we need to specify what the selectedDates are, and reset to those dates
				this.resetPickers();

				//sometimes it seems to use ',' instead of ';' so let's standardize this.
				dateStr = dateStr.replace(/,/g, ';');

				if (this.config.mode === 'single') {
					this.$emit('select', dateStr);
				} else {
					this.$emit('select', this.selectedDates, dateStr);
				}
			},

			/**
			 * change the month for all the pickers (see flatpickr.changeMonth() for param details
			 * Will actually only explicitly change the first month, the other flytepickers are updated
			 * implicitly via the onChangeMonth event
			 *
			 * @param month
			 * @param is_offset
			 */
			changeMonth(month, is_offset) {
				//Change the first picker, all other pickers will get updated based on the first one's month change offset
				this.pickers[0].flatpickr.changeMonth(month, is_offset !== false);
			},

			/**
			 * Reset all the pickers to their last known state (dates selected, current month and year, etc...)
			 */
			resetPickers() {
				this.isSyncing = true;

				for (let picker of this.pickers) {
					picker.flatpickr.setDate(this.selectedDates, false);
					picker.flatpickr.changeYear(picker.currentYear, false);
					picker.flatpickr.changeMonth(picker.currentMonth, false);
				}
				this.isSyncing = false;
			},

			/**
			 * Ensure that all the pickers are sequentially 1 month apart relative to the specified picker
			 *
			 * @param pickerIndex - the index of the picker to use as a reference for updating the other pickers
			 */
			syncMonthsToPicker(pickerIndex) {
				//avoid infinite looping
				if (this.isSyncing) return;

				this.isSyncing = true;

				let refPicker = this.pickers[pickerIndex];

				if (refPicker.flatpickr) {
					refPicker.currentMonth = refPicker.flatpickr.currentMonth;
					refPicker.currentYear = refPicker.flatpickr.currentYear;

					for (let picker of this.pickers) {
						if (picker.index !== pickerIndex) {
							let next = this.getMonthYearChange(refPicker, picker.index - pickerIndex);

							picker.flatpickr.changeYear(next.year, false);
							picker.flatpickr.changeMonth(next.month, false);

							picker.currentMonth = picker.flatpickr.currentMonth;
							picker.currentYear = picker.flatpickr.currentYear;
						}
					}
				}

				this.isSyncing = false;
			},


			/**
			 * Calculate the month / year based on the # of months offset from the current given picker's month / year
			 * eg: Dec 2017 + 13 months = January 2019
			 */
			getMonthYearChange(picker, monthOffset) {
				let nextMonth = picker.currentMonth + monthOffset, nextYear = picker.currentYear;

				while (nextMonth > 12) {
					nextMonth -= 12;
					nextYear += 1;
				}

				while (nextMonth < 1) {
					nextMonth += 12;
					nextYear -= 1;
				}

				return {month: nextMonth, year: nextYear};
			},

			applyConfig() {
				for (let c in this.config) {
					this.setConfig(c, this.config[c]);
				}
			},

			/**
			 * Synchronizes the config option changes to all the pickers
			 *
			 * @param key
			 * @param value
			 */
			setConfig(key, value) {
				switch (key) {
					case 'enable':
						if (value === false) {
							value = ['0000-00-00'];
						}
						break;

					case 'disable':
						if (value === true) {
							key = 'enable';
							value = ['0000-00-00'];
						}
						break;
				}

				//Disable month sync, as we handle any changes manually here
				this.isSyncing = true;

				for (let picker of this.pickers) {
					let oldMonth = picker.flatpickr.currentMonth;

					picker.flatpickr.set(key, value);

					if (oldMonth !== picker.flatpickr.currentMonth) {
						picker.flatpickr.changeMonth(oldMonth, false);
					}
				}

				this.isSyncing = false;
			},

			/**
			 * Correct for the timezone offset from UTC for all dates
			 *
			 * @param dates
			 */
			tzCorrectDates(dates) {
				for (let d in dates) {
					let date = dates[d];

					if (typeof date === 'string') {
						date = new Date(date).tzCorrect();
					}
				}
			},


			/*******
			 * API *
			 ********/

			/**
			 * Applies a generated schedule to the picker (see buildSchedule method)
			 */
			applySchedule(frequency, months, daysOfWeek) {
				let schedule = this.buildSchedule(frequency, months, daysOfWeek);

				this.pickers[0].flatpickr.setDate(schedule, true);
			},

			/**
			 * Construct an array of dates based on the frequency, months and days of the week.
			 * The minDate / maxDate of the picker config is used as the start and end date for the schedule
			 *
			 * @param frequency
			 * @param months
			 * @param daysOfWeek
			 * @returns {Array}
			 */
			buildSchedule(frequency, months, daysOfWeek) {

				//format the months / daysOfWeek array lists
				months = _.map(months, (a) => +a);
				daysOfWeek = _.map(daysOfWeek, (a) => +a);

				_.pull(months, 0);
				_.pull(daysOfWeek, 0);

				let picker = this.$refs.pickers[0].fpConfig;

				let currDate = new Date(picker.minDate),
					lastDate = new Date(picker.maxDate).addDays(1),
					nthDayOfWeek = [],
					currMonth = 0,
					selectedDates = [];

				while (currDate.isBefore(lastDate)) {
					let day = currDate.getDay() + 1,
						month = currDate.getMonth() + 1,
						week = currDate.getWeek();

					//If new month, reset the nth days of week to 0
					if (currMonth !== month) {
						currMonth = month;
						nthDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
					}

					nthDayOfWeek[day - 1]++;

					if ((daysOfWeek.length === 0 || daysOfWeek.indexOf(day) >= 0) && (months.length === 0 || months.indexOf(month) >= 0)) {
						let isValid = true;

						switch (frequency) {
							case 1:
							case '1':
							case 'weekly':
								break;

							case 2:
							case '2':
							case 'bi-weekly':
								//Every other week, but sunday is technically the last day of the week, so we want the sunday of the previous week
								if (day === 1 ? week % 2 === 0 : week % 2 === 1) {
									isValid = false;
								}
								break;

							case 3:
							case '3':
							case 'monthly':
								//Only on the first Sunday, Monday, etc. of the month
								if (nthDayOfWeek[day - 1] !== 1) {
									isValid = false;
								}
								break;
						}

						if (isValid) {
							selectedDates.push(new Date(currDate));
						}
					}

					currDate.addDays(1);
				}

				return selectedDates;
			}
		}
	}
</script>
