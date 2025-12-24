const mongoose = require('mongoose');

const tokenGlossarySchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'token_glossary'
});

module.exports = mongoose.model('TokenGlossary', tokenGlossarySchema);
