import { BaseModel as Parent } from './BaseModel.js';

export class Category extends Parent {
    // Factory method
    public static getInstance(): Category {
        return new Category();
    }

    // Specific attributes
    public title: string;
    public positionIdx: number = 0;
    public sortBy: string;
}