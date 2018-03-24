import { BaseModel as Parent } from './BaseModel.js';

export class User extends Parent {
    // Factory method
    public static getInstance(): User {
        return new User();
    }

    public static readonly Internal = Object.assign(new User(), { id: -1, name: 'Internal Process' });

    // Specific attributes
    public name: string;
    public email: string;
    public verifiedEmail: boolean;
    public picture: string;
    public latLong: string;
    public city: string;
    public region: string;
    public country: string;
}