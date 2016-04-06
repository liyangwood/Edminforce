
// account > alternative contract
const reactiveFnAccountEmergency = ({context,actions}, onData) => {
    const error = context.LocalState.get('ERROR_ACCOUNT_EMERGENCY');
    context.SubManager.subscribe('account');
    if (context.SubManager.ready()) {
        if (!Meteor.userId()) return;

        let customer = Collections.Customer.findOne({_id:Meteor.userId()});
        let emergencyContact = customer ? customer.emergencyContact: {};
        onData(null, {
            emergencyContact,
            error
        })
    }

    return actions.clearErrors.bind(null,'ERROR_ACCOUNT_EMERGENCY');
};

EdminForce.Containers.AccountEmergency = Composer.composeWithTracker(reactiveFnAccountEmergency)(EdminForce.Components.AccountEmergency);

