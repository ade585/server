import { Authorization, type DataSource } from '../../..';
import { type Runtime } from '../../Runtime';
import { type NanoId } from '../../shared';
import { type Admin } from '../Admin';

export interface FindOneAdminInput {
    runtime: Runtime;
    context: Authorization.Context;
    request: { adminId: NanoId };
}

export async function findOne({ runtime: { dataSourceAdapter, logger }, context, request }: FindOneAdminInput): Promise<Admin | undefined> {
    const { adminId } = request;

    console.log('findOne Request    ');
    console.log(request);

    await Authorization.canQueryUserData({ context, dataSourceAdapter, logger, userId: adminId });

    const admin: DataSource.DBAdmin | undefined = await dataSourceAdapter.adminRepository.findOne({ adminId });

    if (!admin) return;

    return admin;
}
