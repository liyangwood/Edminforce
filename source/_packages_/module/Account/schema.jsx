
Schema = {};

Schema.Account = {
    createdAt: KG.schema.createTime(),
    updatedAt: KG.schema.updateTime(),
    username: {
        type: String,
        unique : false,
        optional: true
    },
    emails: {
        type: [Object],
        optional: true
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: true
    },
    "emails.$.verified": {
        type: Boolean,
        optional: true
    },
    role : KG.schema.default({
        //defaultValue : 'admin',
        allowedValues : ['admin', 'user']
    }),
    schoolID : KG.schema.default({
        optional: true
    }),
    profile: {
        type: Object,
        optional: true,
        blackbox: true
    },
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    status : KG.schema.default({
        allowedValues : ['active', 'disable'],
        defaultValue : 'active'
    })
};