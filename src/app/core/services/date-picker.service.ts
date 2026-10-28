import { Injectable } from '@angular/core';
import moment from 'moment';
declare var $: any;

export interface DatePickerConfig {
  inputName: string;
  inputId: string;
  singleDatePicker?: boolean;
  format?: string;
  startDate?: any;
  endDate?: any;
  minDate?: any;
  maxDate?: any;
  minYear?: number;
  maxYear?: number;
  opens?: 'left' | 'right' | 'center';
  drops?: 'up' | 'down' | 'auto';
  timePicker?: boolean;
  showDropdowns?: boolean;
  onHide?: (value: string, event?: any, picker?: any) => void;
  callback?: (start: any, end: any) => void;
}
@Injectable({
  providedIn: 'root'
})
export class DatePickerService {

  initialize(config: DatePickerConfig): void {

    const options = {
      timePicker: config.timePicker ?? false,
      singleDatePicker: config.singleDatePicker ?? true,
      startDate: config.startDate ?? moment(),
      endDate: config.endDate ?? moment(),
      opens: config.opens ?? 'center',
      drops: config.drops ?? 'down',
      showDropdowns: config.showDropdowns ?? false,
      locale: {
        format: config.format ?? 'DD-MMM-YYYY'
      },
      minDate: config.minDate,
      maxDate: config.maxDate,
      minYear: config.minYear,
      maxYear: config.maxYear
    };

    $(() => {

      const selector = `input[name="${config.inputName}"]`;

      $(selector).daterangepicker(options, (start: any, end: any) => {

        $(`#${config.inputId}`).val(start.format(options.locale.format));

        if (config.callback) {
          config.callback(start, end);
        }
      });

      $(selector).on('hide.daterangepicker', (ev: any, picker: any) => {
        if (config.onHide) {
          config.onHide(ev.target.value, ev, picker);
        }
      });
      if (config.onHide) {
        config.onHide(
          (document.getElementById(config.inputId) as HTMLInputElement).value
        );
      }


    });
  }

  getValue(id: string): string {
    return (document.getElementById(id) as HTMLInputElement)?.value || '';
  }

  setDate(inputName: string, date: any, format: string = 'DD-MMM-YYYY') {
  const picker = $(`input[name="${inputName}"]`).data('daterangepicker');

    if (picker) {
      const mDate = moment(date);

      picker.setStartDate(mDate);
      picker.setEndDate(mDate);

      $(`input[name="${inputName}"]`).val(mDate.format(format));
    }
}
}
