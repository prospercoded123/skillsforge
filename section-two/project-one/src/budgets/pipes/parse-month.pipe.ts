import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MONTH_PATTERN } from '../../common/dates.js';

@Injectable()
export class ParseMonthPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!MONTH_PATTERN.test(value)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }
    return value;
  }
}
