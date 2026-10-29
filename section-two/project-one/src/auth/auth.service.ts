import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './jwt-payload.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const email = dto.email.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersService.create(email, passwordHash);
    return this.signToken(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = this.usersService.findByEmail(dto.email.toLowerCase());
    const passwordMatches =
      user !== undefined && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.signToken(user.id, user.email);
  }

  private signToken(sub: string, email: string): { accessToken: string } {
    const payload: JwtPayload = { sub, email };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
