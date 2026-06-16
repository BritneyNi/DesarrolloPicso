import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uniqueBy',
  standalone: true
})
export class UniqueByPipe implements PipeTransform {
  transform<T>(items: T[], field: keyof T): T[] {
    if (!items) return [];
    const map = new Map<any, T>();
    items.forEach(item => {
      const key = item[field];
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  }
}
