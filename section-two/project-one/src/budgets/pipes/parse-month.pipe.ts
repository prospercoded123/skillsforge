import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseMonthPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }
    return value;
  }
}
