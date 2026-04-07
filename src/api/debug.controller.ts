import { Controller, Get, Post } from '@nestjs/common';

@Controller('debug')
export class DebugController {
    @Get('ping')
    ping() {
        return { message: 'pong', status: 'alive' };
    }

    @Post('test')
    test() {
        return { message: 'post-working' };
    }
}
