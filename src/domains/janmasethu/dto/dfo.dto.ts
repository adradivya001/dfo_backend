import { IsEnum, IsUUID, IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { JourneyStage, AppointmentStatus } from '../dfo.types';

export class SyncPatientDto {
    @IsUUID()
    @IsOptional()
    id?: string;

    @IsString()
    @IsNotEmpty()
    full_name: string;

    @IsString()
    @IsNotEmpty()
    phone_number: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsEnum(JourneyStage)
    journey_stage: JourneyStage;

    @IsInt()
    @Min(0)
    @Max(40)
    @IsOptional()
    pregnancy_stage?: number;
}

export class UpdateJourneyDto {
    @IsEnum(JourneyStage)
    stage: JourneyStage;

    @IsInt()
    @Min(0)
    @Max(42)
    @IsOptional()
    pregnancy_stage?: number;
}

export class BookAppointmentDto {
    @IsUUID()
    patient_id: string;

    @IsUUID()
    doctor_id: string;

    @IsDateString()
    appointment_date: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class StartConsultationDto {
    @IsUUID()
    threadId: string;
}

export class CloseConsultationDto {
    @IsUUID()
    id: string;

    @IsString()
    @IsNotEmpty()
    notes: string;
}

export class AddPrescriptionDto {
    @IsUUID()
    consultation_id: string;

    @IsString()
    @IsNotEmpty()
    medication_name: string;

    @IsString()
    dosage: string;

    @IsString()
    frequency: string;

    @IsInt()
    duration_days: number;

    @IsString()
    @IsOptional()
    special_instructions?: string;
}

export class UploadReportDto {
    @IsUUID()
    patient_id: string;

    @IsString()
    @IsNotEmpty()
    report_type: string; // e.g. Ultrasound, Blood Test, MRI

    @IsString()
    @IsOptional()
    clinical_notes?: string;

    @IsString()
    @IsOptional()
    ordered_by_doctor?: string;
}
