import { Authorization, type DataSource } from '../../..';
import { type Runtime } from '../../Runtime';
import { type FindManyRequest } from '../../shared';
import { type Admin } from '../Admin';

export interface FindManyAdminsInput {
    runtime: Runtime;
    context: Authorization.Context;
    request: FindManyRequest;
}

export async function findMany({ runtime: { dataSourceAdapter, logger }, context }: FindManyAdminsInput): Promise<Admin[] | undefined> {
    await Authorization.isAdmin({ context, dataSourceAdapter, logger });

    console.log('findMany Request');

    const admins: DataSource.DBAdmin[] | undefined = await dataSourceAdapter.adminRepository.findMany({});

    if (!admins) return;

    return admins;
}
