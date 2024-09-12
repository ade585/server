import { type DataSource, type Logger } from '..';
import { type DBAdmin } from '../data-source';
import { type Context } from './Context';

interface CanQueryUserDataInput {
    dataSourceAdapter: DataSource.Adapter;
    logger: Logger.Adapter;
    context: Context;
    userId: string;
}

export async function canQueryUserData({ context, userId, dataSourceAdapter }: CanQueryUserDataInput): Promise<void> {
    // ADE
    // context.userId = 'aaaaa';
    if (!context.userId) throw new Error(context.userId + 'Unauthorized' + userId);

    if (context.userId === userId) return;

    const admin: DBAdmin | undefined = await dataSourceAdapter.adminRepository.findOne({ adminId: context.userId });

    if (admin) return;

    throw new Error('Unauthorized');
}
