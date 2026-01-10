module.exports = {
    passwordPolicy: {
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/,
    
        historyLimit: 3,
        forbiddenPasswords: ['123456', 'password', 'admin', 'welcome', 'qwerty', 'user']
    },
    
    loginPolicy: { 
        maxAttempts: 3, 
    },

   rateLimit: {
        windowMs: 15 * 60 * 1000, 
        max: 1000,
        message: { message: "Too many requests from this IP" }
    }
};