import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, User>();

  create(email: string, passwordHash: string): User {
    if (this.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }

    const user: User = {
      id: randomUUID(),
      email,
      passwordHash,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  findByEmail(email: string): User | undefined {
    return [...this.users.values()].find((user) => user.email === email);
  }

  findById(id: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
