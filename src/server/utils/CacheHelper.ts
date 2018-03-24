import { BaseModel } from '../model/BaseModel';

// TODO: use Memcache
//
// npm install memcached --save
//
// import * as memcached from 'memcached';
// const MEMCACHED_IP_ON_GAE: string = '35.190.255.1:11211'
// const memcachedInstance = new memcached(MEMCACHED_IP_ON_GAE);
//
// async function get(key: string): Promise<BaseModel> {
//     return new Promise<BaseModel>((resolve: (value: BaseModel) => void, reject: (reason: any) => void): void => {
//         memcachedInstance.get(key, (error: number, data: BaseModel): void => {
//             if (error) {
//                 reject(error);
//                 return;
//             }
//             resolve(data);
//         });
//     });
// }

// async function set(key: string, data: BaseModel): Promise<void> {
//     return new Promise<void>((resolve: () => void, reject: (reason: any) => void): void => {
//         memcachedInstance.set(key, data, (error: number, data: BaseModel): void => {
//             if (error) {
//                 reject(error);
//                 return;
//             }
//             resolve();
//         });
//     });
// }

const entityCache: Map<number, BaseModel> = new Map();
const secondaryAccess: Map<string, number> = new Map();

export class CacheHelper {
    private static instance: CacheHelper;

    public static getInstance(): CacheHelper {
        if (!CacheHelper.instance) {
            CacheHelper.instance = new CacheHelper();
        }
        return CacheHelper.instance;
    }

    private constructor() { }

    public async setIt(id: number, entity: BaseModel): Promise<void> {
        if (id) {
            if (entity) {
                entityCache.set(id, entity);
            }
            else {
                entityCache.delete(id);
            }
        }
        return Promise.resolve();
    }

    public async getIt(id: number | string): Promise<BaseModel | undefined> {
        if (typeof id === 'string') {
            id = secondaryAccess.get(id);
        }
        if (id) {
            return Promise.resolve(entityCache.get(id));
        }
        return Promise.resolve(undefined);
    }

    public async setSecondKey(secondKey: string, id: number): Promise<void> {
        if (id) {
            if (id) {
                secondaryAccess.set(secondKey, id);
            }
            else {
                secondaryAccess.delete(secondKey);
            }
        }
        return Promise.resolve();
    }

    public async getSecondKey(secondKey: string): Promise<number | undefined> {
        if (secondKey) {
            return Promise.resolve(secondaryAccess.get(secondKey));
        }
        return Promise.resolve(undefined);
    }

}
