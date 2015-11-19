// Make a request to the server for all instances of the given type. Generally
// this would result in a GET request to a URL in the format /api/:type.
//
// Arguments:
//   kudu    {Kudu}      A Kudu client application instance.
//   type    {String}    The singular name of a model registered with the given
//                       Kudu instance.
//
export function getAll( kudu, type ) {

  return ( dispatch ) => {

    const Model = kudu.getModel(type);

    if ( !Model ) {
      throw new Error(`No model constructor found for type "${ type }"`);
    }

    dispatch(getAllRequested(Model.plural));
    return Model.getAll()
    .then(( instances ) => dispatch(getAllSucceeded(Model.plural, instances)))
    .catch(( error ) => dispatch(getAllFailed(Model.plural, error)));
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
