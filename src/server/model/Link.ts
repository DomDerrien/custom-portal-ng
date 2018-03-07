import { BaseModel as Parent } from './BaseModel';

export class Link extends Parent {
    // Factory method
    public static getInstance(): Link {
        return new Link();
    }

    // Specific attributes
    public title: string;
    public href: string;
    public categoryId: number;
}