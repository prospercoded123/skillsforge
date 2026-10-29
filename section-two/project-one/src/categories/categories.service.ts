import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FOREIGN_KEY_VIOLATION,
  hasPostgresCode,
  UNIQUE_VIOLATION,
} from '../common/database/postgres-errors.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category } from './entities/category.entity.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.save(this.categories.create({ userId, name: dto.name }));
  }

  findAll(userId: string): Promise<Category[]> {
    return this.categories.find({ where: { userId }, order: { name: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.categories.findOneBy({ id, userId });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(userId, id);
    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    return this.save(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.findOne(userId, id);
    try {
      await this.categories.remove(category);
    } catch (error) {
      // Expenses reference categories with ON DELETE RESTRICT, so Postgres refuses the delete.
      if (hasPostgresCode(error, FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException('Category still has expenses');
      }
      throw error;
    }
  }

  private async save(category: Category): Promise<Category> {
    try {
      return await this.categories.save(category);
    } catch (error) {
      if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }
}
