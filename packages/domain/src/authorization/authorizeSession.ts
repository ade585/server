import { type DataSource, type Logger, type Session } from '..';
import { type NanoId } from '../core/shared';
import createOneSession from './createOneSession';
import extendOneSession from './extendOneSession';

export interface AuthorizeSessionInput {
    dataSourceAdapter: DataSource.Adapter;
    logger: Logger.Adapter;
    sessionId?: NanoId;
}

export interface AuthorizeSessionOutput {
    expirationDate: Date;
    sessionId: NanoId;
    userId?: NanoId;
}

// one month
const sessionLifeTime: number = 30 * 24 * 60 * 60 * 1000;

export async function authorizeSession({
    dataSourceAdapter,
    logger,
    sessionId,
}: AuthorizeSessionInput): Promise<AuthorizeSessionOutput | undefined> {
    if (sessionId !== undefined) console.log(sessionId);

    if (!sessionId) {
        const createdSessionId: string | undefined = await createOneSession({ dataSourceAdapter, logger });
        if (!createdSessionId) {
            logger.error('Failed creating a session for a request without session id');
            return;
        }

        // logger.debug(`Created a session with session id ${createdSessionId} for request without session id`);

        return {
            expirationDate: new Date(Date.now() + sessionLifeTime),
            sessionId: createdSessionId,
            userId: undefined,
        };
    }

    const session: Session | undefined = await dataSourceAdapter.sessionRepository.findOne({ sessionId });

    if (!session) {
        // logger.debug(`Received request with session id ${sessionId} without according session`);

        const createdSessionId: string | undefined = await createOneSession({ dataSourceAdapter, logger });
        if (!createdSessionId) {
            logger.error('Failed creating a session for a request with invalid session id');
            return;
        }

        // logger.debug(`Created a session with session id ${createdSessionId} for request with invalid session id`);

        return {
            expirationDate: new Date(Date.now() + sessionLifeTime),
            sessionId: createdSessionId,
            userId: undefined,
        };
    }

    if (!session.expired && new Date(session.lastExtendedAt.getTime() + sessionLifeTime) > new Date()) {
        // logger.debug(`Received request with session id ${sessionId} with according session that is not expired`);

        const success: boolean = await extendOneSession({ dataSourceAdapter, logger, sessionId });
        if (!success) {
            logger.error(`Extension of session with session id ${sessionId} failed`);
            return;
        }

        // logger.debug(`Extended session with session id ${sessionId}`);

        return {
            expirationDate: new Date(Date.now() + sessionLifeTime),
            sessionId: session.sessionId,
            userId: session.userId,
        };
    }

    // logger.debug(`Received request with session id ${sessionId} with according session that is expired`);

    const createdSessionId: string | undefined = await createOneSession({ dataSourceAdapter, logger });
    if (!createdSessionId) return;

    return {
        expirationDate: new Date(Date.now() + sessionLifeTime),
        sessionId: createdSessionId,
        userId: undefined,
    };
}
