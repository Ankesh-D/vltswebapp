import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'underscoreToSpace',
  standalone: true
})
export class UnderscoreToSpacePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/_/g, ' ');
  }
}
