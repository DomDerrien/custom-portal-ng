import { BaseModel as Parent } from './BaseModel';

export class User extends Parent {
    // Factory method
    public static getInstance(): User {
        return new User();
    }

    // Specific attributes
    public name: string;
    public email: string;
}