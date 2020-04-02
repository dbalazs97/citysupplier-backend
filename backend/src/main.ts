import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bootstrap: () => Promise<void> = async () => {
	const app = await NestFactory.create(AppModule);
	await app.listen(3000);
};

bootstrap().catch();
