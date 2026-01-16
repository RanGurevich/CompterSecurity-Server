const he = require('he');

function decodeValue(value) {
    if (typeof value === 'string') {
        return he.decode(value);
    }
    
    if (Array.isArray(value)) {
        return value.map(item => decodeValue(item));
    }
    
    if (value !== null && typeof value === 'object') {
        const decoded = {};
        for (const [key, val] of Object.entries(value)) {
            decoded[key] = decodeValue(val);
        }
        return decoded;
    }
    
    return value;
}

function blockPlainText(req, res, next) {
    if (req.body) {
        req.body = decodeValue(req.body);
    }
    
    if (req.query) {
        req.query = decodeValue(req.query);
    }
    
    if (req.params) {
        req.params = decodeValue(req.params);
    }
    
    next();
}

module.exports = blockPlainText;
