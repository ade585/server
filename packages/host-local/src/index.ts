/* eslint-disable prettier/prettier */
import { createDataSourceAdapter } from '@people-eat/server-adapter-data-source-typeorm';
import { createEmailAdapter } from '@people-eat/server-adapter-email-nodemailer';
import { createLogger } from '@people-eat/server-adapter-logger';
import { createPaymentAdapter } from '@people-eat/server-adapter-payment-stripe';
import { createSMSAdapter } from '@people-eat/server-adapter-sms-twilio';
import { startApolloServerApp } from '@people-eat/server-app-apollo-server';
import {
    createService,
    type DataSource,
    type Email,
    type IdentityProvider,
    type Logger,
    type PaymentProvider,
    type Service,
    type SMS,
} from '@people-eat/server-domain';
import { PubSub } from 'graphql-subscriptions';
import { type EnvironmentVariables } from './EnvironmentVariables.js';
import { getEnvironmentVariables } from './getEnvironmentVariables.js';

const environmentVariables: EnvironmentVariables = getEnvironmentVariables();

const logger: Logger.Adapter = createLogger();

async function bootstrap(): Promise<void> {
    const dataSourceAdapter: DataSource.Adapter = await createDataSourceAdapter({
        connection: {
            databaseHost: environmentVariables.database.host,
            databaseName: environmentVariables.database.name,
            databasePassword: environmentVariables.database.password,
            databasePort: environmentVariables.database.port,
            databaseUser: environmentVariables.database.user,
        },
        logger,
        reset: false,
    });

    const emailAdapter: Email.Adapter = createEmailAdapter({
        logger,
        emailAddress: environmentVariables.email.emailAddress,
        password: environmentVariables.email.password,
    });

    const smsAdapter: SMS.Adapter = createSMSAdapter({
        logger,
        accountSid: environmentVariables.sms.twilioAccountSid,
        authToken: environmentVariables.sms.twilioAuthToken,
        twilioPhoneNumber: environmentVariables.sms.twilioPhoneNumber,
    });

    const identityProviderAdapter: IdentityProvider.Adapter = {
        ['APPLE']: async (_idToken: string) => undefined,
        ['GOOGLE']: async (_idToken: string) => undefined,
    };

    const paymentAdapter: PaymentProvider.Adapter = createPaymentAdapter({
        logger,
        stripeSecretKey: environmentVariables.payment.stripeSecretKey,
        stripeConnectedAccountOnboarding: {
            refreshUrl: 'http://localhost:4200/profile',
            returnToProfileUrl: 'http://localhost:4200/profile?update-wallet-status',
            returnToBookingUrl: 'http://localhost:4200/profile/bookings/r/:bookingRequestId?update-wallet-status',
        },
    });

    const pubsub: PubSub = new PubSub();

    const service: Service = createService({
        dataSourceAdapter,
        logger,
        emailAdapter,
        smsAdapter,
        identityProviderAdapter,
        paymentAdapter,
        serverUrl: 'http://localhost:4000',
        webAppUrl: 'http://localhost:4200',
        publisher: {
            publish: async (key: string, payload: any) => {
                await pubsub.publish(key, payload);
            },
            asyncIterator: (key: string): AsyncIterator<unknown> => pubsub.asyncIterator([key]),
        },
        notificationEmailAddresses: ['yilmaz.cem.2603@gmail.com'],
    });

    logger.setService(service);

    const { path } = await startApolloServerApp({
        dataSourceAdapter,
        logger,
        mockSchema: false,
        port: 4000,
        sessionIdCookie: {
            name: 'local-people-eat-session-id',
            domainScope: 'localhost',
            secure: false,
        },
        service,
        stripePublishableKey: environmentVariables.payment.stripePublishableKey,
    });

    logger.info(`🚀 Apollo server started at ${path}`);
}

bootstrap()
    .then()
    .catch((error: Error) => logger.error(error));
