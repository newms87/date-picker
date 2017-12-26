import VueDatepicker from './DatePicker.vue';

const Plugin = (Vue, params) => {
	Vue.component(typeof params === 'string' ? params : 'vue-datepicker', VueDatepicker);
};

VueDatepicker.install = Plugin;

export default VueDatepicker;
export {VueDatepicker, Plugin};
