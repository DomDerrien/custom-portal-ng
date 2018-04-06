import { readOnly } from './ReadOnly.js';
import { BaseModel as Parent } from './BaseModel.js';

export class User extends Parent {
    // Factory method
    public static getInstance(): User {
        return new User();
    }

    public static readonly Internal = Object.assign(new User(), { id: -1, name: 'Internal Process' });

    // Specific attributes
    public name: string;
    @readOnly() public email: string;
    @readOnly() public verifiedEmail: boolean;
    public picture: string;
    @readOnly() public latLong: string;
    @readOnly() public city: string;
    @readOnly() public region: string;
    @readOnly() public country: string;
}