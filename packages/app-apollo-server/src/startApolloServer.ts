import { ApolloServer, type ApolloServerPlugin } from '@apollo/server';
import { expressMiddleware, type ExpressContextFunctionArgument } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import {
    ApolloServerPluginLandingPageLocalDefault,
    ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import { loadFilesSync } from '@graphql-tools/load-files';
import { addMocksToSchema } from '@graphql-tools/mock';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Authorization, type DataSource, type Logger, type Service } from '@people-eat/server-domain';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { createWriteStream, existsSync } from 'fs';
import { type GraphQLSchema } from 'graphql';
import {
    DateResolver,
    DateTimeResolver,
    EmailAddressResolver,
    LatitudeResolver,
    LongitudeResolver,
    PhoneNumberResolver,
    UnsignedIntResolver,
    URLResolver,
    UUIDResolver,
} from 'graphql-scalars';
import { GraphQLUpload, graphqlUploadExpress } from 'graphql-upload-minimal';
import { type Disposable } from 'graphql-ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer as createHttpServer, type IncomingMessage, type Server as HttpServer } from 'http';
import { join } from 'path';
import sharp from 'sharp';
import { WebSocketServer } from 'ws';
import { createAddressResolvers } from './address/createAddressResolvers';
import { createAdminResolvers } from './admin/createAdminResolvers';
import { createAllergyResolvers } from './allergy/createAllergyResolvers';
import { createAnonymousSessionResolvers } from './anonymous-session/createAnonymousSessionResolvers';
import { createAnonymousUserResolvers } from './anonymous-user/createAnonymousUserResolvers';
import { createBookingRequestResolvers } from './booking-request/createBookingRequestResolvers';
import { createCategoryResolvers } from './category/createCategoryResolvers';
import { createChatMessageResolvers } from './chat-message/createChatMessageResolvers';
import { createCookRatingResolvers } from './cook-rating/createCookRatingResolvers';
import { createCookSpecificFeeResolvers } from './cook-specific-fee/createCookSpecificFeeResolvers';
import { createCookVisitResolvers } from './cook-visit/createCookVisitResolvers';
import { createCookResolvers } from './cook/createCookResolvers';
import { createCourseResolvers } from './course/createCourseResolvers';
import { createCustomerFeeUpdateResolvers } from './customer-fee-update/createCustomerFeeUpdateResolvers';
import { createEmailAddressUpdateResolvers } from './email-address-update/createEmailAddressUpdateResolvers';
import { createFollowingResolvers } from './following/createFollowingResolvers';
import {
    type GQLResolvers,
    type GQLSubscriptionBookingRequestChatMessageCreationsArgs,
    type GQLSubscriptionBookingRequestUpdatesByCookIdArgs,
    type GQLSubscriptionBookingRequestUpdatesByUserIdArgs,
} from './generated';
import { createGiftCardPromoCodeResolvers } from './gift-card-promo-code/createGiftCardPromoCodeResolvers';
import { createGiftCardResolvers } from './gift-card/createGiftCardResolvers';
import { createGlobalBookingRequestResolvers } from './global-booking-request/createGlobalBookingRequestResolvers';
import { createKitchenResolvers } from './kitchen/createKitchenResolvers';
import { createLanguageResolvers } from './language/createLanguageResolvers';
import { createMealOptionResolvers } from './meal-option/createMealOptionResolvers';
import { createMealResolvers } from './meal/createMealResolvers';
import { createMenuConfigurationResolvers } from './menu-configuration/createMenuConfigurationResolvers';
import { createMenuVisitResolvers } from './menu-visit/createMenuVisitResolvers';
import { createMenuResolvers } from './menu/createMenuResolvers';
import { createNewsletterSubscriptionResolvers } from './newsletter-subscription/createNewsletterSubscriptionResolvers';
import { createNotificationConfigurationResolvers } from './notification-configuration/createNotificationConfigurationResolvers';
import { createNotificationResolvers } from './notification/createNotificationResolvers';
import { createOneTimeAccessTokenResolvers } from './one-time-access-token/createOneTimeAccessTokenResolvers';
import { createPhoneNumberUpdateResolvers } from './phone-number-update/createPhoneNumberUpdateResolvers';
import { createPrivacyPolicyUpdateResolvers } from './privacy-policy-update/createPrivacyPolicyUpdateResolvers';
import { createPublicCookResolvers } from './public-cook/createPublicCookResolvers';
import { createPublicMenuResolvers } from './public-menu/createPublicMenuResolvers';
import { createPublicPrivacyPolicyUpdateResolvers } from './public-privacy-policy-update/createPublicPrivacyPolicyUpdateResolvers';
import { createPublicTermsUpdateResolvers } from './public-terms-update/createPublicTermsUpdateResolvers';
import { createPublicUserResolvers } from './public-user/createPublicUserResolvers';
import { createSearchRequestResolvers } from './search-request/createSearchRequestResolvers';
import { createSessionResolvers } from './session/createSessionResolvers';
import { createSupportRequestResolvers } from './support-request/createSupportRequestResolvers';
import { createTermsUpdateResolvers } from './terms-update/createTermsUpdateResolvers';
import { createUserRatingResolvers } from './user-rating/createUserRatingResolvers';
import { createUserResolvers } from './user/createUserResolvers';

export interface StartApolloServerAppOptions {
    dataSourceAdapter: DataSource.Adapter;
    logger: Logger.Adapter;
    service: Service;
    mockSchema: boolean;
    port: number;
    sessionIdCookie: { name: string; domainScope: string; secure: boolean };
    stripePublishableKey: string;
}

export interface StartApolloServerAppResult {
    path: string;
}

export async function startApolloServerApp({
    dataSourceAdapter,
    logger,
    mockSchema,
    port,
    sessionIdCookie,
    service,
    stripePublishableKey,
}: StartApolloServerAppOptions): Promise<StartApolloServerAppResult> {
    const typeDefs: string[] = loadFilesSync('./**/*.graphql');

    const resolvers: GQLResolvers = {
        Date: DateResolver,
        DateTime: DateTimeResolver,
        EmailAddress: EmailAddressResolver,
        Latitude: LatitudeResolver,
        Longitude: LongitudeResolver,
        PhoneNumber: PhoneNumberResolver,
        UInt: UnsignedIntResolver,
        UUID: UUIDResolver,
        Url: URLResolver,
        Upload: GraphQLUpload,
        Query: {
            languages: () => ({} as any),
            categories: () => ({} as any),
            kitchens: () => ({} as any),
            allergies: () => ({} as any),
            users: () => ({} as any),
            sessions: () => ({} as any),
            cooks: () => ({} as any),
            publicCooks: () => ({} as any),
            publicMenus: () => ({} as any),
            publicTermsUpdates: () => ({} as any),
            publicPrivacyPolicyUpdates: () => ({} as any),
            stripePublishableKey: () => stripePublishableKey,
            globalBookingRequests: () => ({}),
            bookingRequests: () => ({}),
            supportRequests: () => ({}),
            searchRequests: () => ({} as any),
            couponCodes: () => ({} as any),
            admins: () => ({} as any),
            giftCards: () => ({} as any),
        },
        Mutation: {
            admins: () => ({} as any),
            languages: () => ({} as any),
            categories: () => ({} as any),
            kitchens: () => ({} as any),
            allergies: () => ({} as any),
            users: () => ({} as any),
            sessions: () => ({} as any),
            cooks: () => ({} as any),
            searchRequests: () => ({} as any),
            giftCards: () => ({} as any),
            newsletterSubscriptions: () => ({} as any),
            cookVisits: () => ({} as any),
            menuVisits: () => ({} as any),
        },
        Subscription: {
            bookingRequestChatMessageCreations: {
                subscribe: (_parent: unknown, { bookingRequestId }: GQLSubscriptionBookingRequestChatMessageCreationsArgs) => ({
                    [Symbol.asyncIterator]: () =>
                        service.publisher.asyncIterator(`booking-request-chat-message-creations-${bookingRequestId}`),
                }),
            },
            bookingRequestUpdatesByUserId: {
                subscribe: (_parent: unknown, { bookingRequestId }: GQLSubscriptionBookingRequestUpdatesByUserIdArgs) => ({
                    [Symbol.asyncIterator]: () => service.publisher.asyncIterator(`booking-request-updates-by-user-id-${bookingRequestId}`),
                }),
            },
            bookingRequestUpdatesByCookId: {
                subscribe: (_parent: unknown, { bookingRequestId }: GQLSubscriptionBookingRequestUpdatesByCookIdArgs) => ({
                    [Symbol.asyncIterator]: () => service.publisher.asyncIterator(`booking-request-updates-by-cook-id-${bookingRequestId}`),
                }),
            },
        },
        ...createLanguageResolvers(service),
        ...createCategoryResolvers(service),
        ...createKitchenResolvers(service),
        ...createAllergyResolvers(service),
        ...createUserResolvers(service),
        ...createPublicUserResolvers(),
        ...createAnonymousUserResolvers(),
        ...createSessionResolvers(service),
        ...createAnonymousSessionResolvers(),
        ...createAdminResolvers(service),
        ...createCookResolvers(service),
        ...createPublicCookResolvers(service),
        ...createNotificationResolvers(),
        ...createNotificationConfigurationResolvers(),
        ...createTermsUpdateResolvers(),
        ...createPublicTermsUpdateResolvers(service),
        ...createPrivacyPolicyUpdateResolvers(),
        ...createPublicPrivacyPolicyUpdateResolvers(service),
        ...createCustomerFeeUpdateResolvers(),
        ...createCookSpecificFeeResolvers(),
        ...createPhoneNumberUpdateResolvers(service),
        ...createEmailAddressUpdateResolvers(service),
        ...createMealResolvers(service),
        ...createMenuResolvers(service),
        ...createCourseResolvers(service),
        ...createMealOptionResolvers(service),
        ...createPublicMenuResolvers(service),
        ...createGlobalBookingRequestResolvers(service),
        ...createBookingRequestResolvers(service),
        ...createMenuConfigurationResolvers(),
        ...createChatMessageResolvers(service),
        ...createCookRatingResolvers(),
        ...createUserRatingResolvers(),
        ...createAddressResolvers(service),
        ...createCookVisitResolvers(service),
        ...createMenuVisitResolvers(service),
        ...createFollowingResolvers(service),
        ...createOneTimeAccessTokenResolvers(service),
        ...createSupportRequestResolvers(service),
        ...createSearchRequestResolvers(service),
        ...createGiftCardPromoCodeResolvers(service),
        ...createGiftCardResolvers(service),
        ...createNewsletterSubscriptionResolvers(service),
    };

    const path: string = '/graphql';

    let schema: GraphQLSchema = makeExecutableSchema({ resolvers, typeDefs });

    if (mockSchema) schema = addMocksToSchema({ schema });

    const expressApp: Express = express();
    const httpServer: HttpServer = createHttpServer(expressApp);
    const webSocketServer: WebSocketServer = new WebSocketServer({
        server: httpServer,
        path,
    });

    console.log(webSocketServer);

    webSocketServer.on('headers', (_headers: string[], request: IncomingMessage & { sessionId?: string }) => {
        if (!request.headers.cookie) throw new Error('Websocket connection without session id was declined');

        request.sessionId = request.headers.cookie
            .split(';')
            .reduce((cookieMap: Map<string, string>, cookie: string) => {
                const [key, value] = cookie.trim().split('=');
                if (!key || !value) throw new Error('Invalid sessionId header');
                return cookieMap.set(key, value);
            }, new Map<string, string>())
            .get(sessionIdCookie.name);
    });

    const serverCleanup: Disposable = useServer(
        {
            context: async (
                context: Authorization.Context & { extra: { request: IncomingMessage & { sessionId?: string } } },
            ): Promise<Authorization.Context> => {
                const sessionId: string | undefined = context.extra.request.sessionId;

                if (!sessionId) throw new Error('Subscription requested without session id');

                const result: Authorization.AuthorizeSessionOutput | undefined = await Authorization.authorizeSession({
                    dataSourceAdapter,
                    logger,
                    sessionId,
                });

                if (!result || result.sessionId !== sessionId) throw new Error('websocket session error');

                return {
                    sessionId: result.sessionId,
                    userId: result.userId,
                };
            },
            schema,
        },
        webSocketServer,
    );

    const plugins: ApolloServerPlugin[] = [
        process.env.NODE_ENV === 'production'
            ? ApolloServerPluginLandingPageProductionDefault({
                  embed: {
                      displayOptions: { docsPanelState: 'open', showHeadersAndEnvVars: true, theme: 'light' },
                      persistExplorerState: true,
                  },
                  graphRef: 'people-eat@current',
              })
            : ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true }),

        // Proper shutdown for the HTTP server.
        ApolloServerPluginDrainHttpServer({ httpServer }),

        // Proper shutdown for the WebSocket server.
        {
            async serverWillStart(): Promise<{ drainServer: () => Promise<void> }> {
                return {
                    async drainServer(): Promise<void> {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ];

    const server: ApolloServer = new ApolloServer({ plugins, schema, introspection: true });

    await server.start();

    expressApp.use(
        path,
        cors<cors.CorsRequest>({ origin: true, credentials: true }),
        bodyParser.json(),
        cookieParser(),
        graphqlUploadExpress({ maxFileSize: undefined, maxFiles: 10 }),
        expressMiddleware(server, {
            context: async ({ req, res }: ExpressContextFunctionArgument): Promise<Authorization.Context> => {
                const sessionId: string | undefined = req.cookies[sessionIdCookie.name];
                const result: Authorization.AuthorizeSessionOutput | undefined = await Authorization.authorizeSession({
                    dataSourceAdapter,
                    logger,
                    sessionId,
                });

                if (!result) throw new Error();

                res.cookie(sessionIdCookie.name, result.sessionId, {
                    expires: result.expirationDate,
                    httpOnly: true,
                    sameSite: sessionIdCookie.secure ? 'none' : 'lax',
                    secure: sessionIdCookie.secure,
                    domain: sessionIdCookie.domainScope,
                });

                return {
                    ...req,
                    sessionId: result.sessionId,
                    userId: result.userId,
                };
            },
        }),
    );

    expressApp.get('/profile-pictures/:profilePictureId', async function (request: Request, response: Response): Promise<void> {
        const { profilePictureId } = request.params;
        const edgeLength: string = (request.query.el as string) ?? '1024';
        const filePath: string = join(process.cwd(), `images/profile-pictures/${edgeLength}x${edgeLength}/${profilePictureId}.png`);
        const originalFilePath: string = join(process.cwd(), `images/profile-pictures/original/${profilePictureId}.png`);

        if (!existsSync(filePath) && existsSync(originalFilePath)) {
            await new Promise<boolean>((resolve: (success: boolean) => void, reject: (success: boolean) => void) =>
                sharp(originalFilePath)
                    .resize(Number(edgeLength))
                    .pipe(
                        createWriteStream(
                            join(process.cwd(), `images/profile-pictures/${edgeLength}x${edgeLength}/${profilePictureId}.png`),
                        ),
                    )
                    .on('finish', () => resolve(true))
                    .on('error', () => reject(false)),
            );
        }

        response.sendFile(filePath);
    });

    expressApp.get('/meal-images/:mealImageId', async function (request: Request, response: Response): Promise<void> {
        const { mealImageId } = request.params;
        const edgeLength: string = (request.query.el as string) ?? '1024';
        const filePath: string = join(process.cwd(), `images/meal-images/${edgeLength}x${edgeLength}/${mealImageId}.png`);
        const originalFilePath: string = join(process.cwd(), `images/meal-images/original/${mealImageId}.png`);

        if (!existsSync(filePath) && existsSync(originalFilePath)) {
            await new Promise<boolean>((resolve: (success: boolean) => void, reject: (success: boolean) => void) =>
                sharp(originalFilePath)
                    .resize(Number(edgeLength))
                    .pipe(createWriteStream(join(process.cwd(), `images/meal-images/${edgeLength}x${edgeLength}/${mealImageId}.png`)))
                    .on('finish', () => resolve(true))
                    .on('error', () => reject(false)),
            );
        }

        response.sendFile(filePath);
    });

    httpServer.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}${path}`);
        console.log(`WebSocket server is running on ws://localhost:${port}${path}`);
    });

    return { path: `http://localhost:${port}${path}` };
}
