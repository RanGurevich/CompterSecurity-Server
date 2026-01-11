const ALLOWED_LONG_FIELDS = ['token'];
const MAX_LENGTH = 20;


function checkStringLength(value, fieldName) {
    if (typeof value !== 'string') {
        return null; 
    }
    
    // if recived field is allowed to be long, skip
    if (ALLOWED_LONG_FIELDS.includes(fieldName)) {
        return null;
    }
    
    if (value.length > MAX_LENGTH) {
        return {
            field: fieldName,
            maxLength: MAX_LENGTH,
            actualLength: value.length
        };
    }
    
    return null;
}


function validateObject(obj, prefix = '') {
    const errors = [];
    
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return errors;
    }
    
    for (const [key, value] of Object.entries(obj)) {
        const fieldName = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
            const error = checkStringLength(value, key);
            if (error) {
                error.field = fieldName;
                errors.push(error);
            }
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nestedErrors = validateObject(value, fieldName);
            errors.push(...nestedErrors);
        }
    }
    
    return errors;
}


function validateInputLength(req, res, next) {
    const errors = [];
    
    if (req.body) {
        errors.push(...validateObject(req.body, 'body'));
    }
    
    if (req.query) {
        errors.push(...validateObject(req.query, 'query'));
    }
    
    if (req.params) {
        errors.push(...validateObject(req.params, 'params'));
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            message: "Field length exceeds maximum allowed",
            maxLength: MAX_LENGTH,
            errors: errors
        });
    }
    
    next();
}

module.exports = validateInputLength;