// when meteor startup, create all collections
Meteor.startup(function () {
    // Initial ProgramCollection
    EdminForce.Collections.program = new ProgramCollection("EF-Program");
    EdminForce.Collections.class = new ClassCollection("EF-Class");
    EdminForce.Collections.session = new SessionCollection("EF-Session");
    EdminForce.Collections.student = new StudentCollection("EF-Student");

    // Add user schema to Meteor.user
    Meteor.users.attachSchema(userSchema);
});