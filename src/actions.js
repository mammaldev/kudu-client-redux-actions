// Create generic Redux action creator functions for Kudu client applications.
// The exposed actions rely on redux-thunk store middleware and are used to make
// requests to the generic route handlers of a server-side Kudu application.
//
// Usage (assuming a configured Kudu client application instance as `kudu`, a
// model registered with that application with singular type "user" and a
// configured Redux store as `store`):
//
//   ```
//   import createKuduActionCreators from 'kudu-client-redux-actions';
//   const actions = createKuduActionCreators(kudu);
//
//   store.dispatch(actions.getAll('user'));
//   ```
//
export default function createKuduActionCreators( kudu ) {

  return {

    // Make a request to the server to persist a model instance. Generally this
    // would result in a POST request to a URL in the format /api/:type. Any
    // options supported by the Kudu client library are supported here and are
    // simply passed through.
    //
    // Arguments:
    //   instance    {Object}    The Kudu model instance to persist.
    //
    save( type, instance, opts = {} ) {

      return ( dispatch ) => {

        if ( !instance || typeof instance.save !== 'function' ) {
          throw new Error('Expected a model instance to save.');
        }

        const type = instance.constructor.singular;
        dispatch(saveRequested(type));

        return instance.save(opts)
        .then(( instance ) => dispatch(saveSucceeded(type, instance)))
        .catch(( error ) => dispatch(saveFailed(type, error)));
      };
    },

    // Make a request to the server for a specific instance of the given type.
    // Generally this would result in a GET request to a URL in the format
    // /api/:type/:id. Any options supported by the Kudu client library are
    // supported here and simply passed through.
    //
    // Arguments:
    //   type    {String}    The singular name of a model registered with the
    //                       given Kudu instance.
    //   id      {String}    The unique identifier of a specific model instance.
    //
    get( type, id, opts = {} ) {

      return ( dispatch ) => {

        const Model = kudu.getModel(type);

        if ( !Model ) {
          throw new Error(`No model constructor found for type "${ type }"`);
        }

        const singular = Model.singular;
        dispatch(getRequested(singular, id));

        return Model.get(id, opts)
        .then(( instance ) => dispatch(getSucceeded(singular, instance)))
        .catch(( error ) => dispatch(getFailed(singular, error)));
      };
    },

    // Make a request to the server for all instances of the given type.
    // Generally this would result in a GET request to a URL in the format
    // /api/:type. Any options supported by the Kudu client library are
    // supported here and simply passed through.
    //
    // Arguments:
    //   type    {String}    The singular name of a model registered with the
    //                       given Kudu instance.
    //
    getAll( type, opts = {} ) {

      return ( dispatch ) => {

        const Model = kudu.getModel(type);

        if ( !Model ) {
          throw new Error(`No model constructor found for type "${ type }"`);
        }

        dispatch(getAllRequested(Model.plural));
        return Model.getAll(opts)
        .then(( instances ) =>
          dispatch(getAllSucceeded(Model.plural, instances))
        )
        .catch(( error ) =>
          dispatch(getAllFailed(Model.plural, error))
        );
      };
    },

    // Make a request to the server to update a stored model instance. Generally
    // this would result in a PATCH request to a URL in the format
    // /api/:type/:id. Any options supported by the Kudu client library are
    // supported here and simply passed through.
    update( type, instance, opts = {} ) {

      return ( dispatch ) => {

        if ( !instance || typeof instance.update !== 'function' ) {
          throw new Error('Expected a model instance to update.');
        }

        const type = instance.constructor.singular;
        dispatch(updateRequested(type));

        return instance.update(opts)
        .then(( instance ) => dispatch(updateSucceeded(type, instance)))
        .catch(( error ) => dispatch(updateFailed(type, error)));
      };
    },
  };
}

// Dispatched when the "save" action creator is run.
//
// Arguments:
//   type    {String}    The singular name of a Kudu model.
//
function saveRequested( type ) {
  return {
    type: `SAVE_${ type.toUpperCase() }`,
  };
}

// Dispatched when a "save" action has completed successfully.
//
// Arguments:
//   type        {String}    The singular name of a Kudu model.
//   instance    {Object}    The instance that has been saved.
//
function saveSucceeded( type, instance ) {
  return {
    type: `SAVE_${ type.toUpperCase() }_SUCCEEDED`,
    [ type ]: instance,
  };
}

// Dispatched when a "save" action has failed.
//
// Arguments:
//   type     {String}    The singular name of a Kudu model.
//   error    {Error}     An Error object representing the reason for failure.
//
function saveFailed( type, error ) {
  return {
    type: `SAVE_${ type.toUpperCase() }_FAILED`,
    error,
  };
}

// Dispatched when a "get" action is dispatched.
//
// Arguments:
//   type    {String}    The singular name of the Kudu model being requested.
//   id      {String}    The unique identifier of the instance being requested.
//
function getRequested( type, id ) {
  return {
    type: `GET_${ type.toUpperCase() }`,
    id,
  };
}

// Dispatched when a "get" action completes successfully.
//
// Arguments:
//   type        {String}    The singular name of a model registered with a Kudu
//                           app.
//   instance    {Object}    A Kudu model instance of the type specified.
//
function getSucceeded( type, instance ) {
  return {
    type: `GET_${ type.toUpperCase() }_SUCCEEDED`,
    [ type ]: instance,
  };
}

// Dispatched when a "get" action fails.
//
// Arguments:
//   type     {String}    The singular name of the model that was requested.
//   error    {Error}     An Error object representing the reason for failure.
//
function getFailed( type, error ) {
  return {
    type: `GET_${ type.toUpperCase() }_FAILED`,
    error,
  };
}

// Dispatched when a "getAll" action is dispatched.
//
// Arguments:
//   type    {String}    The plural name of the Kudu model being requested.
//
function getAllRequested( type ) {
  return {
    type: `GET_ALL_${ type.toUpperCase() }`,
  };
}

// Dispatched when a "getAll" action completes successfully.
//
// Arguments:
//   type         {String}    The plural name of a model registered with a Kudu
//                            app.
//   instances    {Array}     An array of Kudu model instances of the type
//                            specified.
//
function getAllSucceeded( type, instances ) {
  return {
    type: `GET_ALL_${ type.toUpperCase() }_SUCCEEDED`,
    [ type ]: instances,
  };
}

// Dispatched when a "getAll" action fails.
//
// Arguments:
//   type     {String}    The plural name of the model that was requested.
//   error    {Error}     An Error object representing the reason for failure.
//
function getAllFailed( type, error ) {
  return {
    type: `GET_ALL_${ type.toUpperCase() }_FAILED`,
    error,
  };
}

// Dispatched when the "update" action creator is run.
//
// Arguments:
//   type    {String}    The singular name of a Kudu model.
//
function updateRequested( type ) {
  return {
    type: `UPDATE_${ type.toUpperCase() }`,
  };
}

// Dispatched when an "update" action has completed successfully.
//
// Arguments:
//   type        {String}    The singular name of a Kudu model.
//   instance    {Object}    The instance that has been saved.
//
function updateSucceeded( type, instance ) {
  return {
    type: `UPDATE_${ type.toUpperCase() }_SUCCEEDED`,
    [ type ]: instance,
  };
}

// Dispatched when an "update" action has failed.
//
// Arguments:
//   type     {String}    The singular name of a Kudu model.
//   error    {Error}     An Error object representing the reason for failure.
//
function updateFailed( type, error ) {
  return {
    type: `UPDATE_${ type.toUpperCase() }_FAILED`,
    error,
  };
}
