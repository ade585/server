import { type Context } from './Context';

interface IsSignedInInput {
    context: Context;
}

export async function isSignedIn({ context }: IsSignedInInput): Promise<void> {
    if (!context.userId) throw new Error('Unauthorized');
    console.log(context);
}
