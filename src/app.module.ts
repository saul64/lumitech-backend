import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './models/user/user.module';
import * as dotenv from 'dotenv'
import { CheckAuthMiddleware } from './middleware/check-auth.middleware';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb', 
      host: process.env.DB_HOST,            
      port: process.env.DB_PORT 
            ? parseInt(process.env.DB_PORT, 10) 
            : undefined, 
      username: process.env.DB_USERNAME,    
      password: process.env.DB_PASSWORD,    
      database: process.env.DB_NAME,        
      entities: [__dirname + '/**/*.entity{.ts,.js}'], 
      synchronize: false, 
    }),
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer){
    consumer
      .apply(CheckAuthMiddleware)
      .forRoutes({path: 'ruta-protegida', method: RequestMethod.ALL})
  }
}
