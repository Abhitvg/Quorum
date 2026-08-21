import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Org } from './entities/org.entity';

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
  ) {}

  /**
   * Create a default personal org for a new user.
   * Every user starts in their own org so org_id is never null.
   */
  async createDefaultOrg(userName: string): Promise<Org> {
    const org = this.orgRepo.create({
      name: `${userName}'s Workspace`,
      plan: 'personal',
    });
    return this.orgRepo.save(org);
  }

  async findById(id: string): Promise<Org | null> {
    return this.orgRepo.findOneBy({ id });
  }

  /**
   * Update an organization's details.
   */
  async updateOrg(id: string, data: Partial<Org>): Promise<Org> {
    await this.orgRepo.update(id, data);
    return this.findById(id) as Promise<Org>;
  }
}
