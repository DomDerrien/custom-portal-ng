import { User } from '../model/User';

// Temporary replacement of the GAE memcache service
// Transient because server instances are recycled if idle for too long
// Not shared between NodeJS instances
// :(
export class UserCache {

    private cache: Map<string, User> = new Map();

    public set(token: string, entity: User): User {
        return this.cache.set(token, entity).get(token);
    }

    public get(token: string): User {
        return this.cache.get(token);
    }

    public clear(token: string): boolean {
        return this.cache.delete(token);
    }
}