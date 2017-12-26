<template>
	<div>hello</div>
</template>

<script>
	import DatePicker from './DatePicker'
	import DateMultiPicker from './DateMultiPicker'

	export default {
		components: [
			DatePicker,
			DateMultiPicker
		],
		created() {
			console.log('yay');
		}
	}
</script>

<style lang="stylus">
	@import '~flatpickr/src/style/flatpickr.styl';
</style>
