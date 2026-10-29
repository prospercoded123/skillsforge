import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category } from './entities/category.entity.js';

@Injectable()
export class CategoriesService {
  private readonly categories = new Map<string, Category>();

  create(userId: string, dto: CreateCategoryDto): Category {
    this.assertNameAvailable(userId, dto.name);

    const category: Category = {
      id: randomUUID(),
      userId,
      name: dto.name,
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  findAll(userId: string): Category[] {
    return [...this.categories.values()].filter((c) => c.userId === userId);
  }

  findOne(userId: string, id: string): Category {
    const category = this.categories.get(id);
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  update(userId: string, id: string, dto: UpdateCategoryDto): Category {
    const category = this.findOne(userId, id);
    if (dto.name !== undefined && dto.name !== category.name) {
      this.assertNameAvailable(userId, dto.name);
      category.name = dto.name;
    }
    return category;
  }

  remove(userId: string, id: string): void {
    this.findOne(userId, id);
    this.categories.delete(id);
  }

  private assertNameAvailable(userId: string, name: string): void {
    const taken = this.findAll(userId).some((c) => c.name === name);
    if (taken) {
      throw new ConflictException('Category name already exists');
    }
  }
}
