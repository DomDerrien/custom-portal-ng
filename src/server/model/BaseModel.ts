export class BaseModel {
    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseModel {
        throw new Error('Must be overriden!');
    }

    // Common attributes
    public id: number;
    public created: string;
    public updated: string;

    public merge(update: BaseModel): boolean {
        if (typeof update !== 'object') {
            // Cannot apply proposed update
            return false;
        }
        return BaseModel.merge(this, update);
    }

    public static merge(source, update) {
        let updated = false;

        if (typeof source === 'object' && typeof update === 'object') {
            for (let key in update) {
                if (key === 'id' || key === 'created' || key === 'updated') {
                    continue;
                }

                const sourceValue = source[key];
                const updateValue = update[key];

                if (updateValue !== undefined) {
                    if (typeof updateValue === 'object' && !Array.isArray(updateValue)) {
                        updated = BaseModel.merge(sourceValue, updateValue) || updated;
                    }
                    else if (Array.isArray(updateValue)) {
                        let sameArray = sourceValue !== undefined && Array.isArray(sourceValue) && sourceValue.length === updateValue.length;
                        let idx = 0;
                        while (sameArray && idx < updateValue.length) {
                            let sourceCellValue = sourceValue[idx];
                            let updateCellValue = updateValue[idx];
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