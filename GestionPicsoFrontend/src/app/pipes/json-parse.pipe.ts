import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsonParse',
  standalone: true
})
export class JsonParsePipe implements PipeTransform {
  transform(value: string | null): any[] {
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
}
