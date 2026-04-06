import { Injectable } from '@nestjs/common';
import { JanmasethuUserRole, JanmasethuPermission, JanmasethuUserContext } from './janmasethu.types';
import { Thread } from '../../types';

@Injectable()
export class JanmasethuRbacService {
    private readonly permissionMatrix: Record<JanmasethuUserRole, JanmasethuPermission[]> = {
        [JanmasethuUserRole.CRO]: [
            JanmasethuPermission.VIEW_THREAD,
            JanmasethuPermission.ASSIGN_THREAD,
            JanmasethuPermission.TAKE_CONTROL,
            JanmasethuPermission.REPLY,
            JanmasethuPermission.OVERRIDE_SLA,
            JanmasethuPermission.VIEW_PII,
        ],
        [JanmasethuUserRole.DOCTOR]: [
            JanmasethuPermission.VIEW_THREAD,
            JanmasethuPermission.TAKE_CONTROL,
            JanmasethuPermission.REPLY,
            JanmasethuPermission.VIEW_PII,
        ],
        [JanmasethuUserRole.NURSE]: [
            JanmasethuPermission.VIEW_THREAD,
            JanmasethuPermission.TAKE_CONTROL,
            JanmasethuPermission.REPLY,
        ],
    };

    hasPermission(role: JanmasethuUserRole, permission: JanmasethuPermission): boolean {
        return this.permissionMatrix[role]?.includes(permission) || false;
    }

    canViewThread(user: JanmasethuUserContext, thread: Thread): boolean {
        if (user.role === JanmasethuUserRole.CRO) return true;

        if (user.role === JanmasethuUserRole.DOCTOR) {
            return thread.assigned_user_id === user.id || thread.assigned_role === 'DOCTOR_QUEUE';
        }

        if (user.role === JanmasethuUserRole.NURSE) {
            return thread.assigned_role === 'NURSE_QUEUE';
        }

        return false;
    }

    canAssign(user: JanmasethuUserContext): boolean {
        return this.hasPermission(user.role, JanmasethuPermission.ASSIGN_THREAD);
    }

    canTakeControl(user: JanmasethuUserContext, thread: Thread): boolean {
        const status = thread.status as string;

        // CRO can take control of red and yellow
        if (user.role === JanmasethuUserRole.CRO) {
            return ['red', 'yellow'].includes(status);
        }

        // Only DOCTOR can take control of red
        if (user.role === JanmasethuUserRole.DOCTOR) {
            return status === 'red';
        }

        // NURSE can take control of yellow, and RED as first responder
        if (user.role === JanmasethuUserRole.NURSE) {
            return ['yellow', 'red'].includes(status);
        }

        return false;
    }

    canReply(user: JanmasethuUserContext, thread: Thread): boolean {
        if (!this.hasPermission(user.role, JanmasethuPermission.REPLY)) return false;

        const status = thread.status as string;

        // CRO can reply to red and yellow
        if (user.role === JanmasethuUserRole.CRO) {
            return ['red', 'yellow'].includes(status);
        }

        // Doctor/Nurse can only reply if assigned to them or if they took control 
        // AND the status matches their role.
        if (user.role === JanmasethuUserRole.DOCTOR) {
            return status === 'red' && thread.assigned_user_id === user.id;
        }

        if (user.role === JanmasethuUserRole.NURSE) {
            return ['yellow', 'red'].includes(status) && thread.assigned_user_id === user.id;
        }

        return false;
    }

    canViewPII(user: JanmasethuUserContext): boolean {
        return this.hasPermission(user.role, JanmasethuPermission.VIEW_PII);
    }
}
