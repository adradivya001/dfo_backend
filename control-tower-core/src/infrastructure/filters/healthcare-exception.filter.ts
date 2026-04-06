import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, InternalServerErrorException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HealthcareExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HealthcareExceptionFilter');

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal clinical system error. Please contact a CRO.';
        let error_code = 'CLINIC_SYS_ERR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse() as any;
            message = res.message || res;
            error_code = res.error_code || 'HTTP_ERROR';
        } else if (exception.code === '23505') { // Postgres Unique Violation
            status = HttpStatus.CONFLICT;
            message = 'Duplicate entry detected (e.g. Appointment already exists for this slot).';
            error_code = 'DB_DUP_ERR';
        } else if (exception.code === '23503') { // Postgres FK Violation
            status = HttpStatus.BAD_REQUEST;
            message = 'Reference integrity failure (e.g. Patient ID not found).';
            error_code = 'DB_FK_ERR';
        } else if (exception.message?.includes('uuid')) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid clinical identifier (UUID) provided.';
            error_code = 'DB_UUID_ERR';
        }

        const logPayload = {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error_code,
            message,
            stack: status >= 500 ? exception.stack : undefined,
        };

        this.logger.error(`[${error_code}] ${request.method} ${request.url}: ${message}`, logPayload.stack);

        response.status(status).json({
            success: false,
            timestamp: logPayload.timestamp,
            path: logPayload.path,
            error_code,
            message: Array.isArray(message) ? message[0] : message, // Flatten class-validator arrays
        });
    }
}
