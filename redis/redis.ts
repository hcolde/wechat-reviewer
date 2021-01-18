import { Tedis } from "tedis";
import config from "../config/config.json"

export class Redis {
    redis: Tedis;

    constructor() {
        this.redis = new Tedis({
            host: config.redis.host,
            port: config.redis.port,
        })
    }

    hmset(key:string, hash:{}, expire:number = 0) {
        this.redis.hmset(key, hash);
        if (expire > 0) this.redis.expire(key, expire);
    }

    async hmget(key:string, field:string) {
        return await this.redis.hmget(key, field);
    }

    set(key:string, value:string, expire:number = 0) {
        this.redis.set(key, value);
        if (expire > 0) this.redis.expire(key, expire);
    }

    async get(key:string) {
        return await this.redis.get(key);
    }

    close() {
        this.redis.close()
    }
}