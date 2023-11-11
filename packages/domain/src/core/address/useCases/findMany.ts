import { Authorization, type DataSource } from '../../..';
import packLocation from '../../packLocation';
import { type Runtime } from '../../Runtime';
import { type FindManyRequest, type NanoId } from '../../shared';
import { type Address } from '../Address';

export interface FindManyAddressesInput {
    runtime: Runtime;
    context: Authorization.Context;
    request: FindManyRequest & { userId: NanoId };
}

export async function findMany({
    runtime: { dataSourceAdapter, logger },
    context,
    request,
}: FindManyAddressesInput): Promise<Address[] | undefined> {
    const { userId } = request;

    await Authorization.canQueryUserData({ context, dataSourceAdapter, logger, userId });

    const addresses: DataSource.DBAddress[] | undefined = await dataSourceAdapter.addressRepository.findMany({ userId });

    if (!addresses) return;

    return addresses.map(packLocation);
}
