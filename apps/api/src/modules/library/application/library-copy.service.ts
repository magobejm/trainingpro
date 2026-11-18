import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Role } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { coachOrGlobal } from '../domain/library-scope';
import type { UnifiedCategory } from './library-unified.service';

export const copyNameSchema = z.object({ name: z.string().trim().min(1).max(120) });

type Membership = { id: string; organizationId: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const OWNER_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'archivedAt',
  'archivedBy',
  'scope',
  'organizationId',
  'coachMembershipId',
];

@Injectable()
export class LibraryCopyService {
  constructor(private readonly prisma: PrismaService) {}

  async copyExercise(category: UnifiedCategory, id: string, rawBody: unknown, subject: string) {
    const { name } = copyNameSchema.parse(rawBody);
    const membership = await this.membership(subject);
    const delegate = this.delegateFor(category);
    const source: Row | null = await delegate.findFirst({ where: { id, ...coachOrGlobal(membership.id) } });
    if (!source) throw new NotFoundException('Library item not found');
    const data = this.cloneData(source, name, membership, subject);
    if (category === 'strength') {
      const groups = await this.prisma.exerciseMuscleGroupAssignment.findMany({
        where: { exerciseId: id },
        select: { muscleGroupId: true },
      });
      data.muscleGroups = { create: groups.map((group) => ({ muscleGroupId: group.muscleGroupId })) };
    }
    return delegate.create({ data });
  }

  async copyFood(id: string, rawBody: unknown, subject: string) {
    const { name } = copyNameSchema.parse(rawBody);
    const membership = await this.membership(subject);
    const source: Row | null = await this.prisma.food.findFirst({ where: { id, ...coachOrGlobal(membership.id) } });
    if (!source) throw new NotFoundException('Food not found');
    return this.prisma.food.create({ data: this.cloneData(source, name, membership, subject) as never });
  }

  private cloneData(source: Row, name: string, membership: Membership, subject: string): Row {
    const data: Row = { ...source };
    for (const field of OWNER_FIELDS) delete data[field];
    data.name = name;
    data.scope = LibraryItemScope.COACH;
    data.coachMembershipId = membership.id;
    data.organizationId = membership.organizationId;
    if ('createdBy' in source) {
      data.createdBy = subject;
      data.updatedBy = subject;
    }
    return data;
  }

  private delegateFor(category: UnifiedCategory): Delegate {
    switch (category) {
      case 'strength':
        return this.prisma.exercise;
      case 'cardio':
        return this.prisma.cardioMethod;
      case 'plio':
        return this.prisma.plioExercise;
      case 'warmup':
        return this.prisma.mobilityExercise;
      case 'isometric':
        return this.prisma.isometricExercise;
      case 'sport':
        return this.prisma.sport;
      default:
        throw new BadRequestException('Valid category required');
    }
  }

  private async membership(subject: string): Promise<Membership> {
    const member = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true, organizationId: true },
    });
    if (!member) throw new BadRequestException('Coach membership not found');
    return member;
  }
}
