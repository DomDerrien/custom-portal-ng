import { readOnly, getReadOnly } from './ReadOnly.js';
import { ServerErrorException } from '../exceptions/ServerErrorException.js';

export class BaseModel {
    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseModel {
        throw new ServerErrorException('Must be overriden!');
    }

    // Common attributes
    @readOnly() public id: number;
    @readOnly() public created: string;
    @readOnly() public updated: string;
    @readOnly() public ownerId: number;

    public merge(update: BaseModel): boolean {
        if (typeof update !== 'object') {
            // Cannot apply proposed update
            return false;
        }
        return BaseModel.merge(this, update);
    }

    public static merge(source: any, update: any): boolean {
        let updated = false;

        if (typeof source === 'object' && typeof update === 'object') {
            for (let key in update) {
                if (getReadOnly(source, key) === true) {
                    continue;
                }

                const sourceValue: any = source[key];
                const updateValue: any = update[key];

                if (updateValue !== undefined) {
                    if (typeof updateValue === 'object' && !Array.isArray(updateValue)) {
                        updated = BaseModel.merge(sourceValue, updateValue) || updated;
                    }
                    else if (Array.isArray(updateValue)) {
                        let sameArray: boolean = sourceValue !== undefined && Array.isArray(sourceValue) && sourceValue.length === updateValue.length;
                        let idx: number = 0;
                        while (sameArray && idx < updateValue.length) {
                            let sourceCellValue: any = sourceValue[idx];
                            let updateCellValue: any = updateValue[idx];
                            if (updateCellValue !== undefined && typeof updateCellValue === 'object' && Object.keys(updateCellValue).length && !Array.isArray(updateCellValue)) {
                                sameArray = !BaseModel.merge(sourceCellValue, updateCellValue);
                            }
                            else {
                                sameArray = sourceValue[idx] === updateValue[idx];
                            }
                            idx += 1;
                        }
                        if (!sameArray) {
                            updated = true;
                            source[key] = updateValue;
                            break;
                        }
                    }
                    else {
                        if (sourceValue !== updateValue) {
                            updated = true;
                            source[key] = updateValue;
                        }
                    }
                }
            }
        }

        return updated;
    }
}