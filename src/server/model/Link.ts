import { readOnly } from './ReadOnly.js';
import { BaseModel as Parent } from './BaseModel.js';

export class Link extends Parent {
    // Factory method
    public static getInstance(): Link {
        return new Link();
    }

    // Specific attributes
    public title: string;
    public href: string;
    @readOnly() public categoryId: number;
    public faviconUrl?: string;
}