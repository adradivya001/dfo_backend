import { Module, Global } from '@nestjs/common';

@Global()
@Module({
    providers: [
        {
            provide: 'BullQueue_routing_queue',
            useValue: {
                add: async () => ({ id: 'mock-job' }),
            },
        },
    ],
    exports: ['BullQueue_routing_queue'],
})
export class MockQueueModule { }
