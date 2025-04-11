import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { compare } from 'bcryptjs';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, nickName, password } = loginDto;

    const loginField = email || nickName;

    if (!loginField) {
      throw new HttpException(
        'Email o nickName son requeridos',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!password) {
      throw new HttpException('Password es requerido', HttpStatus.BAD_REQUEST);
    }

    const resultData = await this.validateUser(loginField);
    const { passwordHash, isVerified, result: procedureResult } = resultData;

    if (procedureResult === 'USER_NOT_FOUND') {
      throw new HttpException(
        'El nickName o correo no existen.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!(await this.validatePassword(password, passwordHash))) {
      throw new HttpException(
        'Contraseña incorrecta.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (isVerified === 0) {
      throw new HttpException('Usuario no verificado.', HttpStatus.FORBIDDEN);
    }

    const user = await this.getUser(loginField);
    const token = this.generateJwtToken(user);

    return {
      token,
      user: this.buildUserResponse(user),
    };
  }

  private async validateUser(nickNameOrEmail: string) {
    await this.dataSource.query(
      `CALL validate_session(?, @p_password_hash, @p_user_verified, @p_result);`,
      [nickNameOrEmail],
    );

    const [resultData] = await this.dataSource.query(
      `SELECT 
        @p_password_hash AS passwordHash, 
        @p_user_verified AS isVerified, 
        @p_result AS result;`,
    );

    if (!resultData) {
      throw new HttpException(
        'Error al obtener datos de sesión.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return resultData;
  }

  private async validatePassword(password: string, passwordHash: string) {
    return compare(password, passwordHash);
  }

  private async getUser(nickNameOrEmail: string) {
    const [user] = await this.dataSource.query(
      `SELECT uuid, user_name AS userName, user_nickname AS nickName, user_email AS email 
       FROM user 
       WHERE user_nickname = ? OR user_email = ?
       LIMIT 1;`,
      [nickNameOrEmail, nickNameOrEmail],
    );

    if (!user) {
      throw new HttpException(
        'Error interno. Usuario no encontrado después de validar.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return user;
  }

  private generateJwtToken(user: any) {
    const payload = { uuid: user.uuid };
    return this.jwtService.sign(payload);
  }

  private buildUserResponse(user: any) {
    return {
      uuid: user.uuid,
      name: user.userName,
      nickName: user.nickName,
      email: user.email,
    };
  }
}
