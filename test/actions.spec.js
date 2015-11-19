import chai from 'chai';
import { applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import Kudu from 'kudu-client';
import nock from 'nock';
import * as actions from '../src/actions';

const expect = chai.expect;
const mockApp = new Kudu({
  baseURL: 'http://example.com',
});
const middlewares = [ thunk ];

// Create a Kudu model.
const MockModel = mockApp.createModel('test', {
  properties: {
    name: {
      type: String,
      required: true,
    },
  },
});

// Create a mock Redux store with middleware. Adapted from
// http://rackt.org/redux/docs/recipes/WritingTests.html#async-action-creators.
function mockStore( getState, expectedActions, done ) {

  if ( !Array.isArray(expectedActions) ) {
    throw new Error('Expected an array of expected actions.');
  }

  if ( typeof done !== 'function' && done !== undefined ) {
    throw new Error('Expected a callback function.');
  }

  function mockStoreWithoutMiddleware() {

    return {
      getState() {
        return typeof getState === 'function' ? getState() : getState;
      },
      dispatch( action ) {

        const expectedAction = expectedActions.shift();

        try {

          expect(action.type).to.equal(expectedAction.type);

          if ( done && !expectedActions.length ) {
            done();
          }
        } catch ( e ) {
          done(e);
        }
      },
    };
  }

  return applyMiddleware(...middlewares)(mockStoreWithoutMiddleware)();
}


describe('Actions', () => {

  describe('getAll', () => {

    it('creates GET_ALL_SUCCEEDED when the request completes successfully', ( done ) => {

      let data = [
        { type: 'test', id: '1' },
        { type: 'test', id: '2' },
      ];
      let expectedActions = [
        { type: 'GET_ALL_TESTS' },
        { type: 'GET_ALL_TESTS_SUCCEEDED' },
      ];
      let store = mockStore({}, expectedActions, done);

      nock('http://example.com').get('/tests').reply(200, { data });
      store.dispatch(actions.getAll(mockApp, 'test'));
    });

    it('creates GET_ALL_FAILED when the request fails', ( done ) => {

      let expectedActions = [
        { type: 'GET_ALL_TESTS' },
        { type: 'GET_ALL_TESTS_FAILED' },
      ];
      let store = mockStore({}, expectedActions, done);

      nock('http://example.com').get('/tests').reply(500);
      store.dispatch(actions.getAll(mockApp, 'test'));
    });
  });
});
